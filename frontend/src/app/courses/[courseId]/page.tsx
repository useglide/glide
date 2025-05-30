'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getDetailedCourseData, getAssignmentDetails, getCourseAnnouncements, getFavoriteCourses } from '@/services/api';
import { Header } from '@/components/Header';
import { ChevronLeft, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { darkenColor, isLightColor } from '@/lib/utils';

// Define Auth context interface
interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName?: string;
  } | null;
  logout: () => Promise<void>;
}

// Define interfaces
interface Teacher {
  id: number;
  display_name: string;
  avatar_image_url?: string;
}

interface Assignment {
  id: number;
  name: string;
  due_at: string | null;
  points_possible?: number | null;
  html_url?: string;
  course_id?: number;
  course_name?: string;
  course_code?: string;
  description?: string;
  submission_types?: string[];
  grade_info?: {
    score: number | null;
    grade: string | null;
    submitted_at: string | null;
    late: boolean;
    missing: boolean;
    graded: boolean;
    points_possible: number | null;
    percentage: string | null;
  };
}

interface Announcement {
  id: number;
  title: string;
  message?: string;
  html?: string;
  posted_at?: string;
  delayed_post_at?: string;
  context_code?: string;
  course_id?: number;
  context_name?: string;
}

interface Course {
  id: number;
  name: string;
  course_code: string;
  term?: string;
  teachers?: Teacher[];
  grade?: number | null;
  grade_letter?: string | null;
  displayName?: string;
  customColor?: string;
}

// Define API response interfaces
interface CourseDataResponse {
  courses: Course[];
  courseAssignments: Record<number, Assignment[]>;
  announcements: Announcement[];
}

interface AssignmentResponse {
  assignment: Assignment;
}

interface CourseAnnouncementsResponse {
  courseId: number;
  announcements: Announcement[];
  count: number;
}

interface FavoriteCourse {
  id: number;
  color?: string;
  displayName?: string;
}

