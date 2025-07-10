require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/products');

const products = [
  { name: 'Laptop', description: 'Powerful laptop', price: 1200, stock: 5 },
  { name: 'Phone', description: 'Smartphone', price: 700, stock: 20 },
  { name: 'Headphones', description: 'Noise cancelling', price: 150, stock: 15 }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('Sample products seeded');
    process.exit();
  })
  .catch(err => console.error(err));
