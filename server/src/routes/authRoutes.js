const { Router } = require('express');
const { body } = require('express-validator');
const { authController } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateRequest');

const router = Router();

router.post('/register', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validateRequest, authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validateRequest, authController.login);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
], validateRequest, authController.forgotPassword);

module.exports = router;
