
const express = require('express');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

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

    next();
  } catch (error) {
    next(error);
  }
}

// Connect to Supabase using the logged-in user's token.
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

// STEP 1: Create a Razorpay order.
router.post('/create-order', requireAuth, async (req, res, next) => {
  try {
    const supabase = getUserSupabase(req.accessToken);

    const { data: cartRows, error: cartError } = await supabase
      .from('cart_items')
      .select('course_id')
      .eq('user_id', req.user.id);

    if (cartError) throw cartError;

    if (!cartRows || cartRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty.',
      });
    }

    const courseIds = cartRows.map((row) => row.course_id);

    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, original_price, status')
      .in('id', courseIds);

    if (courseError) throw courseError;

    if (!courses || courses.length !== courseIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some courses in your cart could not be found.',
      });
    }

    let totalRupees = 0;

    for (const course of courses) {
      if (course.status !== 'published') {
        return res.status(400).json({
          success: false,
          message: `The course "${course.title}" is not available for purchase.`,
        });
      }

      // Always calculate the price from the database.
      const price = Number(course.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'A course has an invalid price.',
        });
      }

      totalRupees += price;
    }

    const amountPaise = Math.round(totalRupees * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'The checkout total must be greater than zero.',
      });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `user_${req.user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: req.user.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Razorpay order created successfully.',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
});

// STEP 2: Verify the payment after Razorpay Checkout completes.
router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment details are incomplete.',
      });
    }

    // Confirm that this order belongs to the logged-in user.
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (order.notes?.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'This payment order does not belong to you.',
      });
    }

    // Verify the Razorpay payment signature.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed.',
      });
    }

    // Confirm the payment belongs to this order and is captured.
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== 'captured' ||
      payment.amount !== order.amount ||
      payment.currency !== order.currency
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment could not be confirmed.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: payment.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
