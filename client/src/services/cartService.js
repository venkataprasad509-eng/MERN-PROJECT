
import api from './api';

const cartService = {
  getCart: () =>
    api.get('/cart').then((r) => r.data),

  addItem: (courseId) =>
    api.post('/cart/items', { courseId }).then((r) => r.data),

  removeItem: (courseId) =>
    api.delete(`/cart/items/${courseId}`).then((r) => r.data),

  // Apply coupon for Buy Now or Cart Checkout.
  applyCoupon: (data) => {
    const payload =
      typeof data === 'string'
        ? { code: data }
        : data;

    return api.post('/cart/coupon', payload).then((r) => r.data);
  },

  getCoupons: () =>
    api.get('/cart/coupons').then((r) => r.data),

  // Create Razorpay order with optional coupon code.
  createPaymentOrder: (paymentData = {}) =>
    api.post('/payments/create-order', paymentData).then((r) => r.data),

  // Verify Razorpay payment.
  verifyPayment: (paymentDetails) =>
    api.post('/payments/verify', paymentDetails).then((r) => r.data),

  // Send OTP for PhonePe / Mobile checkout.
  sendOtp: (phone) =>
    api.post('/payments/send-otp', { phone }).then((r) => r.data),

  // Verify OTP and complete PhonePe checkout.
  verifyPhonePe: (data) =>
    api.post('/payments/verify-phonepe', data).then((r) => r.data),
};

export default cartService;
