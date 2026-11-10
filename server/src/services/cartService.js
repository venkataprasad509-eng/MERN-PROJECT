
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

function getSupabase(accessToken) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  if (!accessToken) {
    const error = new Error('Please log in to continue.');
    error.statusCode = 401;
    throw error;
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function checkError(error) {
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}

async function resolveCourseId(supabase, courseId) {
  const value = String(courseId);
  let query;

  if (value.startsWith('course-')) {
    query = supabase
      .from('courses')
      .select('*')
      .eq('legacy_id', value)
      .maybeSingle();
  } else if (/^\d+$/.test(value)) {
    query = supabase
      .from('courses')
      .select('*')
      .eq('id', Number(value))
      .maybeSingle();
  } else {
    const error = new Error('Invalid course ID.');
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await query;
  checkError(error);

  if (!data) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  return data;
}

function formatItem(row) {
  const course = row.courses;

  if (!course) return null;

  const price = Number(course.price || 0);
  const originalPrice = Number(
    course.original_price ?? course.price ?? 0
  );

  const item = {
    courseId: course.legacy_id || String(course.id),
    title: course.title || '',
    instructor: course.instructor_name || '',
    thumbnail: course.thumbnail || course.image_url || '',
    price,
    originalPrice,
    discountPercentage: Number(course.discount_percentage || 0),
    rating: Number(course.rating || 0),
    reviewCount: Number(course.review_count || 0),
  };

  return {
    ...item,
    course: {
      id: item.courseId,
      title: item.title,
      instructor: item.instructor,
      thumbnail: item.thumbnail,
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercentage: item.discountPercentage,
      rating: item.rating,
      reviewCount: item.reviewCount,
    },
  };
}

async function getCart(userId, accessToken) {
  const supabase = getSupabase(accessToken);

  const { data, error } = await supabase
    .from('cart_items')
    .select('id, user_id, course_id, created_at, courses(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  checkError(error);

  return {
    items: (data || []).map(formatItem).filter(Boolean),
    coupon: null,
  };
}

async function addItem(userId, courseId, accessToken) {
  const supabase = getSupabase(accessToken);
  const course = await resolveCourseId(supabase, courseId);

  const { error } = await supabase
    .from('cart_items')
    .upsert(
      {
        user_id: userId,
        course_id: course.id,
      },
      {
        onConflict: 'user_id,course_id',
        ignoreDuplicates: true,
      }
    );

  checkError(error);

  return getCart(userId, accessToken);
}

async function removeItem(userId, courseId, accessToken) {
  const supabase = getSupabase(accessToken);
  const course = await resolveCourseId(supabase, courseId);

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', course.id);

  checkError(error);

  return getCart(userId, accessToken);
}

async function clearCart(userId, accessToken) {
  const supabase = getSupabase(accessToken);

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  checkError(error);
}

async function validateCoupon(code, userId, accessToken, courseIds) {
  const normalizedCode = String(code || '').trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error('Please enter a coupon code.');
  }

  if (!userId) {
    const error = new Error('Please log in to apply a coupon.');
    error.statusCode = 401;
    throw error;
  }

  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    const error = new Error('Please select at least one course.');
    error.statusCode = 400;
    throw error;
  }

  const supabase = getSupabase(accessToken);

  // Fetch the coupon from Supabase.
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle();

  checkError(couponError);

  if (!coupon) {
    throw new Error('Invalid coupon code.');
  }

  if (!coupon.is_active) {
    throw new Error('This coupon is currently inactive.');
  }

  if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
    throw new Error('This coupon has expired.');
  }

  if (
    coupon.max_uses !== null &&
    coupon.max_uses !== undefined &&
    Number(coupon.usage_count) >= Number(coupon.max_uses)
  ) {
    throw new Error('This coupon has reached its usage limit.');
  }

  // Check whether the student has ever enrolled in a course.
  if (coupon.new_students_only) {
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .limit(1);

    checkError(enrollmentError);

    if (enrollments && enrollments.length > 0) {
      throw new Error('This coupon is only available to new students.');
    }
  }

  // Fetch actual course prices from Supabase.
  const uniqueCourseIds = [...new Set(courseIds.map(String))];

  const courses = await Promise.all(
    uniqueCourseIds.map((id) => resolveCourseId(supabase, id))
  );

  let subtotal = courses.reduce(
    (sum, course) => sum + Number(course.price || 0),
    0
  );

  if (subtotal <= 0) {
    throw new Error('Invalid order amount.');
  }

  const discountValue = Number(coupon.discount_value);

  let discountAmount;

  if (coupon.discount_type === 'percentage') {
    discountAmount = subtotal * (discountValue / 100);
  } else if (coupon.discount_type === 'fixed') {
    discountAmount = discountValue;
  } else {
    throw new Error('Invalid coupon discount type.');
  }

  // Discount cannot exceed the subtotal.
  discountAmount = Math.min(discountAmount, subtotal);

  subtotal = Number(subtotal.toFixed(2));
  discountAmount = Number(discountAmount.toFixed(2));

  const payableTotal = Number(
    (subtotal - discountAmount).toFixed(2)
  );

  return {
    success: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: discountValue,
      new_students_only: coupon.new_students_only,
    },
    subtotal,
    discountAmount,
    payableTotal,
  };
}

async function getAvailableCoupons(accessToken) {
  const supabase = getSupabase(accessToken);

  const { data, error } = await supabase
    .from('coupons')
    .select('code, discount_type, discount_value, expires_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  checkError(error);

  return data || [];
}

module.exports = {
  cartService: {
    getCart,
    addItem,
    removeItem,
    clearCart,
    validateCoupon,
    getAvailableCoupons,
  },
};
