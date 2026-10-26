
const { cartService } = require('../services/cartService');
const { courseService } = require('../services/courseService');
const { enrollmentService } = require('../services/enrollmentService');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

function requireCartUser(req) {
  if (!req.user?.id || !req.accessToken) {
    throw new ApiError('Please log in to use your saved cart.', 401);
  }

  return {
    userId: req.user.id,
    accessToken: req.accessToken,
  };
}

const cartController = {
  getCart: asyncHandler(async (req, res) => {
    const { userId, accessToken } = requireCartUser(req);
    const cart = await cartService.getCart(userId, accessToken);

    res.json({ success: true, cart });
  }),

  addItem: asyncHandler(async (req, res) => {
    const { userId, accessToken } = requireCartUser(req);
    const { courseId } = req.body;

    if (!courseId) {
      throw new ApiError('Course ID is required.', 400);
    }

    const cart = await cartService.addItem(
      userId,
      courseId,
      accessToken
    );

    res.status(201).json({
      success: true,
      message: 'Course added to cart',
      cart,
    });
  }),

  removeItem: asyncHandler(async (req, res) => {
    const { userId, accessToken } = requireCartUser(req);

    const cart = await cartService.removeItem(
      userId,
      req.params.courseId,
      accessToken
    );

    res.json({
      success: true,
      message: 'Course removed from cart',
      cart,
    });
  }),

  applyCoupon: asyncHandler(async (req, res) => {
    requireCartUser(req);

    const { code } = req.body;

    if (!code) {
      throw new ApiError('Coupon code is required.', 400);
    }

    const result = await cartService.applyCoupon(code);

    if (!result.success) {
      throw new ApiError(result.message, 400);
    }

    res.json({
      success: true,
      message: `Coupon '${code}' applied successfully`,
      coupon: result.coupon,
    });
  }),

  getCoupons: asyncHandler(async (_req, res) => {
    const coupons = cartService.getAvailableCoupons();

    res.json({
      success: true,
      coupons,
      note: 'Available coupons for order discount',
    });
  }),

  checkout: asyncHandler(async (req, res) => {
    const { userId, accessToken } = requireCartUser(req);
    const { paymentMethod, billingDetails } = req.body || {};

    const cart = await cartService.getCart(userId, accessToken);

    if (cart.items.length === 0) {
      throw new ApiError('Cart is empty.', 400);
    }

    // This records enrollments; it does not process a real payment.
    const enrolledCourses = [];

    for (const item of cart.items) {
      try {
        const enrollment = await enrollmentService.enroll(
          userId,
          item.courseId
        );

        enrolledCourses.push(enrollment);
      } catch (error) {
        console.warn('Enrollment note:', error.message);
      }
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    const orderId = `ORD-${Date.now()}`;

    await cartService.clearCart(userId, accessToken);

    res.json({
      success: true,
      message: 'Cart cleared and enrollment attempted.',
      order: {
        orderId,
        items: cart.items,
        total: totalAmount,
        paymentMethod: paymentMethod || 'card',
        billingDetails: billingDetails || {},
        enrolledCourses,
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    });
  }),
};

module.exports = { cartController };
