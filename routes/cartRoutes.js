const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { addToCart, viewCart } = require('../controllers/cartcontroller');

router.post('/', protect, addToCart);
router.get('/', protect, viewCart);

module.exports = router;
