const express = require('express');
const favoriteCoursesController = require('../controllers/favoriteCoursesController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's favorite courses
router.get('/favorite-courses', authMiddleware, favoriteCoursesController.getFavoriteCourses);

// Add a course to favorites
router.post('/favorite-courses', authMiddleware, favoriteCoursesController.addFavoriteCourse);

// Remove a course from favorites
router.delete('/favorite-courses/:courseId', authMiddleware, favoriteCoursesController.removeFavoriteCourse);

// Update a favorite course's color
router.patch('/favorite-courses/:courseId/color', authMiddleware, favoriteCoursesController.updateFavoriteCourseColor);

// Update a favorite course's display name
router.patch('/favorite-courses/:courseId/display-name', authMiddleware, favoriteCoursesController.updateFavoriteCourseDisplayName);

// Get user's explicitly removed courses
router.get('/removed-courses', authMiddleware, favoriteCoursesController.getRemovedCourses);

// Clear user's removed courses list (reset preferences)
router.delete('/removed-courses', authMiddleware, favoriteCoursesController.clearRemovedCourses);

module.exports = router;
