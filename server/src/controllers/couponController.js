
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const couponController = {
  // Get all coupons
  list: asyncHandler(async (req, res) => {
    const { data, error } = await req.userSupabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(error.message, 500);

    res.json({
      success: true,
      coupons: data || [],
    });
  }),

  // Create a new coupon
  create: asyncHandler(async (req, res) => {
    const code = String(req.body.code || '').trim().toUpperCase();
    const discountType = req.body.discountType;
    const discountValue = Number(req.body.discountValue);
    const newStudentsOnly = req.body.newStudentsOnly === true;
    const maxUses =
      req.body.maxUses === '' || req.body.maxUses == null
        ? null
        : Number(req.body.maxUses);

    const expiresAt = req.body.expiresAt || null;

    // Validate coupon code
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      throw new ApiError(
        'Coupon code must contain 3–30 letters, numbers, underscores or hyphens.',
        400
      );
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(discountType)) {
      throw new ApiError('Choose a valid discount type.', 400);
    }

    // Validate discount value
    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0 ||
      (discountType === 'percentage' && discountValue > 100)
    ) {
      throw new ApiError('Enter a valid discount value.', 400);
    }

    // Validate maximum uses
    if (
      maxUses !== null &&
      (!Number.isInteger(maxUses) || maxUses <= 0)
    ) {
      throw new ApiError(
        'Maximum uses must be a positive whole number.',
        400
      );
    }

    // Validate expiry date
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);

      if (
        Number.isNaN(expiryDate.getTime()) ||
        expiryDate <= new Date()
      ) {
        throw new ApiError(
          'Expiry date must be a valid future date.',
          400
        );
      }
    }

    const { data, error } = await req.userSupabase
      .from('coupons')
      .insert({
        code,
        discount_type: discountType,
        discount_value: discountValue,
        new_students_only: newStudentsOnly,
        max_uses: maxUses,
        expires_at: expiresAt,
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
