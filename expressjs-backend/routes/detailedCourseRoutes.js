const express = require('express');
const detailedCourseController = require('../controllers/detailedCourseController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get detailed data for all courses (current and past)
router.get('/courses/detailed', authMiddleware, detailedCourseController.getDetailedCourseData);

module.exports = router;
