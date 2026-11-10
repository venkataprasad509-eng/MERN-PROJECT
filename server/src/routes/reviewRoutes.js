
const { Router } = require('express');
const { body } = require('express-validator');
const { reviewController } = require('../controllers/reviewController');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/requireAuth');

const router = Router();

// Anyone can view course reviews
router.get('/course/:courseId', reviewController.getByCourse);

// Only logged-in users can submit reviews
router.post(
  '/',
  requireAuth,
  [
    body('courseId').notEmpty().withMessage('courseId is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be 1-5'),
    body('content')
      .notEmpty()
      .isLength({ min: 10 })
      .withMessage('Review must be at least 10 characters'),
  ],
  validateRequest,
  reviewController.create
);

// Delete review
router.delete('/:id', reviewController.delete);

module.exports = router;
