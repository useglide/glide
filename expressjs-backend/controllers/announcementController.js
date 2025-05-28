const canvasService = require('../services/canvasService');
const firebaseService = require('../services/firebaseService');

/**
 * Announcement controller for handling announcement-related routes
 */
const announcementController = {
  /**
   * Get announcements for all available courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAnnouncements: async (req, res) => {
    try {
      // First get all active courses to build context codes
      const courses = await canvasService.getCourses({ includeTerms: false, includeTeachers: false });

      // Get announcements using the service
      const announcements = await canvasService.getAnnouncements(courses, {
        latestOnly: false,
        startDate: '2023-01-01'
      });

      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error.message);
      res.status(500).json({ error: 'Failed to fetch announcements', details: error.message });
    }
  },

  /**
   * Get announcements for a specific course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCourseAnnouncements: async (req, res) => {
    try {
      const { courseId } = req.params;
      const { uid } = req.user;

      console.log(`=== FETCHING ANNOUNCEMENTS FOR COURSE ${courseId} ===`);
      console.log('User ID:', uid);

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
        console.log('Canvas credentials found for user');
        console.log('Canvas URL:', credentials.canvasUrl);
        console.log('Canvas API Key exists:', !!credentials.canvasApiKey);
      } catch (credError) {
        console.error('Canvas credentials error:', credError.message);
        return res.status(400).json({
          error: 'Canvas credentials not found. Please set up your Canvas credentials.',
          details: credError.message
        });
      }

      // Get all courses first
      const allCourses = await canvasService.getCourses({
        includeTerms: false,
        includeTeachers: false,
        ...credentials
      });
      console.log(`Found ${allCourses.length} courses for user`);

      // Get all announcements using the working approach (minimal parameters)
      const allAnnouncements = await canvasService.getAnnouncements(allCourses, {
        ...credentials
      });
      console.log(`Found ${allAnnouncements.length} total announcements across all courses`);

      // Filter for this specific course
      const announcements = allAnnouncements.filter(
        a => a.course_id === parseInt(courseId) || a.context_code === `course_${courseId}`
      );
      console.log(`Found ${announcements.length} announcements for course ${courseId}`);

      // Log each announcement for debugging
      announcements.forEach((announcement, index) => {
        console.log(`Announcement ${index + 1}:`, {
          id: announcement.id,
          title: announcement.title,
          context_code: announcement.context_code,
          posted_at: announcement.posted_at,
          message_preview: announcement.message?.substring(0, 100) + '...'
        });
      });

      res.json({
        courseId: parseInt(courseId),
        announcements: announcements,
        count: announcements.length
      });
    } catch (error) {
      console.error(`Error fetching announcements for course ${req.params.courseId}:`, error.message);
      console.error('Full error:', error);
      res.status(500).json({
        error: 'Failed to fetch course announcements',
        details: error.message,
        courseId: req.params.courseId
      });
    }
  },


};

module.exports = announcementController;
