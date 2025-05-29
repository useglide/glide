const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get assignments for a course
router.get('/courses/:courseId/assignments', assignmentController.getCourseAssignments);

// Get submissions for an assignment
router.get('/courses/:courseId/assignments/:assignmentId/submissions', assignmentController.getAssignmentSubmissions);

// Get detailed information for a specific assignment (protected route)
router.get('/courses/:courseId/assignments/:assignmentId/details', authMiddleware, assignmentController.getAssignmentDetails);

// Submit an assignment (protected route)
router.post('/courses/:courseId/assignments/:assignmentId/submissions', authMiddleware, assignmentController.submitAssignment);

// Upload a file for submission (protected route)
router.post('/courses/:courseId/assignments/:assignmentId/submissions/:userId/files', authMiddleware, upload.single('file'), assignmentController.uploadSubmissionFile);

// Get detailed submission information including attachments (protected route)
router.get('/courses/:courseId/assignments/:assignmentId/submissions/:userId/details', authMiddleware, assignmentController.getSubmissionDetails);

// Download a submitted file (protected route)
router.get('/courses/:courseId/assignments/:assignmentId/submissions/:userId/files/:fileId/download', authMiddleware, assignmentController.downloadSubmissionFile);

// Test file upload endpoint (for debugging)
router.post('/test-upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      status: 'success',
      file: {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        bufferLength: req.file.buffer.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
