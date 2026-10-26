
import api from './api';

const cartService = {
  getCart: () => api.get('/cart').then((r) => r.data),

  addItem: (courseId) =>
    api.post('/cart/items', { courseId }).then((r) => r.data),

  removeItem: (courseId) =>
    api.delete(`/cart/items/${courseId}`).then((r) => r.data),

  applyCoupon: (code) =>
    api.post('/cart/coupon', { code }).then((r) => r.data),

  getCoupons: () =>
    api.get('/cart/coupons').then((r) => r.data),

  // Create a Razorpay order using the backend.
  createPaymentOrder: () =>
    api.post('/payments/create-order').then((r) => r.data),

  // Ask the backend to verify the payment.
  verifyPayment: (paymentDetails) =>
    api.post('/payments/verify', paymentDetails).then((r) => r.data),
};

export default cartService;
