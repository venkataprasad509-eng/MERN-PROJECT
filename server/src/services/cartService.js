
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

function getSupabase(accessToken) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  if (!accessToken) {
    const error = new Error('Please log in to use your saved cart.');
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

const DEMO_COUPONS = {
  SAVE10: {
    discount: 10,
    type: 'percentage',
    description: '10% off your order',
  },
  FLAT500: {
    discount: 500,
    type: 'flat',
    description: '₹500 off your order',
  },
  WELCOME20: {
    discount: 20,
    type: 'percentage',
    description: '20% off for new students',
  },
};

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

async function applyCoupon(code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const coupon = DEMO_COUPONS[normalizedCode];

  if (!coupon) {
    return {
      success: false,
      message: 'Invalid coupon code',
    };
  }

  return {
    success: true,
    coupon: {
      code: normalizedCode,
      ...coupon,
    },
  };
}

function getAvailableCoupons() {
  return Object.entries(DEMO_COUPONS).map(([code, data]) => ({
    code,
    ...data,
  }));
}

module.exports = {
  cartService: {
    getCart,
    addItem,
    removeItem,
    clearCart,
    applyCoupon,
    getAvailableCoupons,
  },
};
