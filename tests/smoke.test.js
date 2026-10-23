// Exam-friendly integration test: uses only Node.js built-ins.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const delay = ms => new Promise(r => setTimeout(r, ms));

async function openPort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function setup() {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'wtl-demo-'));
  const port = await openPort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port), DATA_FILE: path.join(folder, 'test.json') },
    stdio: 'ignore'
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) break;
    try { const r = await fetch(base + '/health'); if (r.ok) return { folder, child, base }; } catch {}
    await delay(100);
  }
  child.kill();
  fs.rmSync(folder, { recursive: true, force: true });
  throw new Error('Server did not start');
}

async function call(base, url, method = 'GET', data, cookie = '') {
  const response = await fetch(base + url, {
    method,
    headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  return { status: response.status, headers: response.headers, data: await response.json().catch(() => ({})) };
}

test('Orbit: pages, login, API editing, and logout', async () => {
  const { base, child, folder } = await setup();
  try {
    const homepage = await fetch(base + '/');
    assert.equal(homepage.status, 200);
    assert.match(await homepage.text(), /<html/i);
    assert.equal((await fetch(base + '/style.css')).status, 200);
    assert.equal((await fetch(base + '/script.js')).status, 200);
    assert.equal((await fetch(base + '/db.js')).status, 404);
    assert.equal((await fetch(base + '/store-data.json')).status, 404);
    
  const catalog = await call(base, '/api/products');
  assert.equal(catalog.status, 200);
  assert.equal(catalog.data.length, 6);
  assert.equal((await call(base, '/api/dashboard')).status, 401);

  const login = await call(base, '/api/login', 'POST', { email: 'admin@orbit.shop', password: 'admin123' });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await call(base, '/api/dashboard', 'GET', undefined, cookie)).status, 200);

  const item = { name: 'Test Keyboard', price: 999, stock: 4, category: 'Tech', image: 'keyboard.svg' };
  assert.equal((await call(base, '/api/products', 'POST', item, cookie)).status, 200);
  const product = (await call(base, '/api/products')).data.find(p => p.name === item.name);
  assert.ok(product?.id);
  assert.equal((await call(base, `/api/products/${product.id}`, 'PUT', {...item,price:1199}, cookie)).status, 200);
  assert.equal((await call(base, '/api/products')).data.find(p => p.id === product.id).price, 1199);
  assert.equal((await call(base, `/api/products/${product.id}`, 'DELETE', undefined, cookie)).status, 200);
  assert.equal((await call(base, '/api/products')).data.length, 6);
  assert.equal((await call(base, '/api/logout', 'POST', undefined, cookie)).status, 200);
  assert.equal((await call(base, '/api/dashboard', 'GET', undefined, cookie)).status, 401);

    assert.ok(fs.existsSync(path.join(folder, 'test.json')));
  } finally {
    child.kill();
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
