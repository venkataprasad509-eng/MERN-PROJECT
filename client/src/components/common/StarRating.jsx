import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, reviewCount, size = 'sm', showNumber = true }) => {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const iconSize = sizes[size] || sizes.sm;

  return (
    <div className="flex items-center gap-1">
      <span className="font-semibold text-amber-600 text-sm">{Number(rating).toFixed(1)}</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSize} ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
          />
        ))}
      </div>
      {showNumber && reviewCount !== undefined && (
        <span className="text-xs text-gray-500">({reviewCount?.toLocaleString()})</span>
      )}
    </div>
  );
};

export default StarRating;
