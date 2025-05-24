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
        displayName: doc.data().displayName || null,
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

      // Remove from removed_courses if it exists (user is re-adding)
      const removedRef = db.collection('users').doc(uid).collection('removed_courses').doc(courseId.toString());
      await removedRef.delete();

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
      console.log(`Successfully deleted from favorites collection`);

      // Track this as an explicitly removed course to prevent auto-re-adding
      const removedRef = db.collection('users').doc(uid).collection('removed_courses').doc(courseId.toString());
      console.log(`Attempting to write to removed_courses collection: users/${uid}/removed_courses/${courseId}`);
      
      try {
        await removedRef.set({
          removedAt: new Date()
        });
        console.log(`Successfully added course ${courseId} to removed_courses collection`);
        
        // Verify it was written by reading it back
        const verifyDoc = await removedRef.get();
        if (verifyDoc.exists) {
          console.log(`Verification: Course ${courseId} exists in removed_courses:`, verifyDoc.data());
        } else {
          console.error(`Verification failed: Course ${courseId} was not found in removed_courses after writing`);
        }
      } catch (writeError) {
        console.error(`Error writing to removed_courses collection:`, writeError);
        throw writeError;
      }

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
  },

  /**
   * Update a favorite course's display name
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateFavoriteCourseDisplayName: async (req, res) => {
    try {
      const { uid } = req.user;
      const { courseId } = req.params;
      const { displayName } = req.body;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      if (!displayName) {
        return res.status(400).json({ error: 'Display name is required' });
      }

      console.log(`Updating display name for course ${courseId} to ${displayName} for user ${uid}`);

      // Update display name in Firestore
      const favoriteRef = db.collection('users').doc(uid).collection('favorites').doc(courseId.toString());

      await favoriteRef.update({
        displayName,
        updatedAt: new Date()
      });

      // Return in the format expected by the frontend
      return res.json({
        success: true,
        id: parseInt(courseId, 10),
        displayName
      });
    } catch (error) {
      console.error('Error updating favorite course display name:', error);
      res.status(500).json({ error: 'Failed to update favorite course display name', details: error.message });
    }
  },

  /**
   * Get user's explicitly removed courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRemovedCourses: async (req, res) => {
    console.log('🔍 getRemovedCourses endpoint called');
    try {
      const { uid } = req.user;

      console.log(`Getting removed courses for user ${uid}`);

      // Get removed courses from Firestore
      const removedSnapshot = await db.collection('users').doc(uid).collection('removed_courses').get();

      console.log(`Found ${removedSnapshot.size} removed courses documents`);

      if (removedSnapshot.empty) {
        console.log('No removed courses found, returning empty array');
        return res.json([]);
      }

      // Convert to array of removed course IDs
      const removedCourseIds = removedSnapshot.docs.map(doc => {
        console.log(`Removed course document: ${doc.id}, data:`, doc.data());
        return parseInt(doc.id, 10);
      });

      console.log('Returning removed courses:', removedCourseIds);
      return res.json(removedCourseIds);
    } catch (error) {
      console.error('Error getting removed courses:', error);
      res.status(500).json({ error: 'Failed to get removed courses', details: error.message });
    }
  },

  /**
   * Clear user's explicitly removed courses list
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  clearRemovedCourses: async (req, res) => {
    try {
      const { uid } = req.user;

      console.log(`Clearing removed courses list for user ${uid}`);

      // Get all removed courses documents
      const removedSnapshot = await db.collection('users').doc(uid).collection('removed_courses').get();

      // Delete all documents in the removed_courses collection
      const batch = db.batch();
      removedSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return res.json({
        success: true,
        message: 'Removed courses list cleared successfully',
        cleared: removedSnapshot.docs.length
      });
    } catch (error) {
      console.error('Error clearing removed courses:', error);
      res.status(500).json({ error: 'Failed to clear removed courses', details: error.message });
    }
  }
};

module.exports = favoriteCoursesController;
