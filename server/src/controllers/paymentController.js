
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const { cartService } = require('../services/cartService');
const { enrollmentService } = require('../services/enrollmentService');

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay configuration is missing.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// Create Razorpay order for Buy Now or Cart Checkout.
const createOrder = async (req, res) => {
  try {
    if (!req.user?.id || !req.accessToken || !req.userSupabase) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue.',
      });
    }

    const razorpay = getRazorpay();
    const { courseId, courseIds, couponCode } = req.body || {};

    // Buy Now takes priority and includes only the selected course.
    let selectedCourseIds = [];

    if (courseId) {
      selectedCourseIds = [String(courseId)];
    } else if (Array.isArray(courseIds)) {
      selectedCourseIds = courseIds.map(String);
    }

    selectedCourseIds = [...new Set(selectedCourseIds)];

    if (!selectedCourseIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one course.',
      });
    }

    // Fetch actual course details from Supabase.
    const courseResults = await Promise.all(
      selectedCourseIds.map((id) => {
        let query = req.userSupabase
          .from('courses')
          .select('id, legacy_id, title, price');

        if (/^\d+$/.test(id)) {
          query = query.eq('id', Number(id));
        } else {
          query = query.eq('legacy_id', id);
        }

        return query.maybeSingle();
      })
    );

    const lookupError = courseResults.find((result) => result.error);

    if (lookupError) {
      console.error('Course lookup error:', lookupError.error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve course details.',
      });
    }

    const courses = courseResults.map((result) => result.data).filter(Boolean);

    if (courses.length !== selectedCourseIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more selected courses were not found.',
      });
    }

    // Convert to actual Supabase database IDs.
    const savedCourses = courses.map((course) => {
      const price = Number(course.price);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`Invalid price for course: ${course.title}`);
      }

      return {
        courseId: String(course.id),
        title: course.title,
        price,
      };
    });

    const subtotal = Number(
      savedCourses
        .reduce((sum, course) => sum + course.price, 0)
        .toFixed(2)
    );

    let discountAmount = 0;
    let finalTotal = subtotal;
    let appliedCoupon = null;

    // Validate coupon again on the backend.
    if (couponCode && String(couponCode).trim()) {
      const couponResult = await cartService.validateCoupon(
        couponCode,
        String(req.user.id),
        req.accessToken,
        savedCourses.map((course) => course.courseId)
      );

      discountAmount = Number(couponResult.discountAmount || 0);
      finalTotal = Number(couponResult.payableTotal);
      appliedCoupon = couponResult.coupon;
    }

    finalTotal = Number(finalTotal.toFixed(2));

    if (!Number.isFinite(finalTotal) || finalTotal < 1) {
      return res.status(400).json({
        success: false,
        message: 'The final payment amount must be at least ₹1.',
      });
    }

    const amount = Math.round(finalTotal * 100);

    if (!Number.isSafeInteger(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount.',
      });
    }

    // Create Razorpay order.
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `lh_${Date.now()}`,
      notes: {
        userId: String(req.user.id),
        courseIds: savedCourses.map((course) => course.courseId).join(','),
        couponCode: appliedCoupon?.code || '',
      },
    });

    // Save payment order in MongoDB.
    const payment = await Payment.create({
      userId: String(req.user.id),
      courseIds: savedCourses.map((course) => course.courseId),
      courses: savedCourses,

      courseId: savedCourses.length === 1
        ? savedCourses[0].courseId
        : null,

      courseTitle: savedCourses.length === 1
        ? savedCourses[0].title
        : null,

      subtotal,
      discountAmount,
      couponId: appliedCoupon?.id
        ? String(appliedCoupon.id)
        : null,
      couponCode: appliedCoupon?.code || null,
      couponUsageRecorded: false,

      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
      status: 'created',
    });

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully.',
      data: {
        paymentId: payment._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        courses: savedCourses,
        subtotal,
        discountAmount,
        total: finalTotal,
        coupon: appliedCoupon,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Create payment order error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Unable to create payment order.',
    });
  }
};

// Verify payment and create course enrollments.
const verifyPayment = async (req, res) => {
  try {
    if (!req.user?.id || !req.accessToken || !req.userSupabase) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue.',
      });
    }

    const razorpay = getRazorpay();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification details are incomplete.',
      });
    }

    const paymentRecord = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: String(req.user.id),
    });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment order not found.',
      });
    }

    // Verify Razorpay signature.
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
        message: 'Invalid payment signature.',
      });
    }

    // Confirm payment directly with Razorpay.
    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      Number(razorpayPayment.amount) !== Number(paymentRecord.amount) ||
      razorpayPayment.currency !== paymentRecord.currency
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment details do not match the order.',
      });
    }

    if (razorpayPayment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been captured yet.',
      });
    }

    // Do not allow a different Razorpay payment to reuse this order.
    if (
      paymentRecord.razorpayPaymentId &&
      paymentRecord.razorpayPaymentId !== razorpay_payment_id
    ) {
      return res.status(409).json({
        success: false,
        message: 'This order is already linked to another payment.',
      });
    }

    // Save successful payment.
    if (paymentRecord.status !== 'paid') {
      paymentRecord.razorpayPaymentId = razorpay_payment_id;
      paymentRecord.razorpaySignature = razorpay_signature;
      paymentRecord.status = 'paid';
      await paymentRecord.save();
    }

    // Create missing enrollments after payment verification.
    // Existing enrollments are accepted during verification retries.
    const enrolledCourses = [];
    const courseIds = [
      ...new Set(
        (paymentRecord.courseIds || []).map(String)
      ),
    ];

    for (const courseId of courseIds) {
      try {
        const enrollment = await enrollmentService.enroll(
          String(req.user.id),
          courseId
        );

        enrolledCourses.push(enrollment);
      } catch (error) {
        if (error.statusCode === 409) {
          console.log(
            `Already enrolled: user ${req.user.id}, course ${courseId}`
          );
          continue;
        }

        console.error(
          `Enrollment failed for course ${courseId}:`,
          error
        );

        // Payment stays paid. Return an error so verification can be retried.
        return res.status(500).json({
          success: false,
          paymentCaptured: true,
          message:
            'Payment was successful, but course enrollment could not be completed. Please retry verification.',
        });
      }
    }

    // Record coupon usage only after successful payment.
    if (
      paymentRecord.couponId &&
      !paymentRecord.couponUsageRecorded
    ) {
      const { data: redeemed, error: redemptionError } =
        await req.userSupabase.rpc('redeem_coupon', {
          p_coupon_id: paymentRecord.couponId,
          p_user_id: String(req.user.id),
          p_payment_order_id: paymentRecord.razorpayOrderId,
        });

      if (redemptionError) {
        console.error('Coupon redemption error:', redemptionError);
      } else if (redeemed === true) {
        paymentRecord.couponUsageRecorded = true;
        await paymentRecord.save();
      } else {
        console.error('Coupon redemption was not recorded.');
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and course enrollment completed.',
      data: {
        orderId: paymentRecord.razorpayOrderId,
        paymentId: paymentRecord.razorpayPaymentId,
        amount: paymentRecord.amount,
        subtotal: paymentRecord.subtotal,
        discountAmount: paymentRecord.discountAmount,
        couponCode: paymentRecord.couponCode,
        courses: paymentRecord.courses,
        enrollments: enrolledCourses,
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Unable to verify payment.',
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
