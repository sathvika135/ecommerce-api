const Cart = require('../models/cart');
const Product = require('../models/product');

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const cartItem = {
      product: productId,
      quantity,
    };

    let cart = await Cart.findOne({ customer: req.user.id });
    if (!cart) {
      cart = new Cart({
        customer: req.user.id,
        items: [cartItem],
      });
    } else {
      const existingItem = cart.items.find(i => i.product.toString() === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push(cartItem);
      }
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.viewCart = async (req, res) => {
  console.log(`viewCart called for user ${req.user?.id}`);
  try {
    const cart = await Cart.findOne({ customer: req.user.id }).populate('items.product');
    if (!cart) {
      console.log('No cart found, returning empty items.');
      return res.json({ items: [] });
    }
    console.log('Cart found:', cart);
    res.json(cart);
  } catch (err) {
    console.error('Error in viewCart:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


