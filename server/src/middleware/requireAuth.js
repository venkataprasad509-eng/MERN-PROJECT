
const supabase = require('../config/supabase');

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue.',
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired login session.',
      });
    }

    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };
