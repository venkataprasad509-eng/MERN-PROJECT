
const supabase = require('../config/supabase');
const { ApiError } = require('../middleware/errorHandler');

function checkError(error) {
  if (!error) return;

  if (error.code === '23505') {
    throw new ApiError('You are already enrolled in this course.', 409);
  }

  if (error.code === '23503') {
    throw new ApiError(
      'The selected course or student does not exist.',
      400
    );
  }

  throw new ApiError(
    error.message || 'Enrollment database error',
    500
  );
}

async function resolveCourseId(courseId) {
  if (
    courseId === undefined ||
    courseId === null ||
    courseId === ''
  ) {
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
  // Get enrollments belonging to one student
  async getEnrollments(userId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false });

    checkError(error);
    return (data || []).map(formatEnrollment);
  },

  // Admin: get all enrollments from the database
  async getAllEnrollments() {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .order('enrolled_at', { ascending: false });

    checkError(error);
    return (data || []).map(formatEnrollment);
  },

  // Instructor: get students enrolled in this instructor's courses
  async getInstructorStudents(userSupabase, instructorId) {
    if (!userSupabase) {
      throw new ApiError(
        'Authenticated database client is missing.',
        500
      );
    }

    if (!instructorId) {
      throw new ApiError('Instructor ID is missing.', 400);
    }

    // 1. Get only this instructor's courses.
    const { data: courses, error: courseError } = await userSupabase
      .from('courses')
      .select('id, legacy_id, title, instructor_id')
      .eq('instructor_id', instructorId);

    checkError(courseError);

    if (!courses || courses.length === 0) {
      return {
        students: [],
        totalStudents: 0,
        courseCounts: [],
      };
    }

    const courseIds = courses.map((course) => course.id);

    // 2. Get enrollments for those courses only.
    const { data: enrollments, error: enrollmentError } =
      await userSupabase
        .from('enrollments')
        .select('id, student_id, course_id, enrolled_at')
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false });

    checkError(enrollmentError);

    if (!enrollments || enrollments.length === 0) {
      return {
        students: [],
        totalStudents: 0,
        courseCounts: courses.map((course) => ({
          courseId: String(course.id),
          courseTitle: course.title,
          studentCount: 0,
        })),
      };
    }

    // 3. Get the student IDs from enrollments.
    const studentIds = [
      ...new Set(enrollments.map((item) => item.student_id)),
    ];

    // 4. Get student profiles.
    const { data: profiles, error: profileError } =
      await userSupabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds)
        .eq('role', 'student');

    checkError(profileError);

    const profileMap = new Map(
      (profiles || []).map((profile) => [
        profile.id,
        profile,
      ])
    );

    const courseMap = new Map(
      courses.map((course) => [
        String(course.id),
        course,
      ])
    );

    // 5. Build the instructor's student list.
    const students = enrollments.map((enrollment) => {
      const profile = profileMap.get(enrollment.student_id);
      const course = courseMap.get(String(enrollment.course_id));

      return {
        enrollmentId: String(enrollment.id),
        studentId: enrollment.student_id,
        studentName: profile?.full_name || 'Student',
        studentEmail: profile?.email || '',
        courseId: course
          ? String(course.legacy_id || course.id)
          : String(enrollment.course_id),
        courseTitle: course?.title || 'Course',
        enrolledAt: enrollment.enrolled_at,
      };
    });

    // 6. Count enrollments for each course.
    const courseCounts = courses.map((course) => ({
      courseId: String(course.id),
      courseTitle: course.title,
      studentCount: enrollments.filter(
        (item) => String(item.course_id) === String(course.id)
      ).length,
    }));

    return {
      students,
      totalStudents: students.length,
      courseCounts,
    };
  },

  async getEnrollmentById(id, userId) {
    return formatEnrollment(
      await getOwnedEnrollment(id, userId)
    );
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
      throw new ApiError(
        'You are already enrolled in this course.',
        409
      );
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
      throw new ApiError(
        'Progress must be between 0 and 100.',
        400
      );
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
