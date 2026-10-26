/**
 * Authentication Service Interface (DEVELOPMENT PLACEHOLDER)
 *
 * ⚠️ WARNING: This service does NOT implement real authentication.
 * It returns clearly labeled development responses only.
 *
 * When integrating real authentication, replace the methods below with:
 * - Firebase Auth SDK calls
 * - Supabase Auth SDK calls
 * - Custom JWT + bcrypt implementation with a real database
 *
 * Do NOT issue JWTs, hash passwords, or claim secure auth in this file.
 */

const authService = {
  /**
   * Register a new user.
   * In production: create user in DB, hash password, send verification email.
   */
  register({ fullName, email, role }) {
    return {
      success: false,
      devOnly: true,
      message:
        '⚠️ DEV MODE: Registration is not connected to a real authentication provider. ' +
        'No account has been created. Integrate Firebase Auth, Supabase Auth, or a custom JWT solution to enable real registration.',
      receivedData: { fullName, email, role },
    };
  },

  /**
   * Log in a user.
   * In production: verify credentials against DB, issue JWT or session.
   */
  login({ email }) {
    return {
      success: false,
      devOnly: true,
      message:
        '⚠️ DEV MODE: Login is not connected to a real authentication provider. ' +
        'No credentials have been verified and no session has been created. ' +
        'Integrate a real auth provider before using in production.',
      receivedData: { email },
    };
  },

  /**
   * Initiate forgot-password flow.
   * In production: send a password-reset email via your auth provider.
   */
  forgotPassword({ email }) {
    return {
      success: false,
      devOnly: true,
      message:
        '⚠️ DEV MODE: Forgot-password is not connected to a real email provider. ' +
        'No reset email has been sent. Integrate Firebase Auth, Supabase Auth, or nodemailer + JWT to enable this.',
      receivedData: { email },
    };
  },
};

module.exports = { authService };
