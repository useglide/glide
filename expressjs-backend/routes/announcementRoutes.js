const express = require('express');
const announcementController = require('../controllers/announcementController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get announcements for all available courses
router.get('/announcements', announcementController.getAnnouncements);

// Get announcements for a specific course (protected route)
router.get('/courses/:courseId/announcements', authMiddleware, announcementController.getCourseAnnouncements);

module.exports = router;
