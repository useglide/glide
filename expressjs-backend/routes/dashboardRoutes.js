const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get combined course data, grades, and assignments in a single request
router.get('/combined-course-data', authMiddleware, dashboardController.getCombinedCourseData);

// Get all data for a user
router.get('/all-data', authMiddleware, dashboardController.getAllData);

module.exports = router;
