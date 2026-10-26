
const { Router } = require('express');
const { enrollmentController } = require('../controllers/enrollmentController');
const { requireAuth } = require('../middleware/requireAuth');

const router = Router();

router.use(requireAuth);

router.get('/', enrollmentController.getEnrollments);
router.get('/:id', enrollmentController.getEnrollmentById);
router.post('/', enrollmentController.enroll);
router.post('/lesson-complete', enrollmentController.markLessonComplete);
router.post('/progress', enrollmentController.updateProgress);

module.exports = router;