// Skeleton Loading Component that matches the actual layout
function CourseDetailsSkeleton() {
  return (
    <>
      {/* Course Header Skeleton - matches the actual colored header */}
      <div className="rounded-lg p-6 mb-6 bg-gray-300 animate-pulse">
        <div className="flex justify-between items-start">
          <div>
            {/* Course title skeleton */}
            <div className="h-9 bg-gray-400 rounded-md w-80 mb-2"></div>
            {/* Course code skeleton */}
            <div className="h-5 bg-gray-400 rounded-md w-32 mb-1"></div>
            {/* Instructor skeleton */}
            <div className="h-4 bg-gray-400 rounded-md w-48"></div>
          </div>
          <div className="flex flex-col items-end">
            {/* Refresh button skeleton */}
            <div className="h-8 bg-gray-400 rounded-md w-20 mb-4"></div>
            {/* Grade skeleton */}
            <div className="text-right">
              <div className="h-10 bg-gray-400 rounded-md w-16 mb-1"></div>
              <div className="h-6 bg-gray-400 rounded-md w-8"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content Skeleton - matches the white-grey container */}
      <div className="bg-[var(--white-grey)] rounded-lg shadow-lg p-6">
        {/* Assignments Section Skeleton */}
        <div className="mb-6">
          {/* Section header with title and show all button */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 bg-gray-300 rounded-md w-32 animate-pulse"></div>
            <div className="h-8 bg-gray-300 rounded-md w-24 animate-pulse"></div>
          </div>

          {/* Assignments Table Skeleton - matches actual table structure */}
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg">
              {/* Table Header - matches actual header */}
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 bg-gray-300 rounded w-12 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 bg-gray-300 rounded w-12 animate-pulse"></div>
                  </th>
                </tr>
              </thead>

              {/* Table Body - matches actual row structure */}
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="px-6 py-5">
                      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements Section Skeleton */}
        <div className="mt-8">
          {/* Section title */}
          <div className="h-8 bg-gray-300 rounded-md w-40 mb-4 animate-pulse"></div>

          {/* Announcements list - matches actual announcement structure */}
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className={`py-4 ${index !== 2 ? 'border-b border-gray-200' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  {/* Announcement title */}
                  <div className="h-6 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
                  {/* Date */}
                  <div className="h-4 bg-gray-200 rounded-md w-20 animate-pulse"></div>
                </div>
                {/* Announcement content */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-4/6 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  // Use the 'use' hook to unwrap the params Promise
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.courseId);

  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [assignmentsExpanded, setAssignmentsExpanded] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [courseData, setCourseData] = useState<{
    loading: boolean;
    gradesLoading: boolean;
    error: string | null;
    course: Course | null;
    assignments: Assignment[];
    announcements: Announcement[];
  }>({
    loading: true,
    gradesLoading: false,
    error: null,
    course: null,
    assignments: [],
    announcements: []
  });

  const { user, logout } = useAuth() as AuthContextType;
  const router = useRouter();

  // Helper function to merge course settings with course data
  const mergeCourseSettings = useCallback(async (course: Course | null) => {
    if (!course) return course;

    try {
      const favorites = await getFavoriteCourses() as FavoriteCourse[];
      const favoriteData = favorites?.find((fav: FavoriteCourse) => fav.id === course.id);

      return {
        ...course,
        customColor: favoriteData?.color || course.customColor,
        displayName: favoriteData?.displayName || course.displayName
      };
    } catch (error) {
      console.error('Error fetching course settings:', error);
      return course;
    }
  }, []);

  // Define handleRefresh with useCallback to avoid dependency issues
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      // Fetch fresh data
      const data = await getDetailedCourseData() as CourseDataResponse;

      // Find the specific course
      let course = data.courses?.find(c => c.id === courseId) || null;

      // Merge course settings (display name, color) from favorites
      course = await mergeCourseSettings(course);

      // Filter assignments for this course
      const courseAssignments = data.courseAssignments?.[courseId] || [];

      // Set initial data (without announcements for now)
      setCourseData({
        loading: false,
        gradesLoading: false,
        error: null,
        course,
        assignments: courseAssignments,
        announcements: [] // Will be populated by dedicated endpoint
      });

      // Fetch announcements using the new dedicated endpoint (refresh)
      try {
        console.log('=== REFRESHING COURSE ANNOUNCEMENTS ===');
        const announcementsData = await getCourseAnnouncements(courseId) as CourseAnnouncementsResponse;
        console.log('Refresh announcements response:', announcementsData);

        // Update announcements with the new data
        setCourseData(prev => ({
          ...prev,
          announcements: announcementsData.announcements || []
        }));
      } catch (announcementError) {
        console.error('Error refreshing course announcements:', announcementError);
        // Set empty announcements on error
        setCourseData(prev => ({
          ...prev,
          announcements: []
        }));
      }

      // Fetch detailed assignment data for each assignment
      if (courseAssignments.length > 0) {
        try {
          // Set grades loading state to true
          setCourseData(prev => ({
            ...prev,
            gradesLoading: true
          }));

          // Create an array of promises for fetching assignment details
          const assignmentPromises = courseAssignments.map(async (assignment) => {
            try {
              const detailedData = await getAssignmentDetails(courseId, assignment.id) as AssignmentResponse;
              return detailedData.assignment;
            } catch (error) {
              console.error(`Error fetching details for assignment ${assignment.id}:`, error);
              return assignment; // Return original assignment if fetch fails
            }
          });

          // Wait for all promises to resolve
          const detailedAssignments = await Promise.all(assignmentPromises);

          // Update the course data with detailed assignments and set gradesLoading to false
          setCourseData(prev => ({
            ...prev,
            assignments: detailedAssignments,
            gradesLoading: false
          }));
        } catch (detailsError) {
          console.error('Error fetching detailed assignment data:', detailsError);
          // Set gradesLoading to false even on error
          setCourseData(prev => ({
            ...prev,
            gradesLoading: false
          }));
        }
      }

      // Show success message
      setError('Course data refreshed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } catch (err: unknown) {
      console.error('Failed to refresh course data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setCourseData(prev => ({
        ...prev,
        error: errorMessage
      }));
      setError('Failed to refresh course data: ' + errorMessage);
    } finally {
      setRefreshing(false);
      setAutoRefreshing(false);
    }
  }, [courseId, mergeCourseSettings]);

  // Fetch course data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchCourseData = async () => {
      try {
        setCourseData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch course data
        const data = await getDetailedCourseData() as CourseDataResponse;

        // Find the specific course
        let course = data.courses?.find(c => c.id === courseId) || null;

        // Merge course settings (display name, color) from favorites
        course = await mergeCourseSettings(course);

        // Filter assignments for this course
        const courseAssignments = data.courseAssignments?.[courseId] || [];

        // Set initial data (without announcements for now)
        setCourseData({
          loading: false,
          gradesLoading: false,
          error: null,
          course,
          assignments: courseAssignments,
          announcements: [] // Will be populated by dedicated endpoint
        });

        // Always trigger a refresh when clicking on a course to get fresh data
        console.log('Auto-refreshing assignments when clicking on course');
        setAutoRefreshing(true);
        setTimeout(() => {
          handleRefresh();
        }, 100); // Small delay to let initial load complete

        // Fetch announcements using the new dedicated endpoint
        try {
          console.log('=== FETCHING COURSE ANNOUNCEMENTS ===');
          console.log('Course ID:', courseId);
          const announcementsData = await getCourseAnnouncements(courseId) as CourseAnnouncementsResponse;
          console.log('Announcements endpoint response:', announcementsData);
          console.log('Found announcements:', announcementsData.announcements);
          console.log('Announcements count:', announcementsData.count);

          // Log each announcement with its properties
          announcementsData.announcements?.forEach((announcement, index) => {
            console.log(`Announcement ${index + 1}:`, {
              id: announcement.id,
              title: announcement.title,
              course_id: announcement.course_id,
              context_code: announcement.context_code,
              context_name: announcement.context_name,
              posted_at: announcement.posted_at,
              message_preview: announcement.message?.substring(0, 100) + '...',
              html_preview: announcement.html?.substring(0, 100) + '...'
            });
          });
          console.log('=== END ANNOUNCEMENTS FETCH ===');

          // Update announcements with the new data
          setCourseData(prev => ({
            ...prev,
            announcements: announcementsData.announcements || []
          }));
        } catch (announcementError) {
          console.error('Error fetching course announcements:', announcementError);
          // Set empty announcements on error
          setCourseData(prev => ({
            ...prev,
            announcements: []
          }));
        }

        // Fetch detailed assignment data for each assignment
        if (courseAssignments.length > 0) {
          try {
            // Set grades loading state to true
            setCourseData(prev => ({
              ...prev,
              gradesLoading: true
            }));

            // Create an array of promises for fetching assignment details
            const assignmentPromises = courseAssignments.map(async (assignment) => {
              try {
                // Fetch assignment details
                const detailedData = await getAssignmentDetails(courseId, assignment.id) as AssignmentResponse;
                return detailedData.assignment;
              } catch (error) {
                console.error(`Error fetching details for assignment ${assignment.id}:`, error);
                return assignment; // Return original assignment if fetch fails
              }
            });

            // Wait for all promises to resolve
            const detailedAssignments = await Promise.all(assignmentPromises);

            // Update the course data with detailed assignments and set gradesLoading to false
            setCourseData(prev => ({
              ...prev,
              assignments: detailedAssignments,
              gradesLoading: false
            }));
          } catch (detailsError) {
            console.error('Error fetching detailed assignment data:', detailsError);
            // Set gradesLoading to false even on error
            setCourseData(prev => ({
              ...prev,
              gradesLoading: false
            }));
          }
        }
      } catch (err: unknown) {
        console.error('Failed to fetch course data:', err);
        setCourseData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch course data'
        }));
      }
    };

    fetchCourseData();
  }, [user, router, courseId, mergeCourseSettings, handleRefresh]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Get course color or use default
  const courseColor = courseData.course?.customColor || '#4169E1'; // Default to Glide blue
  const textColor = isLightColor(courseColor.replace('#', ''))
    ? darkenColor(courseColor, 40)
    : '#FFFFFF';

  return (
    <>
      <Header title={courseData.course?.displayName || courseData.course?.name || 'Course Details'} onLogout={logout} />

      <div className="px-6 py-6">
        {error && (
          <div className={`mb-4 rounded-md p-4 text-sm ${
            error.includes('successfully')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {error.includes('successfully') && (
              <svg className="inline-block mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {error}
          </div>
        )}

        {courseData.error && (
          <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
            Course data error: {courseData.error}
          </div>
        )}

        {/* Back to courses link */}
        <div className="mb-4">
          <Link href="/courses" className="inline-flex items-center text-[var(--glide-blue)] hover:underline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Link>
        </div>

        {courseData.loading || refreshing || autoRefreshing ? (
          <CourseDetailsSkeleton />
        ) : courseData.course ? (
          <>
            {/* Course Header */}
            <div
              className="rounded-lg p-6 mb-6 flex justify-between items-start"
              style={{ backgroundColor: courseColor, color: textColor }}
            >
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {courseData.course.displayName || courseData.course.name}
                </h1>
                <p className="text-lg opacity-90 mb-1">{courseData.course.course_code}</p>
                {courseData.course.teachers && courseData.course.teachers.length > 0 && (
                  <p className="opacity-80">
                    Instructor: {courseData.course.teachers[0].display_name}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing || courseData.loading}
                  className="flex items-center justify-center px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                  aria-label="Refresh data"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  <span className="ml-1.5 text-sm font-medium">Refresh</span>
                </button>
                {courseData.course.grade !== null && courseData.course.grade !== undefined && (
                  <div className="mt-4 text-right">
                    <div className="text-3xl font-bold">{Math.round(courseData.course.grade)}%</div>
                    {courseData.course.grade_letter && (
                      <div className="text-lg">{courseData.course.grade_letter}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Course Content Tabs */}
            <div className="bg-[var(--white-grey)] rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[var(--primary-color)]">Assignments</h2>
                  {courseData.assignments.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setAssignmentsExpanded(!assignmentsExpanded)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-[var(--glide-blue)] hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {assignmentsExpanded ? (
                        <>
                          <span className="mr-1 cursor-pointer">Show Less</span>
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span className="mr-1 cursor-pointer">Show All ({courseData.assignments.length})</span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                {courseData.assignments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-lg">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-sm font-medium text-[var(--primary-color)]">Assignment</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[var(--primary-color)]">Due Date</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[var(--primary-color)]">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[var(--primary-color)]">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(courseData.assignments.length > 5 && !assignmentsExpanded
                          ? courseData.assignments.slice(0, 5)
                          : courseData.assignments
                        ).map(assignment => {
                          // Format due date
                          const dueDate = assignment.due_at
                            ? new Date(assignment.due_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              }) + ", " + new Date(assignment.due_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'No due date';

                          // Determine status
                          let status = 'Not submitted';
                          let statusClass = 'text-amber-500'; // Orange/amber for not submitted

                          if (assignment.grade_info) {
                            if (assignment.grade_info.graded) {
                              status = 'Graded';
                              statusClass = 'text-green-600';
                            } else if (assignment.grade_info.submitted_at) {
                              status = 'Submitted';
                              statusClass = 'text-[var(--glide-blue)]';
                            } else if (assignment.grade_info.missing) {
                              status = 'Missing';
                              statusClass = 'text-red-600';
                            } else if (assignment.grade_info.late) {
                              status = 'Late';
                              statusClass = 'text-orange-600';
                            }
                          }

                          // Format score with rounding for decimals
                          const score = assignment.grade_info?.score !== null && assignment.grade_info?.points_possible
                            ? `${Number.isInteger(assignment.grade_info.score)
                                ? assignment.grade_info.score
                                : Math.round(assignment.grade_info.score)}/${assignment.grade_info.points_possible}`
                            : 'N/A';

                          return (
                            <tr
                              key={assignment.id}
                              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                              onClick={() => router.push(`/courses/${courseId}/assignments/${assignment.id}`)}
                            >
                              <td className="px-6 py-5">
                                <span className="font-medium text-[var(--glide-blue)]">
                                  {assignment.name}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-[var(--secondary-color)]">{dueDate}</td>
                              <td className={`px-6 py-5 font-medium ${statusClass}`}>{status}</td>
                              <td className="px-6 py-5 font-medium text-[var(--primary-color)]">
                                {courseData.gradesLoading ? (
                                  <div className="flex items-center">
                                    <Loader2 className="h-4 w-4 text-[var(--glide-blue)] animate-spin mr-2" />
                                    <span>Loading...</span>
                                  </div>
                                ) : (
                                  score
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[var(--secondary-color)]">No assignments found for this course.</p>
                )}
              </div>

              {/* Announcements Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-[var(--primary-color)] mb-4">Announcements</h2>
                {courseData.announcements.length > 0 ? (
                  <div className="space-y-4">
                    {courseData.announcements.map((announcement, index) => {
                      // Format date
                      const postedDate = announcement.posted_at
                        ? new Date(announcement.posted_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: new Date().getFullYear() !== new Date(announcement.posted_at).getFullYear()
                              ? 'numeric'
                              : undefined
                          })
                        : '';

                      return (
                        <div
                          key={announcement.id}
                          className={`py-4 ${index !== courseData.announcements.length - 1 ? 'border-b border-gray-200' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-medium text-[var(--primary-color)]">{announcement.title}</h3>
                            {postedDate && <span className="text-sm text-[var(--secondary-color)]">{postedDate}</span>}
                          </div>
                          {announcement.html ? (
                            <div
                              className="text-[var(--secondary-color)] announcement-content"
                              dangerouslySetInnerHTML={{ __html: announcement.html }}
                            />
                          ) : announcement.message ? (
                            <div
                              className="text-[var(--secondary-color)] announcement-content"
                              dangerouslySetInnerHTML={{ __html: announcement.message }}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[var(--secondary-color)]">No announcements found for this course.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[var(--white-grey)] rounded-lg shadow-lg p-6">
            <p className="text-[var(--secondary-color)]">Course not found. Please go back to the courses page and try again.</p>
          </div>
        )}


      </div>
    </>
  );
}
