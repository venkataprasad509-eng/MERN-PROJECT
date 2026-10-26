const { authService } = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

const authController = {
  register: asyncHandler(async (req, res) => {
    const { fullName, email, role } = req.body;
    const result = authService.register({ fullName, email, role });
    res.status(200).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = authService.login({ email });
    res.status(200).json(result);
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = authService.forgotPassword({ email });
    res.status(200).json(result);
  }),
};

module.exports = { authController };
