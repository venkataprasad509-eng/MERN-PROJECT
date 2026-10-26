import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Users, Clock, BarChart2, Zap } from 'lucide-react';
import StarRating from '../common/StarRating';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, getLevelColor } from '../../utils/helpers';
import { toast } from '../../utils/toast';

const CourseCard = ({ course }) => {
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const inCart = isInCart(course.id);
  const wishlisted = isWishlisted(course.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (inCart) return;
    await addToCart(course.id);
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    if (!inCart) {
      await addToCart(course.id);
    }
    navigate('/checkout');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    const added = toggleWishlist(course);
    toast[added ? 'success' : 'info'](added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  return (
    <Link to={`/courses/${course.id}`} className="card group block">
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format'; }}
        />
        {course.discountPercentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            -{course.discountPercentage}%
          </span>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
        </button>
        {course.isBestseller && (
          <span className="absolute bottom-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">Bestseller</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{course.instructor}</p>

        <StarRating rating={course.rating} reviewCount={course.reviewCount} />

        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />{(course.enrolledStudents / 1000).toFixed(0)}k
          </span>
          <span className={`badge ${getLevelColor(course.level)}`}>
            <BarChart2 className="w-3 h-3 mr-0.5" />{course.level}
          </span>
        </div>

        {/* Pricing and Action Buttons (Add + Buy Now) */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-gray-900">{formatPrice(course.price)}</span>
            {course.originalPrice > course.price && (
              <span className="text-[11px] text-gray-400 line-through">{formatPrice(course.originalPrice)}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCart}
              className={`p-2 rounded-lg font-semibold transition-colors ${
                inCart
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={inCart ? 'Already in cart' : 'Add to cart'}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>

            <button
              onClick={handleBuyNow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <Zap className="w-3 h-3 fill-white" /> Buy Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
