const canvasService = require('../services/canvasService');
const firebaseService = require('../services/firebaseService');
const formatTime = require('../utils/formatTime');
const { db } = require('../config/firebase');

/**
 * Controller for data synchronization operations
 */
const syncController = {
  /**
   * Synchronize Firestore data with the latest information from Canvas
   * This endpoint leverages existing combined data endpoints to ensure
   * Firestore data is up-to-date with the latest information
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  syncFirestoreData: async (req, res) => {
    try {
      const startTime = Date.now();
      const { uid } = req.user;

      // Object to track synchronization results
      const syncResults = {
        courses: {
          total: 0,
          updated: 0,
          unchanged: 0,
          failed: 0,
          details: []
        },
        assignments: {
          total: 0,
          updated: 0,
          unchanged: 0,
          failed: 0,
          details: []
        },
        grades: {
          total: 0,
          updated: 0,
          unchanged: 0,
          failed: 0
        },
        timing: {
          startTime: new Date().toISOString(),
          endTime: null,
          totalTimeMs: null,
          totalTimeSec: null,
          formattedTime: null
        }
      };

      // Get user's Canvas credentials
      let credentials;
      try {
        credentials = await firebaseService.getCanvasCredentials(uid);
      } catch (credError) {
        return res.status(400).json({
          status: 'error',
          message: 'Canvas credentials not found. Please set up your Canvas credentials.',
          timestamp: new Date().toISOString()
        });
      }

      // Get all courses from Canvas
      console.log('Fetching courses from Canvas...');
      const canvasCourses = await canvasService.getCourses({
        includeTerms: true,
        includeTeachers: true,
        includeTotalScores: true,
        ...credentials
      });

      if (!canvasCourses || canvasCourses.length === 0) {
        return res.json({
          status: 'success',
          message: 'No courses found in Canvas to synchronize',
          syncResults
        });
      }

      syncResults.courses.total = canvasCourses.length;
      console.log(`Found ${canvasCourses.length} courses in Canvas`);

      // Get user's courses from Firestore
      const userCoursesRef = db.collection('users').doc(uid).collection('courses');
      const firestoreCoursesSnapshot = await userCoursesRef.get();

      // Create a map of Firestore courses by ID for easy lookup
      const firestoreCourses = {};
      firestoreCoursesSnapshot.forEach(doc => {
        firestoreCourses[doc.id] = doc.data();
      });

      // Process each Canvas course and update Firestore if needed
      const batch = db.batch();
      let updatedCount = 0;
      let unchangedCount = 0;
      let failedCount = 0;

      for (const canvasCourse of canvasCourses) {
        try {
          const courseId = canvasCourse.id.toString();
          const courseRef = userCoursesRef.doc(courseId);

          // Determine if course is current based on end_at date
          const now = new Date();
          const endDate = canvasCourse.end_at ? new Date(canvasCourse.end_at) : null;
          const isCurrent = endDate ? endDate > now : true;

          // Process course data
          const processedCourse = {
            id: canvasCourse.id,
            name: canvasCourse.name,
            course_code: canvasCourse.course_code,
            term: canvasCourse.term ? canvasCourse.term.name : null,
            start_at: canvasCourse.start_at,
            end_at: canvasCourse.end_at,
            status: isCurrent ? 'current' : 'past',
            updatedAt: new Date()
          };

          // Check if course exists in Firestore and if it needs updating
          const firestoreCourse = firestoreCourses[courseId];
          let needsUpdate = false;

          if (!firestoreCourse) {
            // Course doesn't exist in Firestore, add it
            needsUpdate = true;
          } else {
            // Compare relevant fields to see if update is needed
            const fieldsToCompare = ['name', 'course_code', 'term', 'start_at', 'end_at', 'status'];
            for (const field of fieldsToCompare) {
              if (processedCourse[field] !== firestoreCourse[field]) {
                needsUpdate = true;
                break;
              }
            }
          }

          if (needsUpdate) {
            batch.set(courseRef, processedCourse);
            updatedCount++;
            syncResults.courses.details.push({
              id: canvasCourse.id,
              name: canvasCourse.name,
              status: 'updated',
              reason: firestoreCourse ? 'Data changed' : 'New course'
            });
          } else {
            unchangedCount++;
            syncResults.courses.details.push({
              id: canvasCourse.id,
              name: canvasCourse.name,
              status: 'unchanged',
              reason: 'No changes detected'
            });
          }
        } catch (courseError) {
          console.error(`Error processing course ${canvasCourse.id}:`, courseError);
          failedCount++;
          syncResults.courses.details.push({
            id: canvasCourse.id,
            name: canvasCourse.name || 'Unknown',
            status: 'failed',
            reason: courseError.message
          });
        }
      }

      // Commit batch if there are updates
      if (updatedCount > 0) {
        await batch.commit();
      }

      // Update sync results
      syncResults.courses.updated = updatedCount;
      syncResults.courses.unchanged = unchangedCount;
      syncResults.courses.failed = failedCount;

      // Step 2: Synchronize assignments for each course
      console.log('Synchronizing assignments...');
      let totalAssignments = 0;
      let updatedAssignments = 0;
      let unchangedAssignments = 0;
      let failedAssignments = 0;

      // Process each course to get and update assignments
      for (const course of canvasCourses) {
        try {
          const courseId = course.id;
          console.log(`Fetching assignments for course ${courseId} (${course.name})...`);

          // Get assignments for this course from Canvas
          const assignments = await canvasService.getCourseAssignments(courseId, {
            includeSubmission: true,
            ...credentials
          });

          if (!assignments || assignments.length === 0) {
            console.log(`No assignments found for course ${courseId}`);
            continue;
          }

          totalAssignments += assignments.length;

          // Get assignments from Firestore for this course
          const assignmentsRef = db.collection('users').doc(uid)
            .collection('courses').doc(courseId.toString())
            .collection('assignments');

          const firestoreAssignmentsSnapshot = await assignmentsRef.get();

          // Create a map of Firestore assignments by ID for easy lookup
          const firestoreAssignments = {};
          firestoreAssignmentsSnapshot.forEach(doc => {
            firestoreAssignments[doc.id] = doc.data();
          });

          // Create batch for assignment updates
          const assignmentBatch = db.batch();
          let courseUpdatedAssignments = 0;
          let courseUnchangedAssignments = 0;

          // Process each assignment
          for (const assignment of assignments) {
            try {
              const assignmentId = assignment.id.toString();
              const assignmentRef = assignmentsRef.doc(assignmentId);

              // Process assignment data
              const processedAssignment = {
                id: assignment.id,
                name: assignment.name,
                description: assignment.description,
                due_at: assignment.due_at,
                points_possible: assignment.points_possible,
                html_url: assignment.html_url,
                submission_types: assignment.submission_types,
                has_submitted_submissions: assignment.has_submitted_submissions,
                course_id: courseId,
                updatedAt: new Date()
              };

              // Check if assignment exists in Firestore and if it needs updating
              const firestoreAssignment = firestoreAssignments[assignmentId];
              let needsUpdate = false;

              if (!firestoreAssignment) {
                // Assignment doesn't exist in Firestore, add it
                needsUpdate = true;
              } else {
                // Compare relevant fields to see if update is needed
                const fieldsToCompare = ['name', 'description', 'due_at', 'points_possible', 'has_submitted_submissions'];
                for (const field of fieldsToCompare) {
                  if (JSON.stringify(processedAssignment[field]) !== JSON.stringify(firestoreAssignment[field])) {
                    needsUpdate = true;
                    break;
                  }
                }
              }

              if (needsUpdate) {
                assignmentBatch.set(assignmentRef, processedAssignment);
                courseUpdatedAssignments++;
                syncResults.assignments.details.push({
                  id: assignment.id,
                  name: assignment.name,
                  course_id: courseId,
                  course_name: course.name,
                  status: 'updated',
                  reason: firestoreAssignment ? 'Data changed' : 'New assignment'
                });
              } else {
                courseUnchangedAssignments++;
              }
            } catch (assignmentError) {
              console.error(`Error processing assignment ${assignment.id}:`, assignmentError);
              failedAssignments++;
              syncResults.assignments.details.push({
                id: assignment.id,
                name: assignment.name || 'Unknown',
                course_id: courseId,
                course_name: course.name,
                status: 'failed',
                reason: assignmentError.message
              });
            }
          }

          // Commit batch if there are updates
          if (courseUpdatedAssignments > 0) {
            await assignmentBatch.commit();
          }

          updatedAssignments += courseUpdatedAssignments;
          unchangedAssignments += courseUnchangedAssignments;

          console.log(`Course ${courseId}: Updated ${courseUpdatedAssignments} assignments, unchanged ${courseUnchangedAssignments}`);
        } catch (courseError) {
          console.error(`Error processing assignments for course ${course.id}:`, courseError);
        }
      }

      // Update assignment sync results
      syncResults.assignments.total = totalAssignments;
      syncResults.assignments.updated = updatedAssignments;
      syncResults.assignments.unchanged = unchangedAssignments;
      syncResults.assignments.failed = failedAssignments;

      // Calculate timing information
      const endTime = Date.now();
      const totalTimeMs = endTime - startTime;

      syncResults.timing.endTime = new Date().toISOString();
      syncResults.timing.totalTimeMs = totalTimeMs;
      syncResults.timing.totalTimeSec = (totalTimeMs / 1000).toFixed(2);
      syncResults.timing.formattedTime = formatTime(totalTimeMs);

      // Return the synchronization results
      res.json({
        status: 'success',
        message: `Synchronized ${updatedCount} of ${canvasCourses.length} courses and ${updatedAssignments} of ${totalAssignments} assignments`,
        syncResults
      });
    } catch (error) {
      console.error('Error synchronizing Firestore data:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to synchronize Firestore data',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = syncController;
