
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    courseIds: {
      type: [String],
      required: true,
    },

    courses: [
      {
        _id: false,
        courseId: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    courseId: {
      type: String,
      default: null,
    },

    courseTitle: {
      type: String,
      default: null,
    },

    // Original total before discount (in rupees).
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Coupon discount (in rupees).
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Coupon details.
    couponId: {
      type: String,
      default: null,
    },

    couponCode: {
      type: String,
      default: null,
    },

    // Razorpay amount is stored in paise.
    amount: {
      type: Number,
      required: true,
      min: 100,
    },

    currency: {
      type: String,
      default: 'INR',
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },

    // Prevents coupon usage from being counted twice.
    couponUsageRecorded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
