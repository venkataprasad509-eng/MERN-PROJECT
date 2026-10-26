
const { Router } = require('express');
const { body } = require('express-validator');
const { cartController } = require('../controllers/cartController');
const { validateRequest } = require('../middleware/validateRequest');
const supabase = require('../config/supabase');

// Identify the logged-in Supabase user, while allowing guest access.
async function optionalAuth(req, _res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme === 'Bearer' && token) {
      const { data, error } = await supabase.auth.getUser(token);

      if (!error && data?.user) {
        req.user = data.user;
        req.accessToken = token;
      }
    }
  } catch (error) {
    console.error('Optional cart authentication failed:', error.message);
  }

  next();
}

const router = Router();

router.use(optionalAuth);

// Get the current user's cart.
router.get('/', cartController.getCart);

// Add a course to the cart.
router.post(
  '/items',
  [body('courseId').notEmpty().withMessage('courseId is required')],
  validateRequest,
  cartController.addItem
);

// Remove a course from the cart.
router.delete('/items/:courseId', cartController.removeItem);

// Apply a coupon.
router.post(
  '/coupon',
  [body('code').notEmpty().withMessage('Coupon code is required')],
  validateRequest,
  cartController.applyCoupon
);

// Get available coupons.
router.get('/coupons', cartController.getCoupons);

// Checkout.
router.post('/checkout', cartController.checkout);

module.exports = router;
