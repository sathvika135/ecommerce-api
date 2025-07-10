const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { placeOrder, getOrders } = require('../controllers/ordercontroller');

router.post('/', protect, placeOrder);
router.get('/', protect, getOrders);

module.exports = router;
