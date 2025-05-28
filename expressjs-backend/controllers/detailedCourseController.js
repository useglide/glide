const canvasService = require('../services/canvasService');
const firebaseService = require('../services/firebaseService');
const formatTime = require('../utils/formatTime');

/**
 * Controller for detailed course data
 */
const detailedCourseController = {
  /**
   * Get detailed data for all courses
   * This endpoint should be called after the two-stage load is cached
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getDetailedCourseData: async (req, res) => {
    try {
      const startTime = Date.now();
      const { uid } = req.user;

      const timings = {
        courses: { start: 0, end: 0, duration: 0 },
        assignments: { start: 0, end: 0, duration: 0, byCourseDuration: {} },
        announcements: { start: 0, end: 0, duration: 0 },
        processing: { start: 0, end: 0, duration: 0 }
      };

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        return res.json({
          status: 'error',
          courses: [],
          assignments: [],
          timing: {
            totalTimeMs: Date.now() - startTime,
            totalTimeSec: ((Date.now() - startTime) / 1000).toFixed(2),
            formattedTime: formatTime(Date.now() - startTime),
            sections: timings
          },
          error: 'Canvas credentials not found. Please set up your Canvas credentials.'
        });
      }

      // Get all courses (current and past) from Canvas
      timings.courses.start = Date.now();
      const courses = await canvasService.getAllCourses({
        includeTerms: true,
        includeTeachers: true,
        includeTotalScores: true,
        uid,
        ...credentials
      });
      timings.courses.end = Date.now();
      timings.courses.duration = timings.courses.end - timings.courses.start;

      // If no courses found, return empty result
      if (!courses || courses.length === 0) {
        const endTime = Date.now();
        return res.json({
          status: 'complete',
          courses: [],
          assignments: [],
          timing: {
            totalTimeMs: endTime - startTime,
            totalTimeSec: ((endTime - startTime) / 1000).toFixed(2),
            formattedTime: formatTime(endTime - startTime),
            sections: timings
          },
          message: 'No courses found'
        });
      }

      // Process course data to include grade information
      const processedCourses = courses.map(course => {
        // Find enrollment with current grade
        const enrollment = course.enrollments && course.enrollments.find(
          e => e.type === 'student' && (e.computed_current_score || e.computed_final_score)
        );

        // Extract grade information
        const hasGrade = enrollment && (
          enrollment.computed_current_score !== undefined ||
          enrollment.computed_final_score !== undefined
        );

        const grade = hasGrade ?
          (enrollment.computed_current_score !== undefined ?
            enrollment.computed_current_score :
            enrollment.computed_final_score) : null;

        const gradeLetter = hasGrade ?
          (enrollment.computed_current_grade !== undefined ?
            enrollment.computed_current_grade :
            enrollment.computed_final_grade) : null;

        return {
          id: course.id,
          name: course.name,
          course_code: course.course_code,
          term: course.term ? course.term.name : null,
          grade: grade,
          grade_letter: gradeLetter,
          teachers: course.teachers || []
        };
      });

      // Set up date range for assignments (past 30 days to future 60 days)
      const now = new Date();
      const pastCutoff = new Date(now);
      pastCutoff.setDate(now.getDate() - 30);
      const futureCutoff = new Date(now);
      futureCutoff.setDate(now.getDate() + 60);

      const pastCutoffStr = pastCutoff.toISOString();
      const futureCutoffStr = futureCutoff.toISOString();

      // Start fetching assignments for all courses
      timings.assignments.start = Date.now();

      // Process each course to get assignments
      const courseDataPromises = courses.map(async (course) => {
        try {
          const courseStartTime = Date.now();
          const courseId = course.id;

          // Get assignments for this course with optimized parameters
          const assignments = await canvasService.getCourseAssignments(courseId, {
            includeSubmission: true,
            dueAfter: pastCutoffStr,
            dueBefore: futureCutoffStr,
            orderBy: 'due_at',
            perPage: 100,
            ...credentials
          });

          // Add course information to each assignment
          const assignmentsWithCourseInfo = assignments.map(assignment => ({
            ...assignment,
            course_name: course.name,
            course_code: course.course_code,
            course_id: course.id
          }));

          const courseEndTime = Date.now();
          timings.assignments.byCourseDuration[course.id] = {
            courseName: course.name,
            duration: courseEndTime - courseStartTime,
            assignmentCount: assignments.length
          };

          return {
            courseId: course.id,
            courseName: course.name,
            assignments: assignmentsWithCourseInfo
          };
        } catch (error) {
          return {
            courseId: course.id,
            courseName: course.name,
            assignments: [],
            error: error.message
          };
        }
      });

      // Wait for all course data to be fetched
      const courseData = await Promise.all(courseDataPromises);
      timings.assignments.end = Date.now();
      timings.assignments.duration = timings.assignments.end - timings.assignments.start;

      // Fetch announcements for all courses using the same approach as individual course pages
      timings.announcements.start = Date.now();
      let announcements = [];
      try {
        console.log(`Fetching announcements for ${courses.length} courses using individual course endpoints`);

        // Fetch announcements for each course individually using the working approach
        const announcementPromises = courses.map(async (course) => {
          try {
            const courseAnnouncements = await canvasService.getCourseAnnouncements(course.id, {
              ...credentials
            });
            return courseAnnouncements;
          } catch (error) {
            console.error(`Error fetching announcements for course ${course.id}:`, error.message);
            return []; // Return empty array for this course if there's an error
          }
        });

        // Wait for all announcement fetches to complete
        const allCourseAnnouncements = await Promise.all(announcementPromises);

        // Flatten the array of arrays into a single array
        announcements = allCourseAnnouncements.flat();

        // Sort announcements by posted date (newest first)
        announcements.sort((a, b) => {
          return new Date(b.posted_at) - new Date(a.posted_at);
        });

        console.log(`Found ${announcements.length} announcements across all courses`);

        // Log a sample of announcements for debugging
        if (announcements.length > 0) {
          console.log('Sample announcements:', announcements.slice(0, 2).map(a => ({
            id: a.id,
            title: a.title,
            context_name: a.context_name,
            posted_at: a.posted_at
          })));
        }
      } catch (announcementError) {
        console.error('Error fetching announcements:', announcementError.message);
        // Continue with empty announcements array if there's an error
      }
      timings.announcements.end = Date.now();
      timings.announcements.duration = timings.announcements.end - timings.announcements.start;

      // Process the results
      timings.processing.start = Date.now();

      // Organize assignments by course
      const courseAssignmentData = {};
      let allAssignments = [];

      courseData.forEach(data => {
        courseAssignmentData[data.courseId] = data.assignments;
        allAssignments = allAssignments.concat(data.assignments);
      });

      // Sort assignments by due date
      allAssignments.sort((a, b) => {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at) - new Date(b.due_at);
      });

      timings.processing.end = Date.now();
      timings.processing.duration = timings.processing.end - timings.processing.start;

      // Calculate timing information
      const endTime = Date.now();
      const totalTimeMs = endTime - startTime;

      // Return the formatted response
      res.json({
        status: 'complete',
        courses: processedCourses,
        courseAssignments: courseAssignmentData,
        assignments: allAssignments,
        announcements: announcements,
        timing: {
          totalTimeMs,
          totalTimeSec: (totalTimeMs / 1000).toFixed(2),
          formattedTime: formatTime(totalTimeMs),
          sections: timings
        }
      });
    } catch (error) {
      // Return a more user-friendly error message with 200 status
      res.json({
        status: 'error',
        courses: [],
        assignments: [],
        announcements: [],
        timing: {
          totalTimeMs: 0,
          totalTimeSec: "0.00",
          formattedTime: "0s",
          sections: {}
        },
        error: error.message || 'Failed to fetch detailed course data'
      });
    }
  }
};

module.exports = detailedCourseController;
