// Page switching, storefront interactions and admin actions.
const $ = (id) => document.getElementById(id);
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image = (name) => 'assets/' + name;
let products = [];
let category = 'All';
let cart = [];

async function api(path, options = {}) {
  const response = await fetch('/api/' + path, {
    ...options, headers: { 'Content-Type':'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Something went wrong');
  return data;
}
function notify(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => $('toast').classList.remove('show'), 2800);
}
async function refreshProducts() {
  products = await api('products');
  renderStore();
  renderCart();
}
function renderStore() {
  const list = products.filter(p => category === 'All' || p.category === category);
  $('productGrid').innerHTML = list.map((p, index) => `
    <article class="product-card">
      <div class="product-photo tone-${products.indexOf(p) % 6}">
        <span class="product-label">${escapeHTML(p.stock ? p.tag : 'SOLD OUT')}</span>
        <img src="${image(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy">
        <button class="quick-add" data-add="${p.id}" aria-label="Add ${escapeHTML(p.name)} to bag" ${p.stock ? '' : 'disabled'}>${p.stock ? '+' : '×'}</button>
      </div><div class="product-info"><div><small>${escapeHTML(p.category)} / DAILY ESSENTIALS</small><h3>${escapeHTML(p.name)}</h3></div><strong>${money(p.price)}</strong></div>
    </article>`).join('') || '<p>No products in this category yet.</p>';
}
function renderCart() {
  cart = cart.filter(item => products.some(p => p.id === item.id));
  $('cartCount').textContent = cart.length;
  $('drawerCount').textContent = `(${cart.length})`;
  $('cartItems').innerHTML = cart.length ? cart.map(item => {
    const p = products.find(p => p.id === item.id);
    return `<div class="cart-item"><img src="${image(p.image)}" alt=""><div><strong>${escapeHTML(p.name)}</strong><small>${money(p.price)}</small><button data-remove="${p.id}">Remove</button></div></div>`;
  }).join('') : '<p class="empty-bag">Your bag is empty.<br>Add something you love!</p>';
  $('cartTotal').textContent = money(cart.reduce((sum, item) => sum + products.find(p => p.id === item.id).price, 0));
}
function toggleCart(open) {
  $('cartDrawer').classList.toggle('open', open);
  $('overlay').classList.toggle('hidden', !open);
}
async function route() {
  const hash = location.hash || '#home';
  const adminRoute = hash === '#admin' || hash === '#inventory';
  if (adminRoute) {
    try {
      const session = await api('session');
      if (!session.loggedIn) { location.hash = '#login'; return; }
      await renderAdmin();
    } catch { notify('Start the server with: node server.js'); return; }
  }
  $('storePage').classList.toggle('hidden', hash === '#login' || adminRoute);
  $('loginPage').classList.toggle('hidden', hash !== '#login');
  $('adminPage').classList.toggle('hidden', !adminRoute);
  document.title = `${adminRoute ? 'Dashboard' : hash === '#login' ? 'Admin login' : 'Shop'} — orbit.`;
  if (hash === '#collection' || hash === '#story' || hash === '#inventory') {
    setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 70);
  } else window.scrollTo(0, 0);
}
async function renderAdmin() {
  const data = await api('dashboard');
  products = data.products;
  $('revenueMetric').textContent = money(data.revenue);
  $('ordersMetric').textContent = data.totalOrders;
  $('productsMetric').textContent = products.length;
  $('stockMetric').textContent = products.reduce((n, p) => n + p.stock, 0);
  $('inventoryCount').textContent = products.length;
  $('revenueChart').innerHTML = [42, 58, 49, 72, 67, 92].map((height, i) => `<div class="bar-column"><i style="height:${height}%"></i><small>${['May','Jun','Jul','Aug','Sep','Oct'][i]}</small></div>`).join('');
  $('ordersList').innerHTML = data.orders.map(o => `<div class="order-row"><span class="order-thumb">${escapeHTML(o.customer.charAt(0))}</span><div class="order-info"><strong>${escapeHTML(o.customer)}</strong><small>${escapeHTML(o.item)} · ${escapeHTML(o.date)}</small></div><span class="order-price">${money(o.amount)}</span><span class="order-state">${escapeHTML(o.status)}</span></div>`).join('');
  $('inventoryBody').innerHTML = products.map(p => `<tr>
    <td><div class="table-product"><div class="mini-photo"><img src="${image(p.image)}" alt=""></div><strong>${escapeHTML(p.name)}</strong></div></td>
    <td>${escapeHTML(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td>
    <td><span class="stock-pill ${p.stock === 0 ? 'out' : p.stock < 10 ? 'low' : ''}">${p.stock === 0 ? 'Out of stock' : p.stock < 10 ? 'Low stock' : 'In stock'}</span></td>
    <td><button class="edit-btn" data-edit="${p.id}">Edit</button><button class="delete-btn" data-delete="${p.id}">Delete</button></td>
  </tr>`).join('');
  renderStore();
}
function openEditor(id) {
  const p = products.find(p => p.id === id);
  $('dialogTitle').textContent = p ? 'Edit product' : 'Add product';
  $('productId').value = p?.id || '';
  $('productName').value = p?.name || '';
  $('productPrice').value = p?.price || '';
  $('productStock').value = p?.stock ?? 10;
  $('productCategory').value = p?.category || 'Tech';
  $('productImage').value = p?.image || 'headphones.svg';
  $('productDialog').showModal();
}

