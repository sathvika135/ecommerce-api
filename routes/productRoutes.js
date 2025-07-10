const express = require('express');
const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productcontroller');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();


router.get('/', getProducts);
router.post('/', protect, restrictTo('admin'), addProduct);
router.patch('/:id', protect, restrictTo('admin'), updateProduct);
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

module.exports = router;
