
const { enrollmentService } = require('../services/enrollmentService');
const { asyncHandler } = require('../middleware/errorHandler');

const enrollmentController = {
  getEnrollments: asyncHandler(async (req, res) => {
    const enrollments = await enrollmentService.getEnrollments(req.user.id);
    res.json({ success: true, enrollments });
  }),

  getEnrollmentById: asyncHandler(async (req, res) => {
    const enrollment = await enrollmentService.getEnrollmentById(
      req.params.id,
      req.user.id
    );

    res.json({ success: true, enrollment });
  }),

  enroll: asyncHandler(async (req, res) => {
    const { courseId } = req.body;

    const enrollment = await enrollmentService.enroll(
      req.user.id,
      courseId
    );

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      enrollment,
    });
  }),

  markLessonComplete: asyncHandler(async (req, res) => {
    const { enrollmentId, lessonId } = req.body;

    const enrollment = await enrollmentService.markLessonComplete(
      enrollmentId,
      lessonId,
      req.user.id
    );

    res.json({ success: true, enrollment });
  }),

  updateProgress: asyncHandler(async (req, res) => {
    const { enrollmentId, progress } = req.body;

    const enrollment = await enrollmentService.updateProgress(
      enrollmentId,
      progress,
      req.user.id
    );

    res.json({ success: true, enrollment });
  }),
};

module.exports = { enrollmentController };