// Events: all important buttons work; no frameworks are needed.
$('filters').addEventListener('click', e => {
  const button = e.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('selected', c === button));
  renderStore();
});
$('productGrid').addEventListener('click', e => {
  const button = e.target.closest('[data-add]');
  if (!button) return;
  const id = Number(button.dataset.add);
  if (products.find(p => p.id === id)?.stock <= 0) return;
  cart.push({ id }); renderCart(); notify('Added to your bag');
});
$('cartItems').addEventListener('click', e => {
  const button = e.target.closest('[data-remove]');
  if (!button) return;
  const position = cart.findIndex(item => item.id === Number(button.dataset.remove));
  if (position !== -1) cart.splice(position, 1);
  renderCart();
});
$('cartButton').onclick = () => toggleCart(true);
$('closeCart').onclick = () => toggleCart(false);
$('overlay').onclick = () => toggleCart(false);
$('checkoutButton').onclick = () => notify('This is a demo store — checkout is not enabled.');
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('loginError').textContent = '';
  try {
    await api('login', { method:'POST', body:{ email:$('email').value, password:$('password').value } });
    location.hash = '#admin';
    await route();
  } catch (error) { $('loginError').textContent = error.message; }
});
$('logoutButton').onclick = async () => {
  await api('logout', { method:'POST' });
  location.hash = '#login';
  notify('Logged out successfully');
};
$('addProductButton').onclick = () => openEditor();
$('closeDialog').onclick = () => $('productDialog').close();
$('inventoryBody').addEventListener('click', async e => {
  const edit = e.target.closest('[data-edit]');
  const remove = e.target.closest('[data-delete]');
  if (edit) openEditor(Number(edit.dataset.edit));
  if (remove && confirm('Delete this product from the store?')) {
    try {
      await api('products/' + remove.dataset.delete, { method:'DELETE' });
      await renderAdmin(); notify('Product deleted');
    } catch (error) { notify(error.message); }
  }
});
$('productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('productId').value;
  const body = { name:$('productName').value, price:Number($('productPrice').value), stock:Number($('productStock').value), category:$('productCategory').value, image:$('productImage').value };
  try {
    await api('products' + (id ? '/' + id : ''), { method:id ? 'PUT' : 'POST', body });
    $('productDialog').close();
    await renderAdmin();
    notify(id ? 'Product updated' : 'New product added');
  } catch (error) { notify(error.message); }
});
window.addEventListener('hashchange', route);
refreshProducts().then(route).catch(() => notify('To open the website, run: node server.js'));
