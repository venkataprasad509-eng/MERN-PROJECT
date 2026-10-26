const { mockReviews } = require('../data/mockReviews');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../middleware/errorHandler');

let reviews = [...mockReviews];

const reviewController = {
  getByCourse: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { sort = 'newest' } = req.query;
    let result = reviews.filter((r) => r.courseId === courseId);

    if (sort === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'rating_desc') result.sort((a, b) => b.rating - a.rating);
    else if (sort === 'helpful') result.sort((a, b) => b.helpful - a.helpful);

    const avgRating = result.length ? (result.reduce((s, r) => s + r.rating, 0) / result.length).toFixed(1) : 0;
    res.json({ success: true, reviews: result, totalReviews: result.length, averageRating: Number(avgRating) });
  }),

  create: asyncHandler(async (req, res) => {
    const { courseId, userName, rating, title, content } = req.body;
    const newReview = {
      id: `rev-${uuidv4().slice(0, 8)}`,
      courseId,
      userId: `user-demo-${uuidv4().slice(0, 6)}`,
      userName: userName || 'Anonymous',
      userAvatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      rating: Number(rating),
      title,
      content,
      helpful: 0,
      createdAt: new Date().toISOString(),
      note: 'DEV ONLY: This review was submitted without verified purchase check.',
    };
    reviews.push(newReview);
    res.status(201).json({ success: true, message: 'Review submitted (demo)', review: newReview });
  }),

  delete: asyncHandler(async (req, res) => {
    const idx = reviews.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found' });
    reviews.splice(idx, 1);
    res.json({ success: true, message: 'Review deleted (demo)' });
  }),
};

module.exports = { reviewController };
