import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import StarRating from '../components/common/StarRating';
import { EmptyState } from '../components/common/StateComponents';
import { formatPrice } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';

const SAMPLE_COUPONS = ['SAVE10', 'FLAT500', 'WELCOME20'];

const Cart = () => {
  useScrollToTop();
  const { items, removeFromCart, coupon, applyCoupon, removeCoupon, subtotal, discount, total, loading } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const navigate = useNavigate();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponInput.trim().toUpperCase());
      toast.success('Coupon applied successfully!');
      setCouponInput('');
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  if (!loading && items.length === 0) {
    return (
      <div className="page-container py-16">
        <EmptyState
          title="Your cart is empty"
          description="Looks like you haven't added any courses yet."
          action={<Link to="/courses" className="btn-primary">Browse Courses</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-indigo-600" /> Shopping Cart
        <span className="text-lg font-normal text-gray-500">({items.length} {items.length === 1 ? 'course' : 'courses'})</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => {
            const courseTitle = item.course?.title || item.title || 'Course';
            const courseInstructor = item.course?.instructor || item.instructor || 'Instructor';
            const courseThumbnail = item.course?.thumbnail || item.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format';
            const courseRating = Number(item.course?.rating ?? item.rating ?? 0);
            const courseReviewCount = Number(item.course?.reviewCount ?? item.reviewCount ?? 0);
            const coursePrice = Number(item.course?.price ?? item.price ?? 0);
            const originalPrice = Number(item.course?.originalPrice ?? item.originalPrice ?? 0);

            return (
              <div key={item.courseId} className="card p-5 flex gap-4">
                <img
                  src={courseThumbnail}
                  alt={courseTitle}
                  className="w-28 h-20 object-cover rounded-lg shrink-0 border border-gray-100"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format'; }}
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/courses/${item.courseId}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2 text-sm">
                    {courseTitle}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{courseInstructor}</p>
                  <StarRating rating={courseRating} reviewCount={courseReviewCount} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-indigo-700">{formatPrice(coursePrice)}</span>
                    {originalPrice > coursePrice && (
                      <span className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { removeFromCart(item.courseId); toast.info('Removed from cart'); }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0 self-start"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="card p-6 sticky top-20">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Have a coupon?</label>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="input-field text-sm uppercase"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput.trim()}
                  className="btn-outline text-sm px-3 py-1.5 disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>

              {/* Sample coupons hint */}
              <div className="mt-2 text-xs text-gray-400">
                <span>Try: </span>
                {SAMPLE_COUPONS.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCouponInput(c)}
                    className="text-indigo-600 hover:underline font-mono"
                  >
                    {c}{i < SAMPLE_COUPONS.length - 1 ? ',' : ''}
                  </button>
                ))}
              </div>

              {coupon && (
                <div className="flex items-center justify-between bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg mt-3">
                  <span>Coupon <strong>{coupon.code}</strong> applied</span>
                  <button onClick={removeCoupon} className="text-green-800 hover:underline">Remove</button>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 text-sm border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-3">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-200">
              ⚠️ DEV MODE: No real payment will be processed at checkout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
