const fetch = require('node-fetch');
const prompt = require('prompt-sync')();
const fs = require('fs');
const baseUrl = 'http://localhost:5000';
const API_URL = `${baseUrl}/api`;
const statePath = __dirname + '/state.json';

if (!fs.existsSync(statePath)) {
  fs.writeFileSync(statePath, JSON.stringify({ adminToken: '', customerToken: '' }, null, 2));
}

function loadState() {
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

function saveState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

async function register() {
  const username = prompt('Username: ');
  const password = prompt('Password: ');
  const role = prompt('Role (admin/customer): ');

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) console.log(' Registration successful.');
  else console.log(' Registration failed.');
}

async function login() {
  const username = prompt('Username: ');
  const password = prompt('Password: ');

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    console.log(` Login failed: ${data.message || res.status}`);
    return;
  }

  console.log(' Login response:', data);

  const state = loadState();
  if (data.user.role === 'admin') {
    state.adminToken = data.token;
    console.log(' Admin token saved.');
  } else {
    state.customerToken = data.token;
    console.log(' Customer token saved.');
  }
  saveState(state);
}

async function listProducts() {
  try {
    const res = await fetch(`${API_URL}/products`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(' Failed to fetch products:', data.message || res.status);
      return [];
    }

    if (!data.products || data.products.length === 0) {
      console.log(' No products found.');
      return [];
    }

    console.log('\n Available Products:');
    data.products.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name} | ₹${p.price} | Stock: ${p.stock}`);
    });
    console.log('');

    return data.products;

  } catch (err) {
    console.error(' Error while fetching products:', err.message);
    return [];
  }
}

async function addProduct() {
  const state = loadState();
  if (!state.adminToken) {
    console.log(' Please login as admin first.');
    return;
  }

  const name = prompt('Product name: ');
  const description = prompt('Description: ');
  const category = prompt('Category: ');
  const price = parseFloat(prompt('Price: '));
  const stock = parseInt(prompt('Stock: '), 10);

  if (!name || isNaN(price) || isNaN(stock)) {
    console.log(' Invalid input. Please enter all fields correctly.');
    return;
  }

  const payload = { name, description, category, price, stock };

  try {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(` Failed to add product:`, data);
    } else {
      console.log(' Product added successfully:');
      console.log(data);
    }
  } catch (err) {
    console.error(' Error while adding product:', err.message);
  }
}

async function updateProduct() {
  const state = loadState();
  if (!state.adminToken) {
    console.log(' Please login as admin first.');
    return;
  }

  const products = await listProducts();
  if (products.length === 0) {
    console.log(' No products available to update.');
    return;
  }

  const productNumber = parseInt(prompt('Enter product number to update: '), 10);
  if (isNaN(productNumber) || productNumber < 1 || productNumber > products.length) {
    console.log(' Invalid product number.');
    return;
  }

  const id = products[productNumber - 1]._id;

  const name = prompt('New name (leave blank to skip): ');
  const description = prompt('New description (leave blank to skip): ');
  const category = prompt('New category (leave blank to skip): ');
  const price = prompt('New price (leave blank to skip): ');
  const stock = prompt('New stock (leave blank to skip): ');

  const payload = {};
  if (name) payload.name = name;
  if (description) payload.description = description;
  if (category) payload.category = category;
  if (price) payload.price = parseFloat(price);
  if (stock) payload.stock = parseInt(stock, 10);

  if (Object.keys(payload).length === 0) {
    console.log(' No fields to update.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(` Failed to update product:`, data);
    } else {
      console.log(' Product updated successfully:');
      console.log(data);
    }
  } catch (err) {
    console.error(' Error while updating product:', err.message);
  }
}

async function deleteProduct() {
  const state = loadState();
  if (!state.adminToken) {
    console.log(' Please login as admin first.');
    return;
  }

  const products = await listProducts();
  if (products.length === 0) return;

  const serial = parseInt(prompt('Enter product number to delete: '), 10);
  if (isNaN(serial) || serial < 1 || serial > products.length) {
    console.log(' Invalid product number.');
    return;
  }
  const id = products[serial - 1]._id;

  const confirm = prompt('Are you sure? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log(' Delete cancelled.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.adminToken}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(` Failed to delete product:`, data);
    } else {
      console.log(' Product deleted successfully:');
      console.log(data);
    }
  } catch (err) {
    console.error(' Error while deleting product:', err.message);
  }
}

async function addToCart() {
  const state = loadState();
  if (!state.customerToken) {
    console.log(' Please login as customer first.');
    return;
  }

  const products = await listProducts();
  if (products.length === 0) return;

  const serial = parseInt(prompt('Enter product number: '), 10);
  if (isNaN(serial) || serial < 1 || serial > products.length) {
    console.log(' Invalid product number.');
    return;
  }
  const productId = products[serial - 1]._id;

  const quantity = parseInt(prompt('Quantity: '), 10);

  const res = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.customerToken}`
    },
    body: JSON.stringify({ productId, quantity })
  });

  const data = await res.json();

  if (!res.ok) console.log(` Failed to add to cart: ${data.message || res.status}`);
  else console.log(' Added to cart:', data);
}

async function viewCart() {
  const state = loadState();
  if (!state.customerToken) {
    console.log(' Please login as customer first.');
    return;
  }

  const res = await fetch(`${API_URL}/cart`, {
    headers: { 'Authorization': `Bearer ${state.customerToken}` }
  });

  const data = await res.json();
  console.log(data);
}

async function placeOrder() {
  const state = loadState();
  if (!state.customerToken) {
    console.log(' Please login as customer first.');
    return;
  }

  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.customerToken}`
    }
  });

  const data = await res.json();

  if (!res.ok) console.log(` Failed to place order: ${data.message || res.status}`);
  else console.log(' Order placed:', data);
}

async function viewOrders() {
  const state = loadState();
  if (!state.customerToken) {
    console.log(' Please login as customer first.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${state.customerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.log(` Failed to fetch orders: ${errorData.message}`);
      return;
    }

    const orders = await res.json();

    if (!orders.length) {
      console.log(' No orders found.');
      return;
    }

    console.log(' Your Orders:');
    orders.forEach((order, idx) => {
      console.log(`\nOrder #${idx + 1}`);
      console.log(` Order ID: ${order._id}`);
      console.log(` Total: ${order.total}`);
      console.log('Items:');
      order.items.forEach(item => {
        console.log(`- ${item.product.name} x${item.quantity}`);
      });
      console.log(` Date: ${new Date(order.createdAt).toLocaleString()}`);
    });

  } catch (err) {
    console.error(' Error fetching orders:', err.message);
  }
}

async function main() {
  while (true) {
    console.log(`
===========================
   E-Commerce API CLI
===========================
1 Register
2 Login
3 View Products
4 Add Product (admin)
5 Update Product (admin)
6 Delete Product (admin)
7 View Cart (customer)
8 Add to Cart (customer)
9 Place Order (customer)
10 View Orders (customer)
0 Exit
===========================
    `);

    const choice = prompt('Choose: ');

    switch (choice) {
      case '1': await register(); break;
      case '2': await login(); break;
      case '3': await listProducts(); break;
      case '4': await addProduct(); break;
      case '5': await updateProduct(); break;
      case '6': await deleteProduct(); break;
      case '7': await viewCart(); break;
      case '8': await addToCart(); break;
      case '9': await placeOrder(); break;
      case '10': await viewOrders(); break;
      case '0': process.exit(0);
      default: console.log('Invalid choice.');
    }
  }
}

main();
