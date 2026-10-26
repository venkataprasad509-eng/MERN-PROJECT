const { Router } = require('express');
const { instructorController } = require('../controllers/instructorController');

const router = Router();

router.get('/dashboard', instructorController.getDashboard);

module.exports = router;
