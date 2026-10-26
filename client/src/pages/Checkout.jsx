
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ShoppingBag,
  ShieldCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';
import cartService from '../services/cartService';

const Checkout = () => {
  useScrollToTop();

  const { items, subtotal, discount, total, coupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
  });

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Please enter your name and email.');
      return;
    }

    if (!window.Razorpay) {
      toast.error(
        'Razorpay Checkout did not load. Refresh the page and try again.'
      );
      return;
    }

    setLoading(true);

    try {
      // Ask our backend to create an order using database prices.
      const result = await cartService.createPaymentOrder();

      if (!result.success || !result.order?.id || !result.keyId) {
        throw new Error(
          result.message || 'Unable to create the payment order.'
        );
      }

      const options = {
        key: result.keyId,
        amount: result.order.amount,
        currency: result.order.currency,
        name: 'Course Marketplace',
        description: 'Course purchase',
        order_id: result.order.id,

        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.phone.trim(),
        },

        theme: {
          color: '#4f46e5',
        },

        handler: async (response) => {
          try {
            // Send Razorpay's response to the backend for verification.
            const verification = await cartService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verification.success) {
              throw new Error(
                verification.message || 'Payment verification failed.'
              );
            }

            setOrderData({
              orderId: verification.payment.orderId,
              paymentId: verification.payment.paymentId,
              total: result.order.amount / 100,
              paymentMethod: 'Razorpay',
              status: verification.payment.status,
            });

            setSuccess(true);
            toast.success('Payment verified successfully.');
          } catch (error) {
            toast.error(
              error.message ||
                'Payment may have succeeded, but verification failed. Contact support before trying to pay again.'
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
          escape: true,
        },
      };

      const paymentWindow = new window.Razorpay(options);

      paymentWindow.on('payment.failed', (response) => {
        setLoading(false);
        toast.error(
          response.error?.description || 'Payment failed. Please try again.'
        );
      });

      paymentWindow.open();
    } catch (error) {
      setLoading(false);
      toast.error(error.message || 'Unable to start checkout.');
    }
  };

  if (success && orderData) {
    return (
      <div className="page-container py-20 max-w-xl mx-auto text-center">
        <div className="card p-10 shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
            Payment Verified!
          </h1>

          <p className="text-gray-500 text-sm mb-5">
            Your payment has been verified by the server.
            Course enrollment still needs to be connected before course access
            can be confirmed.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 text-left space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-mono font-bold text-indigo-700 break-all">
                {orderData.orderId}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Payment ID:</span>
              <span className="font-mono text-gray-800 break-all">
                {orderData.paymentId}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-gray-900">
                {formatPrice(orderData.total)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span>{orderData.paymentMethod}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Payment Status:</span>
              <span className="font-semibold text-green-600 capitalize">
                {orderData.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/courses')}
            className="btn-primary py-3 w-full flex items-center justify-center gap-2"
          >
            Browse Courses <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">
          Your cart is empty
        </h2>
        <Link to="/courses" className="btn-primary mt-4">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Checkout & Payment
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete your purchase using Razorpay's secure checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-full border border-gray-200">
          <Lock className="w-4 h-4 text-green-600" />
          Secure payment
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleCheckout} className="flex-1 space-y-6">
          <div className="card p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Billing Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  className="input-field text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              Payment with Razorpay
            </h2>

            <p className="text-sm text-gray-600 leading-6">
              Click the button below to open Razorpay. Available payment
              options depend on your Razorpay account and checkout settings.
              Enter payment details only inside the Razorpay checkout window,
              not on this page.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base font-bold shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting secure checkout...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Continue to Secure Payment
              </>
            )}
          </button>
        </form>

        <div className="lg:w-80 shrink-0">
          <div className="card p-6 sticky top-20 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const title = item.course?.title || item.title || 'Course';
                const thumbnail =
                  item.course?.thumbnail ||
                  item.thumbnail ||
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format';

                const price = Number(
                  item.course?.price ?? item.price ?? 0
                );

                return (
                  <div
                    key={item.courseId || item.course_id || index}
                    className="flex gap-3 items-center"
                  >
                    <img
                      src={thumbnail}
                      alt={title}
                      className="w-14 h-10 object-cover rounded-lg shrink-0 border border-gray-100"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                        {title}
                      </p>
                      <p className="text-xs text-indigo-700 font-bold">
                        {formatPrice(price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>
                    Discount {coupon ? `(${coupon.code})` : ''}
                  </span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-extrabold text-lg pt-3 border-t border-gray-100">
                <span>Displayed Total</span>
                <span className="text-indigo-600">
                  {formatPrice(total)}
                </span>
              </div>

              <p className="text-xs text-amber-700 pt-2">
                The final payment amount is calculated by the backend.
                Coupon discounts are not yet applied to Razorpay orders.
              </p>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Secure checkout
              </div>
              Your payment details are handled by Razorpay Checkout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
