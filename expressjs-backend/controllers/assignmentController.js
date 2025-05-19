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
  }
};

module.exports = assignmentController;
