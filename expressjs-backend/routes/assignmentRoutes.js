const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get assignments for a course
router.get('/courses/:courseId/assignments', assignmentController.getCourseAssignments);

// Get submissions for an assignment
router.get('/courses/:courseId/assignments/:assignmentId/submissions', assignmentController.getAssignmentSubmissions);

// Get detailed information for a specific assignment (protected route)
router.get('/courses/:courseId/assignments/:assignmentId/details', authMiddleware, assignmentController.getAssignmentDetails);

module.exports = router;
