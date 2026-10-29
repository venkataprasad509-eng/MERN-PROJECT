
const { ApiError, asyncHandler } = require('./errorHandler');

const requireAdmin = asyncHandler(async (req, _res, next) => {
  if (!req.user?.id || !req.userSupabase) {
    throw new ApiError('Please log in first.', 401);
  }

  const { data, error } = await req.userSupabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) throw new ApiError(error.message, 500);

  if (data?.role !== 'admin') {
    throw new ApiError('Administrator access required.', 403);
  }

  next();
});

module.exports = { requireAdmin };
