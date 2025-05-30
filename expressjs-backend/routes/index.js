const express = require('express');
const userRoutes = require('./userRoutes');
const courseRoutes = require('./courseRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const announcementRoutes = require('./announcementRoutes');
const gradeRoutes = require('./gradeRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const springCoursesRoutes = require('./springCoursesRoutes');
const assignmentGradesRoutes = require('./assignmentGradesRoutes');
const twoStageRoutes = require('./twoStageRoutes');
const detailedCourseRoutes = require('./detailedCourseRoutes');
const syncRoutes = require('./syncRoutes');
const favoriteCoursesRoutes = require('./favoriteCoursesRoutes');

const router = express.Router();

// Mount all routes directly (no additional /api prefix)
router.use('/', userRoutes);
router.use('/', courseRoutes);
router.use('/', assignmentRoutes);
router.use('/', announcementRoutes);
router.use('/', gradeRoutes);
router.use('/', dashboardRoutes);
router.use('/', springCoursesRoutes);
router.use('/', assignmentGradesRoutes);
router.use('/', twoStageRoutes);
router.use('/', detailedCourseRoutes);
router.use('/', syncRoutes);
router.use('/', favoriteCoursesRoutes);

module.exports = router;
