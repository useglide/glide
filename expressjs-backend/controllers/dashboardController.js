const canvasService = require('../services/canvasService');
const firebaseService = require('../services/firebaseService');
const formatTime = require('../utils/formatTime');

/**
 * Dashboard controller for handling dashboard-related routes
 */
const dashboardController = {
  /**
   * Get combined course data, grades, and assignments in a single request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCombinedCourseData: async (req, res) => {
    try {
      const startTime = Date.now();
      const timings = {
        credentials: { start: 0, end: 0, duration: 0 },
        courses: { start: 0, end: 0, duration: 0 },
        assignments: { start: 0, end: 0, duration: 0, byCourseDuration: {} },
        processing: { start: 0, end: 0, duration: 0 }
      };

      // Create object to store all combined data
      const combinedData = {
        courses: [],
        count: 0,
        timing: {}
      };

      // Get user ID from authenticated request
      const { uid } = req.user;

      // Get user's Canvas credentials from Firestore
      timings.credentials.start = Date.now();
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        console.error('Error getting Canvas credentials:', credError.message);
        return res.status(401).json({
          error: 'Canvas credentials not found. Please set up your Canvas credentials.',
          timestamp: new Date().toISOString()
        });
      }
      timings.credentials.end = Date.now();
      timings.credentials.duration = timings.credentials.end - timings.credentials.start;

      // Get all active courses with all necessary parameters in a single request
      // This avoids multiple API calls for the same courses
      timings.courses.start = Date.now();
      const courses = await canvasService.getCourses({
        includeTerms: true,
        includeTeachers: true,
        includeTotalScores: true,
        ...credentials // Pass user-specific credentials
      });
      timings.courses.end = Date.now();
      timings.courses.duration = timings.courses.end - timings.courses.start;

      // Get current date and calculate date range for filtering assignments
      const now = new Date();
      const pastCutoff = new Date(now);
      pastCutoff.setDate(pastCutoff.getDate() - 7);
      const futureCutoff = new Date(now);
      futureCutoff.setDate(futureCutoff.getDate() + 30); // Get assignments due in next 30 days

      // Format dates for Canvas API
      const pastCutoffStr = pastCutoff.toISOString();
      const futureCutoffStr = futureCutoff.toISOString();

      // Process each course to get assignments and grades
      timings.assignments.start = Date.now();

      // Use Promise.all to fetch assignments for all courses in parallel
      const courseDataPromises = courses.map(async (course) => {
        try {
          const courseStartTime = Date.now();
          const courseId = course.id;

          // Extract grade information from the course
          const enrollment = course.enrollments ?
            course.enrollments.find(e => e.type === 'student') : null;

          // Get the current score if available
          const hasGrade = enrollment &&
                          (enrollment.computed_current_score !== undefined ||
                           enrollment.computed_final_score !== undefined);

          // Use current score if available, otherwise use final score
          const grade = hasGrade ?
            (enrollment.computed_current_score !== undefined ?
              enrollment.computed_current_score :
              enrollment.computed_final_score) : null;

          const gradeLetter = hasGrade ?
            (enrollment.computed_current_grade !== undefined ?
              enrollment.computed_current_grade :
              enrollment.computed_final_grade) : null;

          // Get assignments for this course with optimized parameters
          const assignments = await canvasService.getCourseAssignments(courseId, {
            includeSubmission: true,
            dueAfter: pastCutoffStr,
            dueBefore: futureCutoffStr,
            orderBy: 'due_at',
            perPage: 50,
            ...credentials // Pass user-specific credentials
          });

          // Add course information to each assignment
          const assignmentsWithCourseInfo = assignments.map(assignment => ({
            ...assignment,
            course_name: course.name,
            course_code: course.course_code,
            course_id: course.id
          }));

          // Sort assignments by due date (ascending)
          assignmentsWithCourseInfo.sort((a, b) => {
            if (!a.due_at) return 1;
            if (!b.due_at) return -1;
            return new Date(a.due_at) - new Date(b.due_at);
          });

          const courseEndTime = Date.now();
          timings.assignments.byCourseDuration[course.id] = {
            courseName: course.name,
            duration: courseEndTime - courseStartTime,
            assignmentCount: assignments.length
          };

          // Return combined course data
          return {
            id: course.id,
            name: course.name,
            course_code: course.course_code,
            term: course.term ? course.term.name : null,
            teachers: course.teachers || [],
            grade: {
              score: grade,
              letter: gradeLetter,
              has_grade: hasGrade
            },
            assignments: assignmentsWithCourseInfo
          };
        } catch (error) {
          console.error(`Error processing data for course ${course.id}:`, error.message);
          timings.assignments.byCourseDuration[course.id] = {
            courseName: course.name,
            error: error.message
          };

          // Return basic course info even if there was an error
          return {
            id: course.id,
            name: course.name,
            course_code: course.course_code,
            term: course.term ? course.term.name : null,
            teachers: course.teachers || [],
            grade: { score: null, letter: null, has_grade: false },
            assignments: [],
            error: error.message
          };
        }
      });

      // Wait for all promises to resolve
      combinedData.courses = await Promise.all(courseDataPromises);
      timings.assignments.end = Date.now();
      timings.assignments.duration = timings.assignments.end - timings.assignments.start;

      // Process and finalize the results
      timings.processing.start = Date.now();

      // Sort courses by name
      combinedData.courses.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

      // Count total assignments across all courses
      const totalAssignments = combinedData.courses.reduce(
        (total, course) => total + course.assignments.length, 0
      );

      timings.processing.end = Date.now();
      timings.processing.duration = timings.processing.end - timings.processing.start;

      // Calculate timing information
      const endTime = Date.now();
      const totalTimeMs = endTime - startTime;

      // Add counts and timing information
      combinedData.count = {
        courses: combinedData.courses.length,
        assignments: totalAssignments
      };

      combinedData.timing = {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        totalTimeMs: totalTimeMs,
        totalTimeSec: (totalTimeMs / 1000).toFixed(2),
        totalTimeFormatted: formatTime(totalTimeMs),
        breakdown: {
          fetchCredentials: {
            durationMs: timings.credentials.duration,
            durationSec: (timings.credentials.duration / 1000).toFixed(2),
            percentage: ((timings.credentials.duration / totalTimeMs) * 100).toFixed(1) + '%'
          },
          fetchCourses: {
            durationMs: timings.courses.duration,
            durationSec: (timings.courses.duration / 1000).toFixed(2),
            percentage: ((timings.courses.duration / totalTimeMs) * 100).toFixed(1) + '%'
          },
          fetchAssignments: {
            durationMs: timings.assignments.duration,
            durationSec: (timings.assignments.duration / 1000).toFixed(2),
            percentage: ((timings.assignments.duration / totalTimeMs) * 100).toFixed(1) + '%',
            byCourseDuration: timings.assignments.byCourseDuration
          },
          processing: {
            durationMs: timings.processing.duration,
            durationSec: (timings.processing.duration / 1000).toFixed(2),
            percentage: ((timings.processing.duration / totalTimeMs) * 100).toFixed(1) + '%'
          }
        }
      };

      // Return the combined data
      res.json(combinedData);
    } catch (error) {
      console.error('Error fetching combined course data:', error.message);
      res.status(500).json({
        error: 'Failed to fetch combined course data',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },


  /**
   * Get all data for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllData: async (req, res) => {
    try {
      // Start the timer
      const startTime = Date.now();

      // Create an object to store all the data
      const allData = {
        user: null,
        courses: [],
        announcements: [],
        calendarEvents: [],
        conversations: [],
        grades: [],
        todo: [],
        accessibleData: {}, // Track what data was accessible
        errors: [], // Track any errors
        timing: {
          startTime: new Date().toISOString(),
          endTime: null,
          totalTimeMs: null,
          totalTimeSec: null,
          sections: {} // Will store timing for each section
        }
      };

      // Get user ID from authenticated request
      const { uid } = req.user;

      // Get user's Canvas credentials from Firestore
      const credentialsStartTime = Date.now();
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
        allData.timing.sections.credentials = {
          timeMs: Date.now() - credentialsStartTime,
          timeSec: ((Date.now() - credentialsStartTime) / 1000).toFixed(2)
        };
      } catch (credError) {
        console.error('Error getting Canvas credentials:', credError.message);
        allData.errors.push({ endpoint: 'credentials', message: credError.message });
        return res.status(401).json({
          error: 'Canvas credentials not found. Please set up your Canvas credentials.',
          timestamp: new Date().toISOString(),
          errors: allData.errors
        });
      }

      // Fetch user info
      try {
        const userStartTime = Date.now();
        allData.user = await canvasService.getUserInfo(credentials);
        allData.accessibleData.user = true;
        allData.timing.sections.user = {
          timeMs: Date.now() - userStartTime,
          timeSec: ((Date.now() - userStartTime) / 1000).toFixed(2)
        };
      } catch (error) {
        allData.errors.push({ endpoint: 'user', message: error.message });
        allData.accessibleData.user = false;
      }

      // Fetch courses
      let courses = [];
      try {
        const coursesStartTime = Date.now();
        courses = await canvasService.getCourses(credentials);
        allData.accessibleData.courses = true;
        allData.timing.sections.courses = {
          timeMs: Date.now() - coursesStartTime,
          timeSec: ((Date.now() - coursesStartTime) / 1000).toFixed(2)
        };
      } catch (error) {
        allData.errors.push({ endpoint: 'courses', message: error.message });
        allData.accessibleData.courses = false;
      }

      // Fetch assignments, submissions, and other data for each course
      if (courses.length > 0) {
        const courseDetailsStartTime = Date.now();
        const coursesWithDetails = await Promise.all(
          courses.map(async (course) => {
            const courseId = course.id;
            const courseStartTime = Date.now();
            const courseData = {
              ...course,
              accessibleData: {},
              timing: { startTime: Date.now() } // Track timing for each course
            };

            // Fetch assignments
            try {
              const assignments = await canvasService.getCourseAssignments(courseId, credentials);
              courseData.assignments = [];
              courseData.accessibleData.assignments = true;

              // Fetch submissions for each assignment - use silentErrors to continue even with 403s
              if (assignments.length > 0) {
                for (const assignment of assignments) {
                  try {
                    // Use silentErrors option to prevent console spam for expected 403s
                    const submissions = await canvasService.getAssignmentSubmissions(courseId, assignment.id, credentials);

                    courseData.assignments.push({
                      ...assignment,
                      submissions: Array.isArray(submissions) ? submissions : []
                    });
                  } catch (error) {
                    // Just add the assignment without submissions
                    courseData.assignments.push({
                      ...assignment,
                      submissions: [],
                      submissionsError: 'Permission denied'
                    });
                  }
                }
              }
            } catch (error) {
              courseData.assignments = [];
              courseData.accessibleData.assignments = false;
            }

            // Fetch grades
            try {
              courseData.grades = await canvasService.getCourseSubmissions(courseId, credentials);
              courseData.accessibleData.grades = true;
            } catch (error) {
              courseData.grades = [];
              courseData.accessibleData.grades = false;
            }

            // Add timing information for this course
            courseData.timing.endTime = Date.now();
            courseData.timing.totalTimeMs = courseData.timing.endTime - courseStartTime;
            courseData.timing.totalTimeSec = (courseData.timing.totalTimeMs / 1000).toFixed(2);

            return courseData;
          })
        );

        allData.courses = coursesWithDetails;

        // Add timing for all course details
        allData.timing.sections.courseDetails = {
          timeMs: Date.now() - courseDetailsStartTime,
          timeSec: ((Date.now() - courseDetailsStartTime) / 1000).toFixed(2),
          coursesProcessed: coursesWithDetails.length
        };
      }

      // Fetch announcements
      try {
        const announcementsStartTime = Date.now();
        allData.announcements = await canvasService.getAnnouncements(courses, {
          ...credentials
        });
        allData.accessibleData.announcements = true;
        allData.timing.sections.announcements = {
          timeMs: Date.now() - announcementsStartTime,
          timeSec: ((Date.now() - announcementsStartTime) / 1000).toFixed(2)
        };
      } catch (error) {
        allData.errors.push({ endpoint: 'announcements', message: error.message });
        allData.accessibleData.announcements = false;
      }

      // Fetch calendar events
      try {
        const calendarStartTime = Date.now();
        allData.calendarEvents = await canvasService.getCalendarEvents(credentials);
        allData.accessibleData.calendarEvents = true;
        allData.timing.sections.calendarEvents = {
          timeMs: Date.now() - calendarStartTime,
          timeSec: ((Date.now() - calendarStartTime) / 1000).toFixed(2)
        };
      } catch (error) {
        allData.errors.push({ endpoint: 'calendarEvents', message: error.message });
        allData.accessibleData.calendarEvents = false;
      }

      // Fetch todo items
      try {
        const todoStartTime = Date.now();
        allData.todo = await canvasService.getTodoItems(credentials);
        allData.accessibleData.todo = true;
        allData.timing.sections.todo = {
          timeMs: Date.now() - todoStartTime,
          timeSec: ((Date.now() - todoStartTime) / 1000).toFixed(2)
        };
      } catch (error) {
        allData.errors.push({ endpoint: 'todo', message: error.message });
        allData.accessibleData.todo = false;
      }

      // Calculate total time and add timestamps
      const endTime = Date.now();
      allData.timing.endTime = new Date().toISOString();
      allData.timing.totalTimeMs = endTime - startTime;
      allData.timing.totalTimeSec = (allData.timing.totalTimeMs / 1000).toFixed(2);
      allData.timing.totalTimeFormatted = formatTime(allData.timing.totalTimeMs);
      allData.timestamp = new Date().toISOString();

      res.json(allData);
    } catch (error) {
      console.error('Error fetching all data:', error.message);

      // Calculate time even for errors
      const endTime = Date.now();
      const totalTimeMs = endTime - startTime;

      res.status(500).json({
        error: 'Failed to fetch all data',
        details: error.message,
        timestamp: new Date().toISOString(),
        timing: {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          totalTimeMs: totalTimeMs,
          totalTimeSec: (totalTimeMs / 1000).toFixed(2),
          totalTimeFormatted: formatTime(totalTimeMs)
        }
      });
    }
  }
};

module.exports = dashboardController;
