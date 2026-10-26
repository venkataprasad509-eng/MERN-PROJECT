import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, Users, BarChart2, Globe, Award, CheckCircle, Play,
  ShoppingCart, Heart, ChevronDown, Star, BookOpen, AlertCircle
} from 'lucide-react';
import courseService from '../services/courseService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import StarRating from '../components/common/StarRating';
import { ErrorState } from '../components/common/StateComponents';
import { PageSkeleton } from '../components/common/Skeleton';
import { formatPrice, getLevelColor, timeAgo } from '../utils/helpers';
import { toast } from '../utils/toast';
import { useScrollToTop } from '../hooks/useCustomHooks';

const CourseDetails = () => {
  useScrollToTop();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', userName: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [courseData, reviewData] = await Promise.all([
          courseService.getById(id),
          courseService.getReviews(id),
        ]);
        setCourse(courseData.course);
        setReviews(reviewData.reviews || []);
        // Expand first section by default
        if (courseData.course?.curriculum?.length > 0) {
          setExpandedSections({ [courseData.course.curriculum[0].id]: true });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!course) return null;

  const inCart = isInCart(course.id);
  const wishlisted = isWishlisted(course.id);
  const totalLessons = course.curriculum?.reduce((s, sec) => s + (sec.lessons?.length || 0), 0) || 0;
  const previewLessons = course.curriculum?.flatMap((s) => s.lessons?.filter((l) => l.isPreview) || []) || [];

  const handleAddToCart = async () => {
    if (!inCart) await addToCart(course.id);
    else toast.info('Already in cart!');
  };

  const handleWishlist = () => {
    const added = toggleWishlist(course);
    toast[added ? 'success' : 'info'](added ? 'Added to wishlist!' : 'Removed from wishlist');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.content || reviewForm.content.length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }
    setSubmittingReview(true);
    try {
      const data = await courseService.submitReview({ courseId: course.id, ...reviewForm });
      setReviews((prev) => [data.review, ...prev]);
      setReviewForm({ rating: 5, content: '', userName: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="page-container">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3 text-sm">
              <Link to="/courses" className="text-indigo-300 hover:text-white">Courses</Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">{course.category}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{course.title}</h1>
            <p className="text-gray-300 text-lg mb-5">{course.shortDescription}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
              <StarRating rating={course.rating} reviewCount={course.reviewCount} size="md" />
              <span className="flex items-center gap-1 text-gray-300"><Users className="w-4 h-4" />{course.enrolledStudents?.toLocaleString()} students</span>
              <span className={`badge ${getLevelColor(course.level)}`}>{course.level}</span>
              <span className="flex items-center gap-1 text-gray-300"><Globe className="w-4 h-4" />{course.language}</span>
            </div>
            <p className="text-gray-400 text-sm">Created by <span className="text-indigo-300 font-medium">{course.instructor}</span></p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="page-container py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* What you'll learn */}
            <section className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">What You'll Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.learningObjectives?.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{obj}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Course Content</h2>
                <span className="text-sm text-gray-500">{course.curriculum?.length} sections • {totalLessons} lessons • {course.duration}</span>
              </div>
              <div className="space-y-2">
                {course.curriculum?.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
                        <span className="font-semibold text-gray-800">{section.title}</span>
                      </div>
                      <span className="text-sm text-gray-500 shrink-0">{section.lessons?.length} lessons</span>
                    </button>
                    {expandedSections[section.id] && (
                      <div className="divide-y divide-gray-100">
                        {section.lessons?.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 pl-10 hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              {lesson.type === 'video' ? <Play className="w-3.5 h-3.5 text-gray-400" /> : <BookOpen className="w-3.5 h-3.5 text-gray-400" />}
                              <span className="text-sm text-gray-700">{lesson.title}</span>
                              {lesson.isPreview && <span className="badge bg-green-100 text-green-700 text-xs">Preview</span>}
                            </div>
                            <span className="text-xs text-gray-500">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}
            {course.prerequisites?.length > 0 && (
              <section className="card p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {course.prerequisites.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-indigo-500 font-bold mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Reviews */}
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-6">Student Reviews</h2>
              <div className="flex items-center gap-6 mb-6 p-4 bg-amber-50 rounded-xl">
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-amber-500">{course.rating}</div>
                  <StarRating rating={course.rating} size="md" showNumber={false} />
                  <div className="text-xs text-gray-500 mt-1">Course rating</div>
                </div>
              </div>

              {/* Submit review */}
              <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
                <h3 className="font-semibold mb-1">Leave a Review</h3>
                <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> DEV ONLY: Reviews submitted without verified purchase.
                </p>
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}>
                        <Star className={`w-6 h-6 transition-colors ${s <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  <input type="text" placeholder="Your name (optional)" value={reviewForm.userName}
                    onChange={(e) => setReviewForm((p) => ({ ...p, userName: e.target.value }))}
                    className="input-field text-sm" />
                  <textarea rows={3} placeholder="Share your experience with this course..."
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))}
                    className="input-field text-sm resize-none" required minLength={10} />
                  <button type="submit" disabled={submittingReview} className="btn-primary text-sm px-6 disabled:opacity-50">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* Review list */}
              <div className="space-y-5">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="border-b border-gray-100 pb-5 last:border-0">
                      <div className="flex items-start gap-3">
                        <img src={r.userAvatar} alt={r.userName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{r.userName}</span>
                            <StarRating rating={r.rating} showNumber={false} />
                            <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                          </div>
                          {r.title && <p className="font-medium text-sm mb-1">{r.title}</p>}
                          <p className="text-sm text-gray-600">{r.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sticky sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="card p-6 sticky top-20">
              <img src={course.thumbnail} alt={course.title} className="w-full h-44 object-cover rounded-lg mb-4"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format'; }} />

              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-extrabold text-gray-900">{formatPrice(course.price)}</span>
                {course.originalPrice > course.price && (
                  <span className="text-lg text-gray-400 line-through">{formatPrice(course.originalPrice)}</span>
                )}
                {course.discountPercentage > 0 && (
                  <span className="badge bg-red-100 text-red-700 font-bold">{course.discountPercentage}% OFF</span>
                )}
              </div>
              <p className="text-xs text-red-500 font-medium mb-4">⏰ Limited time offer!</p>

              <button onClick={handleAddToCart}
                className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl mb-2 transition-colors ${inCart ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}>
                <ShoppingCart className="w-5 h-5" />
                {inCart ? 'Already in Cart' : 'Add to Cart'}
              </button>

              <button
                onClick={async () => {
                  if (!inCart) await addToCart(course.id);
                  navigate('/checkout');
                }}
                className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl mb-3 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm">
                Buy Now
              </button>
              <button onClick={handleWishlist}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-red-500 transition-colors py-2">
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                {wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              </button>

              <div className="border-t border-gray-100 mt-4 pt-4 space-y-2.5 text-sm">
                {[
                  [Clock, `${course.duration} of content`],
                  [BookOpen, `${totalLessons} lessons`],
                  [BarChart2, course.level],
                  [Globe, course.language],
                  [Award, 'Certificate of completion'],
                ].map(([Icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-gray-600">
                    <Icon className="w-4 h-4 text-gray-400" />{text}
                  </div>
                ))}
              </div>

              {previewLessons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Free Preview Lessons:</p>
                  {previewLessons.slice(0, 3).map((l) => (
                    <div key={l.id} className="flex items-center gap-2 text-xs text-indigo-600 mb-1.5">
                      <Play className="w-3 h-3" />{l.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
