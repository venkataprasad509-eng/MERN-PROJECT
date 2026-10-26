const { Router } = require('express');
const { body } = require('express-validator');
const { courseController } = require('../controllers/courseController');
const { validateRequest } = require('../middleware/validateRequest');

const router = Router();

const courseValidation = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
  body('instructor').notEmpty().withMessage('Instructor name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Level must be Beginner, Intermediate, or Advanced'),
];

router.get('/', courseController.getAll);
router.get('/:id', courseController.getOne);
router.post('/', courseValidation, validateRequest, courseController.create);
router.put('/:id', courseController.update);
router.delete('/:id', courseController.remove);

module.exports = router;
