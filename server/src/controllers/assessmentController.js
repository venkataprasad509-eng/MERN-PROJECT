
const {
  assessmentService,
} = require('../services/assessmentService');

const assessmentController = {
  // Instructor creates an assignment or quiz.
  async create(req, res, next) {
    try {
      const assessment = await assessmentService.createAssessment(
        req.body,
        req.userSupabase,
        req.user.id
      );

      return res.status(201).json({
        success: true,
        message: 'Assessment created successfully.',
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  },

  // Instructor views assessments for their course.
  async getInstructorAssessments(req, res, next) {
    try {
      const assessments =
        await assessmentService.getInstructorAssessments(
          req.params.courseId,
          req.userSupabase,
          req.user.id
        );

      return res.status(200).json({
        success: true,
        data: assessments,
      });
    } catch (error) {
      next(error);
    }
  },

  // Enrolled student views published assessments.
  async getStudentAssessments(req, res, next) {
    try {
      const assessments =
        await assessmentService.getStudentAssessments(
          req.params.courseId,
          req.userSupabase,
          req.user.id
        );

      return res.status(200).json({
        success: true,
        data: assessments,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { assessmentController };
