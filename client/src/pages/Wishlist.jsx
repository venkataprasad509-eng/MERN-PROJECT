import { Link } from 'react-router-dom';
import { Trash2, Heart, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import StarRating from '../components/common/StarRating';
import { EmptyState } from '../components/common/StateComponents';
import { formatPrice, getLevelColor } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';

const Wishlist = () => {
  useScrollToTop();
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();

  const handleMoveToCart = async (course) => {
    await addToCart(course.id);
    removeFromWishlist(course.id);
    toast.success('Moved to cart!');
  };

  if (items.length === 0) {
    return (
      <div className="page-container py-16">
        <EmptyState
          title="Your wishlist is empty"
          description="Save courses you're interested in for later."
          action={<Link to="/courses" className="btn-primary">Browse Courses</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <Heart className="w-8 h-8 text-red-500 fill-red-500" /> Wishlist
        <span className="text-lg font-normal text-gray-500">({items.length} courses)</span>
      </h1>
      <p className="text-gray-500 mb-8">Courses you've saved for later</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((course) => (
          <div key={course.id} className="card group">
            <div className="relative overflow-hidden">
              <img src={course.thumbnail} alt={course.title}
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format'; }} />
              <button onClick={() => { removeFromWishlist(course.id); toast.info('Removed from wishlist'); }}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow text-gray-500 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <Link to={`/courses/${course.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2 text-sm block mb-1">
                {course.title}
              </Link>
              <p className="text-xs text-gray-500 mb-2">{course.instructor}</p>
              <StarRating rating={course.rating} reviewCount={course.reviewCount} />
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-gray-900">{formatPrice(course.price)}</span>
                <button onClick={() => isInCart(course.id) ? null : handleMoveToCart(course)}
                  disabled={isInCart(course.id)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${isInCart(course.id) ? 'bg-green-100 text-green-700 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {isInCart(course.id) ? 'In Cart' : 'Move to Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
