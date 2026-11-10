
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ShoppingBag,
  ShieldCheck,
  Lock,
  ArrowRight,
  CreditCard,
  Tag,
  X,
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import { toast } from 'react-toastify';
import useScrollToTop from '../hooks/useScrollToTop';
import cartService from '../services/cartService';

const Checkout = () => {
  useScrollToTop();

  const navigate = useNavigate();
  const location = useLocation();

  const { items, subtotal, refreshCart } = useCart();
  const { user } = useAuth();

  // Buy Now course, if selected.
  const buyNowCourse = location.state?.buyNowCourse || null;
  const isBuyNow = Boolean(buyNowCourse);

  // Courses selected for checkout.
  const checkoutItems = isBuyNow
    ? [{ course: buyNowCourse, quantity: 1 }]
    : items || [];

  const buyNowTotal = Number(buyNowCourse?.price || 0);

  const checkoutSubtotal = isBuyNow
    ? buyNowTotal
    : Number(subtotal || 0);

  // Coupon states.
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const checkoutDiscount = appliedCoupon
    ? Number(appliedCoupon.discountAmount || 0)
    : 0;

  const checkoutTotal = appliedCoupon
    ? Number(appliedCoupon.payableTotal)
    : checkoutSubtotal;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const [billingDetails, setBillingDetails] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
  });

  const handleBillingChange = (event) => {
    const { name, value } = event.target;

    setBillingDetails((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Apply coupon using backend validation.
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }

    if (!checkoutItems.length) {
      toast.error('Please select at least one course.');
      return;
    }

    setCouponLoading(true);

    try {
      const selectedCourseIds = checkoutItems.map((item) =>
        String((item.course || item).id)
      );

      const payload = isBuyNow
        ? {
            code,
            courseId: selectedCourseIds[0],
          }
        : {
            code,
            courseIds: selectedCourseIds,
          };

      const result = await cartService.applyCoupon(payload);

      if (!result?.success) {
        throw new Error(result?.message || 'Unable to apply coupon.');
      }

      setAppliedCoupon({
        ...result.coupon,
        subtotal: Number(result.subtotal),
        discountAmount: Number(result.discountAmount),
        payableTotal: Number(result.payableTotal),
      });

      setCouponCode(result.coupon.code);

      toast.success('Coupon applied successfully!');
    } catch (error) {
      console.error('Apply coupon error:', error);

      setAppliedCoupon(null);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Invalid coupon code.'
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon.
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed.');
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (!billingDetails.name.trim() || !billingDetails.email.trim()) {
      toast.error('Please enter your name and email address.');
      return;
    }

    if (!window.Razorpay) {
      toast.error(
        'Razorpay checkout could not be loaded. Please refresh the page.'
      );
      return;
    }

    if (!checkoutItems.length) {
      toast.error('Your cart is empty.');
      navigate('/cart');
      return;
    }

    if (!Number.isFinite(checkoutTotal) || checkoutTotal <= 0) {
      toast.error('Invalid checkout amount.');
      return;
    }

    setLoading(true);

    try {
      // Prepare selected course IDs.
      const selectedCourseIds = checkoutItems.map((item) =>
        String((item.course || item).id)
      );

      // Buy Now sends one course.
      // Cart Checkout sends all selected courses.
      const paymentPayload = isBuyNow
        ? { courseId: selectedCourseIds[0] }
        : { courseIds: selectedCourseIds };

      // Send coupon code to backend for final validation.
      if (appliedCoupon) {
        paymentPayload.couponCode = appliedCoupon.code;
      }

      const result = await cartService.createPaymentOrder(paymentPayload);

      const paymentData = result?.data || result;
      const order = paymentData?.order || {};

      const orderId = order.id || paymentData?.orderId;

      const keyId =
        paymentData?.keyId || paymentData?.razorpayKeyId;

      if (!result?.success || !orderId || !keyId) {
        throw new Error(
          result?.message || 'Unable to create payment order.'
        );
      }

      // Use the amount returned by the backend.
      const razorpayAmount = order.amount || paymentData.amount;

      const options = {
        key: keyId,
        amount: razorpayAmount,
        currency: order.currency || paymentData.currency || 'INR',

        name: 'LearnHub',

        description: isBuyNow
          ? `Purchase: ${buyNowCourse.title}`
          : 'Online Course Purchase',

        order_id: orderId,

        prefill: {
          name: billingDetails.name.trim(),
          email: billingDetails.email.trim(),
          contact: billingDetails.phone.trim(),
        },

        theme: {
          color: '#4F46E5',
        },

        // Show only UPI, Cards and Net Banking.
        // Hide default wallets such as MobiKwik.
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI',
                instruments: [
                  { method: 'upi' },
                ],
              },
              other: {
                name: 'Cards and Net Banking',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                ],
              },
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },

        handler: async (response) => {
          try {
            const verification = await cartService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verification?.success) {
              throw new Error(
                verification?.message || 'Payment verification failed.'
              );
            }

            const verifiedData = verification.data || {};

            setOrderData({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,

              // Backend amount is stored in paise.
              amount:
                Number(verifiedData.amount ?? razorpayAmount) / 100,

              discountAmount: Number(
                verifiedData.discountAmount || 0
              ),

              couponCode: verifiedData.couponCode || '',
            });

            setSuccess(true);

            // Refresh cart only after Cart Checkout.
            if (!isBuyNow) {
              await refreshCart();
            }

            toast.success(
              'Payment successful! Your order is confirmed.'
            );
          } catch (error) {
            console.error('Payment verification error:', error);

            toast.error(
              error.message ||
                'Payment verification failed. Please contact support if money was deducted.'
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);

        toast.error(
          response.error?.description ||
            'Payment failed. Please try again.'
        );

        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('Checkout error:', error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Unable to start checkout. Please try again.'
      );

      setLoading(false);
    }
  };

  // Payment success screen.
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Payment Successful!
          </h1>

          <p className="mb-6 text-gray-600">
            Thank you for your purchase. Your payment has been verified.
          </p>

          {orderData && (
            <div className="mb-6 rounded-xl bg-gray-50 p-5 text-left">
              <div className="mb-3 flex justify-between gap-4">
                <span className="text-gray-600">Order ID</span>
                <span className="break-all text-right font-medium text-gray-900">
                  {orderData.orderId}
                </span>
              </div>

              <div className="mb-3 flex justify-between gap-4">
                <span className="text-gray-600">Payment ID</span>
                <span className="break-all text-right font-medium text-gray-900">
                  {orderData.paymentId}
                </span>
              </div>

              {orderData.couponCode && (
                <div className="mb-3 flex justify-between gap-4">
                  <span className="text-gray-600">Coupon</span>
                  <span className="font-medium text-green-600">
                    {orderData.couponCode}
                  </span>
                </div>
              )}

              {orderData.discountAmount > 0 && (
                <div className="mb-3 flex justify-between gap-4">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">
                    -{formatPrice(orderData.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Amount paid</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(orderData.amount)}
                </span>
              </div>
            </div>
          )}

          <Link
            to="/my-courses"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Go to My Courses
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  // Empty checkout screen.
  if (!checkoutItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-400" />

          <h1 className="mb-3 text-2xl font-bold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mb-6 text-gray-600">
            Add a course to your cart before proceeding to checkout.
          </p>

          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Explore Courses
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-600">
            Complete your details and securely pay for your courses.
          </p>
        </div>

        <form
          onSubmit={handleCheckout}
          className="grid grid-cols-1 gap-8 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            {/* Billing details */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <ShoppingBag className="h-5 w-5 text-indigo-600" />
                Billing Details
              </h2>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={billingDetails.name}
                    onChange={handleBillingChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={billingDetails.email}
                    onChange={handleBillingChange}
                    placeholder="Enter your email address"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Phone Number (Optional)
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={billingDetails.phone}
                    onChange={handleBillingChange}
                    placeholder="Enter your phone number"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </section>

            {/* Payment information */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Payment Method
              </h2>

              <p className="mb-5 text-gray-600">
                Choose your available payment method in Razorpay Checkout.
              </p>

              <div className="space-y-3 rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">
                      UPI, Cards and Net Banking
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Select UPI in Razorpay to use an available UPI app,
                      such as PhonePe, when supported.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-lg bg-green-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                <div>
                  <p className="font-semibold text-green-800">
                    Secure Checkout
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    Payment is processed through Razorpay. LearnHub does not
                    directly collect your card or UPI PIN details.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Order Summary
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              {isBuyNow ? 'Buy Now — Selected Course' : 'Cart Checkout'}
            </p>

            {/* Selected courses */}
            <div className="mb-5 space-y-4">
              {checkoutItems.map((item, index) => {
                const course = item.course || item;
                const itemId = course.id || item.id || index;
                const quantity = isBuyNow
                  ? 1
                  : Number(item.quantity || 1);

                return (
                  <div
                    key={itemId}
                    className="flex items-start gap-3"
                  >
                    {course.thumbnail || course.image ? (
                      <img
                        src={course.thumbnail || course.image}
                        alt={course.title || 'Course'}
                        className="h-16 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-indigo-50">
                        <ShoppingBag className="h-6 w-6 text-indigo-500" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium text-gray-900">
                        {course.title || 'Online Course'}
                      </p>

                      {!isBuyNow && (
                        <p className="mt-1 text-sm text-gray-500">
                          Qty: {quantity}
                        </p>
                      )}
                    </div>

                    <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatPrice(
                        Number(course.price || 0) * quantity
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon section */}
            <div className="mb-5 border-t border-gray-200 pt-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Tag className="h-5 w-5 text-indigo-600" />
                Apply Coupon
              </h3>

              {appliedCoupon ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-green-800">
                        {appliedCoupon.code}
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        Coupon applied successfully!
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
                      title="Remove coupon"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) =>
                      setCouponCode(event.target.value.toUpperCase())
                    }
                    placeholder="Enter coupon code"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Price details */}
            <div className="space-y-3 border-t border-gray-200 pt-5">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(checkoutSubtotal)}</span>
              </div>

              {checkoutDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{formatPrice(checkoutDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-gray-200 pt-4 text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(checkoutTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || couponLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Continue to Razorpay
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              Secure payment powered by Razorpay
            </p>

            <p className="mt-4 text-center text-sm text-gray-600">
              Need to change something?{' '}
              <Link
                to="/cart"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Return to cart
              </Link>
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
