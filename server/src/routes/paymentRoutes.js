
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const {
  createOrder,
  verifyPayment,
} = require('../controllers/paymentController');

const router = express.Router();

// Connect Supabase using the logged-in user's token.
function getUserSupabase(token) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

// Verify that the user is logged in.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in before checkout.',
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: 'Your session is invalid. Please log in again.',
      });
    }

    req.user = data.user;
    req.accessToken = token;
    req.userSupabase = getUserSupabase(token);

    next();
  } catch (error) {
    next(error);
  }
}

// STEP 1: Create a Razorpay order.
// Supports both Buy Now and Cart Checkout.
router.post('/create-order', requireAuth, createOrder);

// STEP 2: Verify the Razorpay payment.
router.post('/verify', requireAuth, verifyPayment);

module.exports = router;
