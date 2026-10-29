
const { Router } = require('express');
const { body } = require('express-validator');
const { courseController } = require('../controllers/courseController');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/requireAuth');

const router = Router();

const courseValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title too long'),

  body('instructor')
    .notEmpty()
    .withMessage('Instructor name is required'),

  body('category')
    .notEmpty()
    .withMessage('Category is required'),

  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be non-negative'),

  body('level')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
];

// View all courses
router.get('/', courseController.getAll);

// View courses belonging to the logged-in instructor
router.get('/mine', requireAuth, courseController.getMine);

// View one course by ID
router.get('/:id', courseController.getOne);

// Create a course only after login verification
router.post(
  '/',
  requireAuth,
  courseValidation,
  validateRequest,
  courseController.create
);

// Update and delete (ownership protection still needs to be implemented)
router.put('/:id', courseController.update);
router.delete('/:id', courseController.remove);

module.exports = router;
