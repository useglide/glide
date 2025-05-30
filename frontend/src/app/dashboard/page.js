'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  getTwoStageData,
  getDetailedCourseData,
  getFavoriteCourses,
  addFavoriteCourse,
  removeFavoriteCourse,
  updateFavoriteCourseColor,
  updateFavoriteCourseDisplayName,
  getRemovedCourses
} from '../../services/api';
import { CurrentCourses } from '../../components/CurrentCourses';
import { UpcomingAssignments } from '../../components/UpcomingAssignments';
import { Announcements } from '../../components/Announcements';
import { YourProgress } from '../../components/YourProgress';
import { Header } from '../../components/Header';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [twoStageData, setTwoStageData] = useState({
    loading: true,
    error: null,
    data: null
  });

  const [detailedCourseData, setDetailedCourseData] = useState({
    loading: true,
    error: null,
    data: null
  });

  // State to track favorite/current courses
  const [favoriteCourses, setFavoriteCourses] = useState([]);
  const [favoriteCoursesData, setFavoriteCoursesData] = useState([]); // Store complete favorite data with colors
  const [favoriteCoursesLoading, setFavoriteCoursesLoading] = useState(true);

  const { user, logout } = useAuth();
  const router = useRouter();

  // Handle Google authentication from both URL parameters and popup window messages
  useEffect(() => {
    if (!user) {
      return;
    }

    // Function to process the auth code
    const processAuthCode = async (authCode) => {
      try {
        console.log('Processing Google authentication code...');

        // Call the backend to process the auth code
        const response = await fetch(`${process.env.NEXT_PUBLIC_GENOA_API_URL || 'http://localhost:8000/api'}/v1/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            user_id: user.uid,
            auth_code: authCode
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setError('Google authentication successful!');
          } else {
            setError('Failed to authenticate with Google: ' + (result.message || 'Unknown error'));
          }
        } else {
          setError('Failed to authenticate with Google: Server error');
        }
      } catch (err) {
        console.error('Error processing Google auth code:', err);
        setError('Failed to process Google authentication: ' + (err.message || 'Unknown error'));
      }
    };

    // Handle error from Google OAuth
    const handleAuthError = (errorMessage) => {
      console.error('Error from Google OAuth:', errorMessage);
      setError(`Google authentication error: ${errorMessage}`);
    };

    // Check for auth_code in URL query parameters (for backward compatibility)
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('auth_code');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      handleAuthError(errorParam);

      // Remove the error parameter from the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    if (authCode) {
      console.log('Found auth_code in URL, processing Google authentication...');
      processAuthCode(authCode);

      // Remove the auth_code parameter from the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Set up event listener for messages from the popup window
    const handleMessage = (event) => {
      // Validate the message
      if (!event.data || typeof event.data !== 'object') return;

      const { type, authCode, error } = event.data;

      if (type === 'GOOGLE_AUTH_SUCCESS' && authCode) {
        console.log('Received auth code from popup window');
        processAuthCode(authCode);
      } else if (type === 'GOOGLE_AUTH_ERROR' && error) {
        handleAuthError(error);
      }
    };

    // Add event listener for messages from the popup
    window.addEventListener('message', handleMessage);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [user]);

  // Fetch data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch two-stage data
        setTwoStageData(prev => ({ ...prev, loading: true, error: null }));
        console.log('Fetching two-stage data...');
        const twoStageResult = await getTwoStageData();
        setTwoStageData(prev => ({
          ...prev,
          loading: false,
          data: twoStageResult
        }));
        console.log('Two-stage data fetched successfully:', twoStageResult);

        // Fetch detailed course data
        setDetailedCourseData(prev => ({ ...prev, loading: true, error: null }));
        console.log('Fetching detailed course data...');
        const detailedResult = await getDetailedCourseData();
        setDetailedCourseData(prev => ({
          ...prev,
          loading: false,
          data: detailedResult
        }));
        console.log('Detailed course data fetched successfully:', detailedResult);

        // Log the structure of assignments to check if we have upcoming assignments
        if (detailedResult && detailedResult.assignments) {
          console.log('Assignments structure:', Object.keys(detailedResult.assignments));
          if (detailedResult.assignments.upcoming) {
            console.log('Upcoming assignments sample:', detailedResult.assignments.upcoming.slice(0, 2));
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setTwoStageData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch two-stage data'
        }));
        setDetailedCourseData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch detailed course data'
        }));
      }
    };

    fetchData();
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      setError('Failed to log out: ' + (err.message || 'Unknown error'));
    }
  };

  // Fetch favorite courses from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchFavoriteCourses = async () => {
      try {
        setFavoriteCoursesLoading(true);
        const favorites = await getFavoriteCourses();
        console.log('Fetched favorite courses:', favorites);

        // Store the complete favorite data for color information
        setFavoriteCoursesData(favorites || []);

        // Extract just the IDs for compatibility with existing code
        let favoriteIds = [];
        if (favorites && Array.isArray(favorites)) {
          favoriteIds = favorites.map(course => course.id);
        }

        // Get list of explicitly removed courses to prevent auto-re-adding
        let removedCourseIds = [];
        try {
          removedCourseIds = await getRemovedCourses();
          console.log('Removed course IDs:', removedCourseIds);
        } catch (removedError) {
          console.error('Error fetching removed courses:', removedError);
          // Continue with empty array if there's an error
        }

        // Check if we have detailed course data with courses
        if (detailedCourseData.data?.courses && detailedCourseData.data.courses.length > 0) {
          console.log('All courses:', detailedCourseData.data.courses);

          // First try to find courses with explicit 'current' status
          let currentCourses = detailedCourseData.data.courses.filter(
            course => course.status === 'current'
          );

          // If no courses with 'current' status, try to determine current courses by end date
          if (currentCourses.length === 0) {
            const now = new Date();
            currentCourses = detailedCourseData.data.courses.filter(course => {
              // If no end_at, consider it current
              if (!course.end_at) return true;

              // If end date is in the future, consider it current
              const endDate = new Date(course.end_at);
              return endDate > now;
            });

            console.log('Current courses determined by end date:', currentCourses);
          } else {
            console.log('Current courses with status field:', currentCourses);
          }

          // If we have current courses, add them to favorites if they're not already there
          // Note: The backend will handle checking if a course was explicitly removed by the user
          if (currentCourses.length > 0) {
            console.log('Checking current courses to auto-add. Removed courses:', removedCourseIds);
            let favoritesChanged = false;

            for (const course of currentCourses) {
              // Only add if not in favorites AND not explicitly removed by user
              if (!favoriteIds.includes(course.id) && !removedCourseIds.includes(course.id)) {
                console.log(`Adding current course ${course.id} to favorites`);
                try {
                  await addFavoriteCourse(course.id);
                  const updatedFavorites = await getFavoriteCourses();
                  if (updatedFavorites && Array.isArray(updatedFavorites)) {
                    favoriteIds = updatedFavorites.map(course => course.id);
                    favoritesChanged = true;
                  }
                } catch (err) {
                  console.error(`Failed to add current course ${course.id} to favorites:`, err);
                }
              }
            }

            if (favoritesChanged) {
              // We've already updated favoriteIds above
              console.log('Updated favorite courses:', favoriteIds);
            }
          }

          // If we still have no favorites, use the first 6 courses (excluding removed ones)
          if (favoriteIds.length === 0) {
            console.log('No favorites found after checking current courses, defaulting to first 6 courses');
            const availableCourses = detailedCourseData.data.courses.filter(c => !removedCourseIds.includes(c.id));
            const defaultFavorites = availableCourses.slice(0, 6).map(c => c.id);

            // Add these default courses to favorites in Firestore
            console.log('Adding default courses to favorites:', defaultFavorites);
            for (const courseId of defaultFavorites) {
              try {
                await addFavoriteCourse(courseId);
              } catch (err) {
                console.error(`Failed to add default course ${courseId} to favorites:`, err);
              }
            }

            favoriteIds = defaultFavorites;
          }
        }

        // Set the favorite courses (excluding any that are explicitly removed)
        const finalFavoriteIds = favoriteIds.filter(id => !removedCourseIds.includes(id));
        console.log('Final favorite courses after removing excluded:', finalFavoriteIds);
        setFavoriteCourses(finalFavoriteIds);
      } catch (error) {
        console.error('Error fetching favorite courses:', error);

        // Default to first 6 courses if there's an error
        if (detailedCourseData.data?.courses) {
          setFavoriteCourses(detailedCourseData.data.courses.slice(0, 6).map(c => c.id));
        }
      } finally {
        setFavoriteCoursesLoading(false);
      }
    };

    fetchFavoriteCourses();
  }, [user, detailedCourseData.data]);

  // Handle adding a course to favorites
  const handleAddCourse = async (courseId) => {
    try {
      // Only add if not already in favorites
      if (!favoriteCourses.includes(courseId)) {
        // Find the course details
        const course = detailedCourseData.data?.courses?.find(c => c.id === courseId);
        if (!course) {
          console.error(`Course with ID ${courseId} not found`);
          return;
        }

        // Add to Firestore
        await addFavoriteCourse(courseId);

        // Update local state
        setFavoriteCourses(prev => [...prev, courseId]);
      }
    } catch (error) {
      console.error('Error adding course to favorites:', error);
    }
  };

  // Handle removing a course from favorites
  const handleRemoveCourse = async (courseId) => {
    try {
      // Remove from Firestore
      await removeFavoriteCourse(courseId);

      // Update local state
      const newFavorites = favoriteCourses.filter(id => id !== courseId);
      setFavoriteCourses(newFavorites);
    } catch (error) {
      console.error('Error removing course from favorites:', error);
    }
  };

  // Handle updating a favorite course's color
  const handleUpdateFavoriteColor = async (courseId, color) => {
    try {
      await updateFavoriteCourseColor(courseId, color);

      // Refresh favorite courses to get the updated color
      const favorites = await getFavoriteCourses();
      if (favorites && Array.isArray(favorites)) {
        setFavoriteCoursesData(favorites);

        // Get removed courses to filter them out
        const removedCourseIds = await getRemovedCourses();
        const favoriteIds = favorites.map(course => course.id);

        // Filter out removed courses before updating state
        const filteredFavoriteIds = favoriteIds.filter(id => !removedCourseIds.includes(id));
        setFavoriteCourses(filteredFavoriteIds);
      }
    } catch (error) {
      console.error('Error updating favorite course color:', error);
    }
  };

  // Handle updating a favorite course's display name
  const handleUpdateFavoriteDisplayName = async (courseId, displayName) => {
    try {
      await updateFavoriteCourseDisplayName(courseId, displayName);

      // Refresh favorite courses to get the updated display name
      const favorites = await getFavoriteCourses();
      if (favorites && Array.isArray(favorites)) {
        setFavoriteCoursesData(favorites);

        // Get removed courses to filter them out
        const removedCourseIds = await getRemovedCourses();
        const favoriteIds = favorites.map(course => course.id);

        // Filter out removed courses before updating state
        const filteredFavoriteIds = favoriteIds.filter(id => !removedCourseIds.includes(id));
        setFavoriteCourses(filteredFavoriteIds);
      }
    } catch (error) {
      console.error('Error updating favorite course display name:', error);
    }
  };



  const handleRefreshData = async () => {
    try {
      setRefreshingCache(true);
      setError('');

      // Set loading state
      setTwoStageData(prev => ({ ...prev, loading: true, error: null }));
      setDetailedCourseData(prev => ({ ...prev, loading: true, error: null }));

      console.log('Refreshing data...');

      // Fetch fresh data
      const twoStageResult = await getTwoStageData();
      console.log('Two-stage data refreshed successfully:', twoStageResult);

      setTwoStageData(prev => ({
        ...prev,
        loading: false,
        data: twoStageResult
      }));

      // Now fetch detailed course data
      console.log('Refreshing detailed course data...');
      const detailedResult = await getDetailedCourseData();
      console.log('Detailed course data refreshed successfully:', detailedResult);

      setDetailedCourseData(prev => ({
        ...prev,
        loading: false,
        data: detailedResult
      }));

      // Show success message
      setError('Data refreshed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setTwoStageData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to refresh data'
      }));
      setDetailedCourseData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to refresh data'
      }));
      setError('Failed to refresh data: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshingCache(false);
    }
  };

  // Calculate upcoming deadlines from assignment data
  const calculateUpcomingDeadlines = (assignments) => {
    if (!assignments || assignments.length === 0) return { total: 0, thisWeek: 0 };

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let totalUpcoming = 0;
    let dueThisWeek = 0;

    assignments.forEach(assignment => {
      if (!assignment.due_at) return;

      try {
        const dueDate = new Date(assignment.due_at);

        // Count assignments due in the future
        if (dueDate > now) {
          totalUpcoming++;

          // Count assignments due within the next week
          if (dueDate <= oneWeekFromNow) {
            dueThisWeek++;
          }
        }
      } catch (e) {
        console.error('Error parsing due date for deadline calculation:', assignment.due_at, e);
      }
    });

    return { total: totalUpcoming, thisWeek: dueThisWeek };
  };

  // Calculate the upcoming deadlines from the current assignment data
  const upcomingDeadlinesData = calculateUpcomingDeadlines(detailedCourseData.data?.assignments || []);

  // Calculate current courses for credit calculation (separate from favorites)
  const getCurrentCourses = () => {
    if (!detailedCourseData.data?.courses) return [];

    // First try to find courses with explicit 'current' status
    let currentCourses = detailedCourseData.data.courses.filter(
      course => course.status === 'current'
    );

    // If no courses with 'current' status, try to determine current courses by end date
    if (currentCourses.length === 0) {
      const now = new Date();
      currentCourses = detailedCourseData.data.courses.filter(course => {
        // If no end_at, consider it current
        if (!course.end_at) return true;

        // If end date is in the future, consider it current
        const endDate = new Date(course.end_at);
        return endDate > now;
      });
    }

    return currentCourses;
  };

  const currentCourses = getCurrentCourses();

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header title="Dashboard" onLogout={handleLogout} />

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

        {twoStageData.error && (
          <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
            Two-stage data error: {twoStageData.error}
          </div>
        )}

        {/* Current Courses Section */}
        <CurrentCourses
          courses={(detailedCourseData.data?.courses?.filter(course =>
            favoriteCourses.includes(course.id)
          ) || []).map(course => {
            // Merge course data with favorite color information
            const favoriteData = favoriteCoursesData.find(fav => fav.id === course.id);
            return {
              ...course,
              customColor: favoriteData?.color || null,
              displayName: favoriteData?.displayName || null
            };
          })}
          allCourses={detailedCourseData.data?.courses || []}
          loading={detailedCourseData.loading || favoriteCoursesLoading}
          refreshing={refreshingCache}
          onAddCourse={handleAddCourse}
          onRemoveCourse={handleRemoveCourse}
          onUpdateColor={handleUpdateFavoriteColor}
          onUpdateDisplayName={handleUpdateFavoriteDisplayName}
          onRefreshData={handleRefreshData}
        />

        {/* Upcoming Assignments and Announcements Section */}
        <div className="mt-8 flex flex-col lg:flex-row" style={{ gap: '2rem' }}>
          <div className="lg:w-1/2 flex flex-col">
            <UpcomingAssignments
              assignments={detailedCourseData.data?.assignments || []}
              loading={detailedCourseData.loading}
            />
          </div>
          <div className="lg:w-1/2 flex flex-col">
            <Announcements
              announcements={detailedCourseData.data?.announcements || []}
              loading={detailedCourseData.loading}
            />
          </div>
        </div>

        {/* Your Progress Section */}
        <YourProgress
          loading={detailedCourseData.loading}
          requiredCredits={120}
          upcomingDeadlines={upcomingDeadlinesData.total}
          dueThisWeek={upcomingDeadlinesData.thisWeek}
          courses={currentCourses}
        />


      </div>
    </>
  );
}
