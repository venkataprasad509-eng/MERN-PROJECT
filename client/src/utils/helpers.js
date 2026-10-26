/**
 * General utility helpers.
 */

/** Format price in Indian Rupee format */
export const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

/** Truncate text to a given character limit */
export const truncate = (text, limit = 80) =>
  text && text.length > limit ? text.slice(0, limit) + '...' : text;

/** Calculate discount percentage */
export const calcDiscount = (original, current) =>
  original > current ? Math.round(((original - current) / original) * 100) : 0;

/** Convert minutes to "X hours Y mins" string */
export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/** Get level badge color class */
export const getLevelColor = (level) => {
  const map = { Beginner: 'bg-green-100 text-green-700', Intermediate: 'bg-yellow-100 text-yellow-700', Advanced: 'bg-red-100 text-red-700' };
  return map[level] || 'bg-gray-100 text-gray-700';
};

/** Relative time – "2 days ago" */
export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} months ago`;
  return `${Math.floor(d / 365)} years ago`;
};
