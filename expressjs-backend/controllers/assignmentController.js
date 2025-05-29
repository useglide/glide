const canvasService = require('../services/canvasService');
const formatTime = require('../utils/formatTime');
const firebaseService = require('../services/firebaseService');

/**
 * Assignment controller for handling assignment-related routes
 */
const assignmentController = {

  /**
   * Get assignments for a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCourseAssignments: async (req, res) => {
    try {
      const { courseId } = req.params;
      const assignments = await canvasService.getCourseAssignments(courseId);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error.message);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  },

  /**
   * Get submissions for an assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAssignmentSubmissions: async (req, res) => {
    try {
      const { courseId, assignmentId } = req.params;
      const submissions = await canvasService.getAssignmentSubmissions(courseId, assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error.message);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  },

  /**
   * Get detailed information for a specific assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAssignmentDetails: async (req, res) => {
    try {
      const startTime = Date.now();
      const { courseId, assignmentId } = req.params;
      const { uid } = req.user;

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        return res.status(401).json({
          status: 'error',
          error: 'Canvas credentials not found. Please set up your Canvas credentials.'
        });
      }

      // Get detailed assignment information
      const assignment = await canvasService.getAssignmentDetails(courseId, assignmentId, {
        includeSubmission: true,
        ...credentials
      });

      // Get course information to add context
      const courses = await canvasService.getCourses({
        includeTerms: true,
        includeTeachers: true,
        ...credentials
      });

      const course = courses.find(c => c.id === parseInt(courseId));

      // Process assignment data
      let processedAssignment = { ...assignment };

      // Add course information
      if (course) {
        processedAssignment.course_name = course.name;
        processedAssignment.course_code = course.course_code;
        processedAssignment.course_id = course.id;
        processedAssignment.term = course.term ? course.term.name : null;
        processedAssignment.teachers = course.teachers || [];
      }

      // Process submission data if available
      if (assignment.submission) {
        processedAssignment.grade_info = {
          score: assignment.submission.score,
          grade: assignment.submission.grade,
          submitted_at: assignment.submission.submitted_at,
          late: assignment.submission.late,
          missing: assignment.submission.missing || (!assignment.submission.submitted_at && new Date(assignment.due_at) < new Date()),
          graded: assignment.submission.workflow_state === 'graded',
          points_possible: assignment.points_possible,
          percentage: assignment.submission.score !== null && assignment.points_possible ?
            (assignment.submission.score / assignment.points_possible * 100).toFixed(1) : null
        };
      } else {
        processedAssignment.grade_info = {
          score: null,
          grade: null,
          submitted_at: null,
          late: false,
          missing: assignment.due_at ? new Date(assignment.due_at) < new Date() : false,
          graded: false,
          points_possible: assignment.points_possible,
          percentage: null
        };
      }

      // Calculate timing information
      const endTime = Date.now();
      const totalTimeMs = endTime - startTime;

      // Return the formatted response
      res.json({
        status: 'success',
        assignment: processedAssignment,
        timing: {
          totalTimeMs,
          totalTimeSec: (totalTimeMs / 1000).toFixed(2),
          formattedTime: formatTime(totalTimeMs)
        }
      });
    } catch (error) {
      console.error('Error fetching assignment details:', error.message);
      res.status(500).json({
        status: 'error',
        error: 'Failed to fetch assignment details',
        message: error.message
      });
    }
  },

  /**
   * Submit an assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  submitAssignment: async (req, res) => {
    try {
      const { courseId, assignmentId } = req.params;
      const { uid } = req.user;
      const submissionData = req.body;

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        return res.status(401).json({
          status: 'error',
          error: 'Canvas credentials not found. Please set up your Canvas credentials.'
        });
      }

      // Submit the assignment
      const submission = await canvasService.submitAssignment(courseId, assignmentId, submissionData, credentials);

      res.json({
        status: 'success',
        submission
      });

    } catch (error) {
      console.error('Error submitting assignment:', error.message);
      res.status(500).json({
        status: 'error',
        error: 'Failed to submit assignment',
        message: error.message
      });
    }
  },

  /**
   * Upload a file for submission
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  uploadSubmissionFile: async (req, res) => {
    try {
      const { courseId, assignmentId, userId } = req.params;
      const { uid } = req.user;

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          error: 'No file uploaded'
        });
      }

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        return res.status(401).json({
          status: 'error',
          error: 'Canvas credentials not found. Please set up your Canvas credentials.'
        });
      }

      // Prepare file data for Canvas upload
      const fileData = {
        name: req.file.originalname,
        size: req.file.size,
        content_type: req.file.mimetype,
        buffer: req.file.buffer
      };

      console.log('File upload request:', {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        bufferLength: req.file.buffer.length
      });

      // Upload the file
      const uploadResult = await canvasService.uploadSubmissionFile(courseId, assignmentId, userId, fileData, credentials);

      res.json({
        status: 'success',
        upload: uploadResult
      });

    } catch (error) {
      console.error('Error uploading submission file:', error.message);
      res.status(500).json({
        status: 'error',
        error: 'Failed to upload submission file',
        message: error.message
      });
    }
  },

  /**
   * Get detailed submission information including attachments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSubmissionDetails: async (req, res) => {
    try {
      const { courseId, assignmentId, userId } = req.params;
      const { uid } = req.user;

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        return res.status(401).json({
          status: 'error',
          error: 'Canvas credentials not found. Please set up your Canvas credentials.'
        });
      }

      // Get detailed submission information
      const submissionDetails = await canvasService.getSubmissionDetails(courseId, assignmentId, userId, credentials);

      console.log('Submission details received:', JSON.stringify(submissionDetails, null, 2));

      res.json({
        status: 'success',
        submission: submissionDetails
      });

    } catch (error) {
      console.error('Error fetching submission details:', error.message);
      res.status(500).json({
        status: 'error',
        error: 'Failed to fetch submission details',
        message: error.message
      });
    }
  },

  /**
   * Download a submitted file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  downloadSubmissionFile: async (req, res) => {
    try {
      const { courseId, assignmentId, userId, fileId } = req.params;
      const { uid } = req.user;

      console.log('Download request:', { courseId, assignmentId, userId, fileId, uid });

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        return res.status(401).json({
          status: 'error',
          error: 'Canvas credentials not found. Please set up your Canvas credentials.'
        });
      }

      // Download the file from Canvas
      const fileData = await canvasService.downloadSubmissionFile(fileId, credentials);

      console.log('File data received:', {
        filename: fileData.filename,
        contentType: fileData.contentType,
        size: fileData.size,
        bufferSize: fileData.buffer ? fileData.buffer.length : 'no buffer'
      });

      // Set appropriate headers for file download
      res.setHeader('Content-Type', fileData.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);

      // Send the file buffer
      res.send(fileData.buffer);

    } catch (error) {
      console.error('Error downloading submission file:', error.message);
      console.error('Full error:', error);
      res.status(500).json({
        status: 'error',
        error: 'Failed to download submission file',
        message: error.message
      });
    }
  }
};

module.exports = assignmentController;
