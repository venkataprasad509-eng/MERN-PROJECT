
const supabase = require('../config/supabase');
const { ApiError } = require('../middleware/errorHandler');
const { mockCourses } = require('../data/mockCourses');

/**
 * Convert a Supabase database row into the frontend course format.
 */
function formatCourse(row) {
  return {
    // Always use the actual Supabase BIGINT ID.
    id: row.id,
    databaseId: row.id,

    // Keep legacy ID separately.
    legacyId: row.legacy_id || null,

    title: row.title,
    shortDescription: row.short_description || '',
    description: row.description || '',
    instructor: row.instructor_name || '',
    instructorId: row.instructor_id || null,
    category: row.category || '',
    categoryId: row.category_id || '',
    thumbnail: row.thumbnail || row.image_url || '',
    imageUrl: row.image_url || row.thumbnail || '',
    price: Number(row.price || 0),
    originalPrice: Number(row.original_price ?? row.price ?? 0),
    discountPercentage: Number(row.discount_percentage || 0),
    level: row.level || 'Beginner',
    language: row.language || 'English',
    duration: row.duration || '',
    totalLessons: Number(row.total_lessons || 0),
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    enrolledStudents: Number(row.enrolled_students || 0),
    learningObjectives: row.learning_objectives || [],
    prerequisites: row.prerequisites || [],
    curriculum: row.curriculum || [],
    tags: row.tags || [],
    status: row.status || 'draft',
    isFeatured: Boolean(row.is_featured),
    isTrending: Boolean(row.is_trending),
    isTopRated: Boolean(row.is_top_rated),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert frontend course fields to database columns.
 */
function toDatabase(data) {
  const result = {};

  const fields = {
    legacyId: 'legacy_id',
    title: 'title',
    shortDescription: 'short_description',
    description: 'description',
    instructor: 'instructor_name',
    instructorId: 'instructor_id',
    category: 'category',
    categoryId: 'category_id',
    thumbnail: 'thumbnail',
    imageUrl: 'image_url',
    price: 'price',
    originalPrice: 'original_price',
    discountPercentage: 'discount_percentage',
    level: 'level',
    language: 'language',
    duration: 'duration',
    totalLessons: 'total_lessons',
    rating: 'rating',
    reviewCount: 'review_count',
    enrolledStudents: 'enrolled_students',
    learningObjectives: 'learning_objectives',
    prerequisites: 'prerequisites',
    curriculum: 'curriculum',
    tags: 'tags',
    status: 'status',
    isFeatured: 'is_featured',
    isTrending: 'is_trending',
    isTopRated: 'is_top_rated',
  };

  for (const [key, column] of Object.entries(fields)) {
    if (data[key] !== undefined) {
      result[column] = data[key];
    }
  }

  if (data.thumbnail !== undefined && data.imageUrl === undefined) {
    result.image_url = data.thumbnail;
  }

  if (data.imageUrl !== undefined && data.thumbnail === undefined) {
    result.thumbnail = data.imageUrl;
  }

  return result;
}

/**
 * Find a course by its legacy or numeric database ID.
 */
async function getRowById(id) {
  const strId = String(id);

  try {
    let query;

    if (strId.startsWith('course-')) {
      query = supabase
        .from('courses')
        .select('*')
        .eq('legacy_id', strId);
    } else if (/^\d+$/.test(strId)) {
      query = supabase
        .from('courses')
        .select('*')
        .eq('id', Number(strId));
    }

    if (query) {
      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        return formatCourse(data);
      }
    }
  } catch (_) {
    // Continue to mock-data fallback.
  }

  const mockMatch = mockCourses.find(
    (course) =>
      String(course.id) === strId ||
      String(course.id).replace('course-', '') === strId
  );

  if (mockMatch) {
    return {
      ...mockMatch,
      price: Number(mockMatch.price || 0),
    };
  }

  throw new ApiError(`Course with id '${id}' not found`, 404);
}

function handleDatabaseError(error) {
  if (error) {
    throw new ApiError(
      error.message || 'Database operation failed',
      500
    );
  }
}

const courseService = {
  /**
   * Get all courses for the admin dashboard.
   */
  async getAllCoursesAdmin() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    handleDatabaseError(error);

    return (data || []).map(formatCourse);
  },

  /**
   * Get courses belonging to a specific instructor.
   */
  async getInstructorCourses(userSupabase, instructorId) {
    if (!userSupabase) {
      throw new ApiError(
        'Authenticated database client is missing',
        500
      );
    }

    if (!instructorId) {
      throw new ApiError('Instructor ID is missing', 400);
    }

    const { data, error } = await userSupabase
      .from('courses')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    handleDatabaseError(error);

    return (data || []).map(formatCourse);
  },

  /**
   * Get courses with filtering, sorting and pagination.
   */
  async getAllCourses({
    search,
    category,
    minPrice,
    maxPrice,
    level,
    minRating,
    sort,
    page = 1,
    limit = 12,
    featured,
    trending,
    topRated,
  } = {}) {
    let query = supabase.from('courses').select('*');

    if (featured === 'true' || featured === true) {
      query = query.eq('is_featured', true);
    }

    if (trending === 'true' || trending === true) {
      query = query.eq('is_trending', true);
    }

    if (topRated === 'true' || topRated === true) {
      query = query.eq('is_top_rated', true);
    }

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error } = await query;

    handleDatabaseError(error);

    let result = (data || []).map(formatCourse);

    if (search) {
      const q = search.toLowerCase();

      result = result.filter(
        (course) =>
          (course.title || '').toLowerCase().includes(q) ||
          (course.instructor || '').toLowerCase().includes(q) ||
          (course.category || '').toLowerCase().includes(q)
      );
    }

    if (minPrice !== undefined) {
      result = result.filter(
        (course) => course.price >= Number(minPrice)
      );
    }

    if (maxPrice !== undefined) {
      result = result.filter(
        (course) => course.price <= Number(maxPrice)
      );
    }

    if (level) {
      const levels = level
        .split(',')
        .map((value) => value.trim().toLowerCase());

      result = result.filter(
        (course) => levels.includes(course.level.toLowerCase())
      );
    }

    if (minRating !== undefined) {
      result = result.filter(
        (course) => course.rating >= Number(minRating)
      );
    }

    switch (sort) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;

      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;

      case 'rating_desc':
        result.sort((a, b) => b.rating - a.rating);
        break;

      case 'newest':
        result.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;

      case 'popular':
        result.sort(
          (a, b) => b.enrolledStudents - a.enrolledStudents
        );
        break;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 12);
    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = (pageNum - 1) * pageSize;

    return {
      courses: result.slice(start, start + pageSize),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: pageSize,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  },

  /**
   * Get one course by its ID.
   */
  async getCourseById(id) {
    return getRowById(id);
  },

  /**
   * Create a course using the authenticated user's Supabase client.
   */
  async createCourse(data, userSupabase) {
    if (!userSupabase) {
      throw new ApiError(
        'Authenticated database client is missing',
        500
      );
    }

    if (!data.instructorId) {
      throw new ApiError('Instructor ID is missing', 400);
    }

    const legacyId = `course-${Date.now()}`;

    const payload = toDatabase({
      ...data,
      legacyId,
    });

    const { data: created, error } = await userSupabase
      .from('courses')
      .insert(payload)
      .select('*')
      .single();

    handleDatabaseError(error);

    return formatCourse(created);
  },

  /**
   * Update a course.
   */
  async updateCourse(id, data) {
    const current = await getRowById(id);
    const payload = toDatabase(data);

    const { data: updated, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', current.databaseId || current.id)
      .select('*')
      .single();

    handleDatabaseError(error);

    return formatCourse(updated);
  },

  /**
   * Delete a course.
   */
  async deleteCourse(id) {
    const current = await getRowById(id);

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', current.databaseId || current.id);

    handleDatabaseError(error);

    return true;
  },

  async getFeatured() {
    return this.getAllCourses({ featured: true, limit: 4 });
  },

  async getTrending() {
    return this.getAllCourses({ trending: true, limit: 4 });
  },

  async getTopRated() {
    return this.getAllCourses({ topRated: true, limit: 4 });
  },

  async getByCategory(category, query = {}) {
    return this.getAllCourses({ ...query, category });
  },
};

module.exports = { courseService };