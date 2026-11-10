
const { mockReviews } = require('../data/mockReviews');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../middleware/errorHandler');

let reviews = [...mockReviews];

const reviewController = {
  getByCourse: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { sort = 'newest' } = req.query;

    let result = reviews.filter(
      (r) => String(r.courseId) === String(courseId)
    );

    if (sort === 'newest') {
      result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else if (sort === 'rating_desc') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'helpful') {
      result.sort((a, b) => b.helpful - a.helpful);
    }

    const avgRating = result.length
      ? (
          result.reduce((sum, r) => sum + r.rating, 0) /
          result.length
        ).toFixed(1)
      : 0;

    res.json({
      success: true,
      reviews: result,
      totalReviews: result.length,
      averageRating: Number(avgRating),
    });
  }),

  create: asyncHandler(async (req, res) => {
    const { courseId, rating, title, content } = req.body;

    // Get the verified Supabase user
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to submit a review.',
      });
    }

    // Get the user's real profile information
    const { data: profile, error: profileError } =
      await req.userSupabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError.message);
    }

    const userName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    const userAvatar =
      profile?.avatar_url ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    const newReview = {
      id: `rev-${uuidv4().slice(0, 8)}`,
      courseId,
      userId: user.id,
      userName,
      userAvatar,
      rating: Number(rating),
      title: title || '',
      content,
      helpful: 0,
      createdAt: new Date().toISOString(),
    };

    reviews.push(newReview);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review: newReview,
    });
  }),

  delete: asyncHandler(async (req, res) => {
    const idx = reviews.findIndex(
      (r) => r.id === req.params.id
    );

    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    reviews.splice(idx, 1);

    res.json({
      success: true,
      message: 'Review deleted',
    });
  }),
};

module.exports = { reviewController };
