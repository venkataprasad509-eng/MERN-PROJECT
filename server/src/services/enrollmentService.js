
const supabase = require('../config/supabase');
const { ApiError } = require('../middleware/errorHandler');

function checkError(error) {
  if (!error) return;

  if (error.code === '23505') {
    throw new ApiError('You are already enrolled in this course.', 409);
  }

  if (error.code === '23503') {
    throw new ApiError('The selected course or student does not exist.', 400);
  }

  throw new ApiError(error.message || 'Enrollment database error', 500);
}

async function resolveCourseId(courseId) {
  if (courseId === undefined || courseId === null || courseId === '') {
    throw new ApiError('Course ID is required.', 400);
  }

  const value = String(courseId);
  let query = supabase.from('courses').select('id, legacy_id');

  if (/^course-/.test(value)) {
    query = query.eq('legacy_id', value);
  } else if (/^\d+$/.test(value)) {
    query = query.eq('id', Number(value));
  } else {
    throw new ApiError('Invalid course ID.', 400);
  }

  const { data, error } = await query.maybeSingle();
  checkError(error);

  if (!data) {
    throw new ApiError('Course not found.', 404);
  }

  return data;
}

function formatEnrollment(row) {
  const course = row.courses;

  return {
    id: String(row.id),
    userId: row.student_id,
    courseId: course?.legacy_id || String(row.course_id),
    enrolledAt: row.enrolled_at,
    progress: row.progress,
    completedLessons: [],
    course: course
      ? {
          id: course.legacy_id || String(course.id),
          title: course.title,
          thumbnail: course.thumbnail || course.image_url || '',
          imageUrl: course.image_url || course.thumbnail || '',
          price: Number(course.price || 0),
          instructor: course.instructor_name || '',
        }
      : null,
  };
}

async function getOwnedEnrollment(enrollmentId, userId) {
  const id = Number(enrollmentId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError('Invalid enrollment ID.', 400);
  }

  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('id', id)
    .eq('student_id', userId)
    .maybeSingle();

  checkError(error);

  if (!data) {
    throw new ApiError('Enrollment not found.', 404);
  }

  return data;
}

const enrollmentService = {
  async getEnrollments(userId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false });

    checkError(error);
    return (data || []).map(formatEnrollment);
  },

  async getEnrollmentById(id, userId) {
    return formatEnrollment(await getOwnedEnrollment(id, userId));
  },

  async enroll(userId, courseId) {
    const course = await resolveCourseId(courseId);

    const { data: existing, error: findError } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', userId)
      .eq('course_id', course.id)
      .maybeSingle();

    checkError(findError);

    if (existing) {
      throw new ApiError('You are already enrolled in this course.', 409);
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        course_id: course.id,
        progress: 0,
      })
      .select('*, courses(*)')
      .single();

    checkError(error);
    return formatEnrollment(data);
  },

  async markLessonComplete(enrollmentId, lessonId, userId) {
    if (!lessonId) {
      throw new ApiError('Lesson ID is required.', 400);
    }

    // The current database schema has no completed_lessons column.
    // Do not claim lesson completion until a lesson-progress table is added.
    await getOwnedEnrollment(enrollmentId, userId);

    throw new ApiError(
      'Lesson tracking needs a lesson-progress table before it can be saved.',
      501
    );
  },

  async updateProgress(enrollmentId, progress, userId) {
    const numericProgress = Number(progress);

    if (
      !Number.isFinite(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      throw new ApiError('Progress must be between 0 and 100.', 400);
    }

    await getOwnedEnrollment(enrollmentId, userId);

    const { data, error } = await supabase
      .from('enrollments')
      .update({ progress: Math.round(numericProgress) })
      .eq('id', Number(enrollmentId))
      .eq('student_id', userId)
      .select('*, courses(*)')
      .single();

    checkError(error);
    return formatEnrollment(data);
  },
};

module.exports = { enrollmentService };
