
const Assessment = require('../models/Assessment');
const { ApiError } = require('../middleware/errorHandler');
const { enrollmentService } = require('./enrollmentService');

// Find a course and verify that it belongs to the instructor.
async function getOwnedCourse(userSupabase, courseId, instructorId) {
  if (!userSupabase || !instructorId) {
    throw new ApiError('Authentication is required.', 401);
  }

  if (!courseId) {
    throw new ApiError('Course ID is required.', 400);
  }

  const value = String(courseId);
  let query = userSupabase
    .from('courses')
    .select('id, legacy_id, title')
    .eq('instructor_id', instructorId);

  if (value.startsWith('course-')) {
    query = query.eq('legacy_id', value);
  } else if (/^\d+$/.test(value)) {
    query = query.eq('id', Number(value));
  } else {
    throw new ApiError('Invalid course ID.', 400);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new ApiError(
      error.message || 'Unable to verify course ownership.',
      500
    );
  }

  if (!data) {
    throw new ApiError(
      'Course not found or you do not own this course.',
      404
    );
  }

  return data;
}

// Validate assessment details before saving.
function validateAssessment(data) {
  if (!data.title || !String(data.title).trim()) {
    throw new ApiError('Assessment title is required.', 400);
  }

  if (!['assignment', 'quiz'].includes(data.type)) {
    throw new ApiError(
      'Assessment type must be assignment or quiz.',
      400
    );
  }

  const maxMarks = Number(data.maxMarks);

  if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
    throw new ApiError('Maximum marks must be greater than zero.', 400);
  }

  if (!['draft', 'published'].includes(data.status || 'draft')) {
    throw new ApiError('Invalid assessment status.', 400);
  }

  if (data.type === 'quiz') {
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new ApiError('A quiz must contain at least one question.', 400);
    }

    for (const question of data.questions) {
      if (!question.questionText || !String(question.questionText).trim()) {
        throw new ApiError('Every question must have question text.', 400);
      }

      if (!Array.isArray(question.options) || question.options.length < 2) {
        throw new ApiError(
          'Every quiz question must have at least two options.',
          400
        );
      }

      const correctAnswer = Number(question.correctAnswer);

      if (
        !Number.isInteger(correctAnswer) ||
        correctAnswer < 0 ||
        correctAnswer >= question.options.length
      ) {
        throw new ApiError(
          'Every question must have a valid correct answer.',
          400
        );
      }

      if (
        !Number.isFinite(Number(question.marks)) ||
        Number(question.marks) <= 0
      ) {
        throw new ApiError(
          'Every question must have marks greater than zero.',
          400
        );
      }
    }
  }
}

// Remove correct answers before sending quiz questions to students.
function formatStudentAssessment(assessment) {
  const result = assessment.toObject();

  if (result.type === 'quiz') {
    result.questions = result.questions.map((question) => {
      const { correctAnswer, ...safeQuestion } = question;
      return safeQuestion;
    });
  }

  return result;
}

const assessmentService = {
  // Instructor creates an assignment or quiz.
  async createAssessment(data, userSupabase, instructorId) {
    validateAssessment(data);

    const course = await getOwnedCourse(
      userSupabase,
      data.courseId,
      instructorId
    );

    const assessment = await Assessment.create({
      courseId: String(course.id),
      instructorId,
      title: String(data.title).trim(),
      description: data.description || '',
      type: data.type,
      questions: data.type === 'quiz' ? data.questions : [],
      dueDate: data.dueDate || null,
      maxMarks: Number(data.maxMarks),
      timeLimit:
        data.type === 'quiz' && data.timeLimit
          ? Number(data.timeLimit)
          : null,
      status: data.status || 'draft',
    });

    return assessment;
  },

  // Instructor gets assessments belonging to their course.
  async getInstructorAssessments(
    courseId,
    userSupabase,
    instructorId
  ) {
    const course = await getOwnedCourse(
      userSupabase,
      courseId,
      instructorId
    );

    return Assessment.find({
      courseId: String(course.id),
      instructorId,
    }).sort({ createdAt: -1 });
  },

  // Student gets published assessments after enrollment verification.
  async getStudentAssessments(
    courseId,
    userSupabase,
    studentId
  ) {
    const isEnrolled = await enrollmentService.isStudentEnrolled(
      userSupabase,
      courseId,
      studentId
    );

    if (!isEnrolled) {
      throw new ApiError(
        'You must be enrolled in this course to view assessments.',
        403
      );
    }

    const value = String(courseId);
    let databaseCourseId = value;

    // Resolve legacy course IDs to the actual Supabase database ID.
    if (value.startsWith('course-')) {
      const { data, error } = await userSupabase
        .from('courses')
        .select('id')
        .eq('legacy_id', value)
        .maybeSingle();

      if (error || !data) {
        throw new ApiError('Course not found.', 404);
      }

      databaseCourseId = String(data.id);
    }

    const assessments = await Assessment.find({
      courseId: databaseCourseId,
      status: 'published',
    }).sort({ createdAt: -1 });

    return assessments.map(formatStudentAssessment);
  },
};

module.exports = { assessmentService };
