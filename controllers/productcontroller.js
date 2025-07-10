const Product = require('../models/product');

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({ total, page: Number(page), products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

exports.addProduct = async (req, res) => {
  console.log(' addProduct called');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  try {
    const { name, description, category, price, stock } = req.body;
    const product = new Product({ name, description, category, price, stock });
    await product.save();
    res.json({ message: 'Product added', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Deleted product:', deleted);

    res.json({ message: 'Product deleted', deleted });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};