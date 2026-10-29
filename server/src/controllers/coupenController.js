
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const couponController = {
  list: asyncHandler(async (req, res) => {
    const { data, error } = await req.userSupabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(error.message, 500);

    res.json({ success: true, coupons: data || [] });
  }),

  create: asyncHandler(async (req, res) => {
    const code = String(req.body.code || '').trim().toUpperCase();
    const discountType = req.body.discountType;
    const discountValue = Number(req.body.discountValue);

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      throw new ApiError(
        'Coupon code must be 3–30 letters, numbers, underscores or hyphens.',
        400
      );
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      throw new ApiError('Choose a valid discount type.', 400);
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0 ||
      (discountType === 'percentage' && discountValue > 100)
    ) {
      throw new ApiError('Enter a valid discount value.', 400);
    }

    const { data, error } = await req.userSupabase
      .from('coupons')
      .insert({
        code,
        discount_type: discountType,
        discount_value: discountValue,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError('This coupon code already exists.', 409);
      }
      throw new ApiError(error.message, 500);
    }

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully.',
      coupon: data,
    });
  }),
};

module.exports = { couponController };
