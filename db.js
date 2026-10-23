// Tiny JSON database: no MongoDB, MySQL, or npm packages needed.
const fs = require('fs');
const path = require('path');
const file = (process.env.DATA_FILE || path.join(__dirname, 'store-data.json'));

const starterData = {
  products: [
    { id: 1, name: 'Cloud Headphones', category: 'Audio', price: 2499, stock: 28, image: 'headphones.svg', tag: 'BEST SELLER' },
    { id: 2, name: 'Halo Smartwatch', category: 'Tech', price: 3999, stock: 14, image: 'watch.svg', tag: 'NEW ARRIVAL' },
    { id: 3, name: 'Mini Soundbox', category: 'Audio', price: 1899, stock: 31, image: 'speaker.svg', tag: 'POPULAR' },
    { id: 4, name: 'Snap Camera', category: 'Tech', price: 4299, stock: 9, image: 'camera.svg', tag: 'LIMITED' },
    { id: 5, name: 'Glow Desk Lamp', category: 'Lifestyle', price: 2199, stock: 17, image: 'lamp.svg', tag: 'TRENDING' },
    { id: 6, name: 'Type Mini Keyboard', category: 'Tech', price: 3299, stock: 0, image: 'keyboard.svg', tag: 'SOLD OUT' }
  ],
  orders: [
    { customer: 'Aarav Mehta', item: 'Cloud Headphones', amount: 2499, date: 'Today', status: 'Paid' },
    { customer: 'Riya Shah', item: 'Halo Smartwatch', amount: 3999, date: 'Yesterday', status: 'Paid' },
    { customer: 'Kabir Patel', item: 'Mini Soundbox', amount: 1899, date: 'Yesterday', status: 'Paid' },
    { customer: 'Sara Khan', item: 'Glow Desk Lamp', amount: 2199, date: '2 days ago', status: 'Paid' }
  ],
  revenue: 84250,
  totalOrders: 128
};

function read() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(starterData, null, 2));
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function save(data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
module.exports = { read, save };
