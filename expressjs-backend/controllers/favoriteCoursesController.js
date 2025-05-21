const { db } = require('../config/firebase');

/**
 * Controller for favorite courses
 */
const favoriteCoursesController = {
  /**
   * Get user's favorite courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getFavoriteCourses: async (req, res) => {
    try {
      const { uid } = req.user;

      // Get favorite courses from Firestore
      const favoritesSnapshot = await db.collection('users').doc(uid).collection('favorites').get();

      if (favoritesSnapshot.empty) {
        return res.json([]);
      }

      // Convert to array of favorite courses with the expected format
      // Frontend expects objects with 'id' property, not 'courseId'
      const favorites = favoritesSnapshot.docs.map(doc => ({
        id: parseInt(doc.id, 10),
        color: doc.data().color || null,
        ...doc.data()
      }));

      console.log('Returning favorite courses:', favorites);
      return res.json(favorites);
    } catch (error) {
      console.error('Error getting favorite courses:', error);
      res.status(500).json({ error: 'Failed to get favorite courses', details: error.message });
    }
  },

  /**
   * Add a course to favorites
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addFavoriteCourse: async (req, res) => {
    try {
      const { uid } = req.user;
      const { courseId, color } = req.body;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      console.log(`Adding course ${courseId} to favorites for user ${uid}`);

      // Add to favorites in Firestore
      const favoriteRef = db.collection('users').doc(uid).collection('favorites').doc(courseId.toString());

      await favoriteRef.set({
        color: color || null,
        addedAt: new Date()
      });

      // Return in the format expected by the frontend
      return res.json({
        success: true,
        id: parseInt(courseId, 10),
        color: color || null
      });
    } catch (error) {
      console.error('Error adding course to favorites:', error);
      res.status(500).json({ error: 'Failed to add course to favorites', details: error.message });
    }
  },

  /**
   * Remove a course from favorites
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeFavoriteCourse: async (req, res) => {
    try {
      const { uid } = req.user;
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      console.log(`Removing course ${courseId} from favorites for user ${uid}`);

      // Remove from favorites in Firestore
      const favoriteRef = db.collection('users').doc(uid).collection('favorites').doc(courseId.toString());

      await favoriteRef.delete();

      // Return in the format expected by the frontend
      return res.json({
        success: true,
        id: parseInt(courseId, 10)
      });
    } catch (error) {
      console.error('Error removing course from favorites:', error);
      res.status(500).json({ error: 'Failed to remove course from favorites', details: error.message });
    }
  },

  /**
   * Update a favorite course's color
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateFavoriteCourseColor: async (req, res) => {
    try {
      const { uid } = req.user;
      const { courseId } = req.params;
      const { color } = req.body;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      if (!color) {
        return res.status(400).json({ error: 'Color is required' });
      }

      console.log(`Updating color for course ${courseId} to ${color} for user ${uid}`);

      // Update color in Firestore
      const favoriteRef = db.collection('users').doc(uid).collection('favorites').doc(courseId.toString());

      await favoriteRef.update({
        color,
        updatedAt: new Date()
      });

      // Return in the format expected by the frontend
      return res.json({
        success: true,
        id: parseInt(courseId, 10),
        color
      });
    } catch (error) {
      console.error('Error updating favorite course color:', error);
      res.status(500).json({ error: 'Failed to update favorite course color', details: error.message });
    }
  }
};

module.exports = favoriteCoursesController;
