const Order = require('../models/order');
const Cart = require('../models/cart');

exports.placeOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user.id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const order = new Order({
      customer: req.user.id,
      items: cart.items.map(i => ({
        product: i.product._id,
        quantity: i.quantity
      })),
      total
    });

    await order.save();
    cart.items = [];
    await cart.save();

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.product');

    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found' });
    }
    res.json(orders);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

