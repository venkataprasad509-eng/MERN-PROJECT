
const { Router } = require('express');

const { adminController } = require('../controllers/adminController');
const { couponController } = require('../controllers/couponController');

const { requireAuth } = require('../middleware/requireAuth');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = Router();

// Existing admin dashboard
router.get('/dashboard', adminController.getDashboard);

// Coupon management — admin only
router.get(
  '/coupons',
  requireAuth,
  requireAdmin,
  couponController.list
);

router.post(
  '/coupons',
  requireAuth,
  requireAdmin,
  couponController.create
);

module.exports = router;
