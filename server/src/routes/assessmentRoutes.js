
const { Router } = require('express');

const {
  assessmentController,
} = require('../controllers/assessmentController');

const { requireAuth } = require('../middleware/requireAuth');

const router = Router();

// All assessment routes require authentication.
router.use(requireAuth);

// Instructor creates an assignment or quiz.
router.post(
  '/',
  assessmentController.create
);

// Instructor views assessments for a course.
router.get(
  '/instructor/:courseId',
  assessmentController.getInstructorAssessments
);

// Enrolled student views published assessments.
router.get(
  '/course/:courseId',
  assessmentController.getStudentAssessments
);

module.exports = router;
