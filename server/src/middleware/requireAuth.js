
const { createClient } = require('@supabase/supabase-js');
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

    // Verify the user's Supabase access token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired login session.',
      });
    }

    // Store the verified user and token
    req.user = data.user;
    req.accessToken = token;

    // Create a Supabase client using this user's token
    req.userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };
