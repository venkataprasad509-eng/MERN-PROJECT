const supabase = require('../config/supabase');
const { ApiError } = require('../middleware/errorHandler');
const { mockCourses } = require('../data/mockCourses');

/**
 * Convert a Supabase database row into the course format
 * expected by the existing frontend.
 */
function formatCourse(row) {
  return {
    id: row.legacy_id || String(row.id),
    databaseId: row.id,
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
 * Convert frontend course fields to Supabase database columns.
 */
function toDatabase(data) {
  const result = {};
  const fields = {
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

  // Keep the database image URL and frontend thumbnail synchronized.
  if (data.thumbnail !== undefined && data.imageUrl === undefined) {
    result.image_url = data.thumbnail;
  }
  if (data.imageUrl !== undefined && data.thumbnail === undefined) {
    result.thumbnail = data.imageUrl;
  }

  return result;
}

async function getRowById(id) {
  const strId = String(id);

  // 1. First attempt database query
  try {
    let query;
    if (strId.startsWith('course-')) {
      query = supabase.from('courses').select('*').eq('legacy_id', strId);
    } else if (/^\d+$/.test(strId)) {
      query = supabase.from('courses').select('*').eq('id', Number(strId));
    }

    if (query) {
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return formatCourse(data);
      }
    }
  } catch (_) {
    // Database fallback to mock data
  }

  // 2. Fallback to mockCourses list
  const mockMatch = mockCourses.find(
    (c) => String(c.id) === strId || String(c.id).replace('course-', '') === strId
  );
  if (mockMatch) {
    return { ...mockMatch, price: Number(mockMatch.price || 0) };
  }

  throw new ApiError(`Course with id '${id}' not found`, 404);
}

function handleDatabaseError(error) {
  if (error) {
    throw new ApiError(error.message || 'Database operation failed', 500);
  }
}

const courseService = {
  /**
   * Get published courses with filtering, sorting and pagination.
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
  }) {
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
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    if (minPrice !== undefined) {
      result = result.filter((c) => c.price >= Number(minPrice));
    }

    if (maxPrice !== undefined) {
      result = result.filter((c) => c.price <= Number(maxPrice));
    }

    if (level) {
      const levels = level
        .split(',')
        .map((value) => value.trim().toLowerCase());

      result = result.filter((c) => levels.includes(c.level.toLowerCase()));
    }

    if (minRating !== undefined) {
      result = result.filter((c) => c.rating >= Number(minRating));
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
        result.sort((a, b) => b.enrolledStudents - a.enrolledStudents);
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

  /** Get one course by its legacy or numeric database ID. */
  async getCourseById(id) {
    return await getRowById(id);
  },

  /** Create a course in Supabase. */
  async createCourse(data) {
    const legacyId = `course-${Date.now()}`;
    const payload = toDatabase({ ...data, legacyId });
    const { data: created, error } = await supabase
      .from('courses')
      .insert(payload)
      .select('*')
      .single();

    handleDatabaseError(error);
    return formatCourse(created);
  },

  /** Update a course by its legacy or numeric database ID. */
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

  /** Delete a course by its legacy or numeric database ID. */
  async deleteCourse(id) {
    const current = await getRowById(id);
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', current.databaseId || current.id);

    handleDatabaseError(error);
    return true;
  },

  /** Get featured courses. */
  async getFeatured() {
    return this.getAllCourses({ featured: true, limit: 4 });
  },

  /** Get trending courses. */
  async getTrending() {
    return this.getAllCourses({ trending: true, limit: 4 });
  },

  /** Get top-rated courses. */
  async getTopRated() {
    return this.getAllCourses({ topRated: true, limit: 4 });
  },

  /** Get courses by category. */
  async getByCategory(category, query = {}) {
    return this.getAllCourses({ ...query, category });
  },
};

module.exports = { courseService };
