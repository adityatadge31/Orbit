// Start with: node server.js  |  Open: http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const sessions = new Set(); // Demo sessions reset when the server restarts.
const PORT = Number(process.env.PORT) || 3000;
const credentials = { email: 'admin@orbit.shop', password: 'admin123' }; // DEMO ONLY

function json(res, status, data, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...extra });
  res.end(JSON.stringify(data));
}
async function body(req) {
  let text = '';
  for await (const part of req) { text += part; if (text.length > 10000) throw Error('Request too large'); }
  return JSON.parse(text || '{}');
}
function serveFile(res, pathname) {
  const safe = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!['index.html', 'style.css', 'script.js'].includes(safe) && !/^assets\/[a-z0-9-]+\.svg$/.test(safe)) return json(res, 404, { error: 'Not found' });
  const file = path.join(__dirname, safe);
  fs.readFile(file, (error, contents) => {
    if (error) return json(res, 404, { error: 'File not found' });
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': ({ '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml' })[ext] });
    res.end(contents);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname;
  const session = (req.headers.cookie || '').match(/(?:^|;\s*)sid=([a-f0-9]+)/)?.[1];
  const loggedIn = sessions.has(session);
  try {
    if (route === '/health' && req.method === 'GET') return json(res, 200, { ok: true });
    if (route === '/api/products' && req.method === 'GET') return json(res, 200, db.read().products);
    if (route === '/api/session') return json(res, 200, { loggedIn });
    if (route === '/api/login' && req.method === 'POST') {
      const input = await body(req);
      if (input.email !== credentials.email || input.password !== credentials.password) return json(res, 401, { error: 'Incorrect email or password' });
      const id = crypto.randomBytes(24).toString('hex');
      sessions.add(id);
      return json(res, 200, { ok: true }, { 'Set-Cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
    }
    if (route === '/api/logout' && req.method === 'POST') {
      sessions.delete(session);
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/' });
    }
    if (route.startsWith('/api/')) {
      if (!loggedIn) return json(res, 401, { error: 'Please log in first' });
      const data = db.read();
      if (route === '/api/dashboard' && req.method === 'GET') return json(res, 200, data);
      const match = route.match(/^\/api\/products\/(\d+)$/);
      if (route === '/api/products' && req.method === 'POST' || match && req.method === 'PUT') {
        const input = await body(req);
        const allowedImages = ['headphones.svg','watch.svg','speaker.svg','camera.svg','lamp.svg','keyboard.svg'];
        const name = String(input.name || '').trim().slice(0, 60);
        const price = Number(input.price), stock = Number(input.stock);
        if (!name || !Number.isInteger(price) || price < 1 || !Number.isInteger(stock) || stock < 0 || !['Audio','Tech','Lifestyle'].includes(input.category) || !allowedImages.includes(input.image)) return json(res, 400, { error: 'Please enter valid product details' });
        const item = { name, price, stock, category: input.category, image: input.image, tag: stock ? 'CURATED PICK' : 'SOLD OUT' };
        if (match) {
          const product = data.products.find(p => p.id === Number(match[1]));
          if (!product) return json(res, 404, { error: 'Product not found' });
          Object.assign(product, item);
        } else data.products.push({ id: Date.now(), ...item });
        db.save(data);
        return json(res, 200, { ok: true });
      }
      if (match && req.method === 'DELETE') {
        data.products = data.products.filter(p => p.id !== Number(match[1]));
        db.save(data);
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'API route not found' });
    }
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
    serveFile(res, route);
  } catch (e) { json(res, 400, { error: 'Invalid request' }); }
}).listen(PORT, '0.0.0.0', () => console.log(`Orbit is running at http://localhost:${PORT}`));
