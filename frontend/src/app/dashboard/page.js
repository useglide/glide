'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getTwoStageData, getDetailedCourseData, createClassFolders } from '../../services/api';
import { CurrentCourses } from '../../components/CurrentCourses';
import { UpcomingAssignments } from '../../components/UpcomingAssignments';
import { Announcements } from '../../components/Announcements';
import { YourProgress } from '../../components/YourProgress';
import { Header } from '../../components/Header';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [creatingFolders, setCreatingFolders] = useState(false);
  const [twoStageData, setTwoStageData] = useState({
    loading: false,
    error: null,
    data: null
  });

  const [detailedCourseData, setDetailedCourseData] = useState({
    loading: false,
    error: null,
    data: null
  });

  // State to track favorite/current courses
  const [favoriteCourses, setFavoriteCourses] = useState([]);

  // Use refs to track if data has been cached
  const stage1CachedRef = useRef(false);
  const stage2CachedRef = useRef(false);
  const detailedDataCachedRef = useRef(false);

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
            setError('Google authentication successful! You can now create semester folders.');
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

  // Fetch two-stage data with caching
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchTwoStageData = async () => {
      try {
        setTwoStageData(prev => ({ ...prev, loading: true, error: null }));

        // First fetch with force-cache to ensure it's cached in the browser
        console.log('Fetching two-stage data with caching...');
        const data = await getTwoStageData({ cache: 'force-cache' });

        // Set the data and mark both stages as cached
        setTwoStageData(prev => ({
          ...prev,
          loading: false,
          data: data
        }));

        stage1CachedRef.current = true;
        stage2CachedRef.current = true;

        console.log('Two-stage data cached successfully:', data);

        // Now fetch detailed course data after two-stage data is cached
        await fetchDetailedCourseData();
      } catch (err) {
        console.error('Failed to fetch two-stage data:', err);
        setTwoStageData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch two-stage data'
        }));
      }
    };

    const fetchDetailedCourseData = async () => {
      try {
        // Only proceed if two-stage data is cached
        if (!stage1CachedRef.current || !stage2CachedRef.current) {
          console.log('Two-stage data not cached yet, skipping detailed course data fetch');
          return;
        }

        setDetailedCourseData(prev => ({ ...prev, loading: true, error: null }));

        console.log('Fetching detailed course data...');
        const data = await getDetailedCourseData({ cache: 'force-cache' });

        setDetailedCourseData(prev => ({
          ...prev,
          loading: false,
          data: data
        }));

        detailedDataCachedRef.current = true;

        console.log('Detailed course data cached successfully:', data);

        // Log the structure of assignments to check if we have upcoming assignments
        if (data && data.assignments) {
          console.log('Assignments structure:', Object.keys(data.assignments));
          if (data.assignments.upcoming) {
            console.log('Upcoming assignments sample:', data.assignments.upcoming.slice(0, 2));
          }
        }
      } catch (err) {
        console.error('Failed to fetch detailed course data:', err);
        setDetailedCourseData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch detailed course data'
        }));
      }
    };

    // Start with the two-stage data fetch
    fetchTwoStageData();
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      setError('Failed to log out: ' + (err.message || 'Unknown error'));
    }
  };

  // Initialize favorite courses from localStorage or set to first 5 courses when data is loaded
  useEffect(() => {
    if (detailedCourseData.data?.courses) {
      const storedFavorites = localStorage.getItem('favoriteCourses');

      if (storedFavorites) {
        try {
          const parsedFavorites = JSON.parse(storedFavorites);
          // Filter to make sure all favorites still exist in the course list
          const validFavorites = parsedFavorites.filter(id =>
            detailedCourseData.data.courses.some(course => course.id === id)
          );
          setFavoriteCourses(validFavorites);
        } catch (e) {
          console.error('Error parsing favorite courses:', e);
          // Default to first 6 courses if there's an error
          setFavoriteCourses(detailedCourseData.data.courses.slice(0, 6).map(c => c.id));
        }
      } else {
        // Default to first 6 courses if no favorites are stored
        setFavoriteCourses(detailedCourseData.data.courses.slice(0, 6).map(c => c.id));
      }
    }
  }, [detailedCourseData.data]);

  // Handle adding a course to favorites
  const handleAddCourse = (courseId) => {
    setFavoriteCourses(prev => {
      // Only add if not already in favorites
      if (!prev.includes(courseId)) {
        const newFavorites = [...prev, courseId];
        // Save to localStorage
        localStorage.setItem('favoriteCourses', JSON.stringify(newFavorites));
        return newFavorites;
      }
      return prev;
    });
  };

  // Handle removing a course from favorites
  const handleRemoveCourse = (courseId) => {
    setFavoriteCourses(prev => {
      const newFavorites = prev.filter(id => id !== courseId);
      // Save to localStorage
      localStorage.setItem('favoriteCourses', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleCreateSemesterFolders = async () => {
    if (creatingFolders || !user) {
      console.log('Button click ignored:', creatingFolders ? 'Already creating folders' : 'No user logged in');
      return;
    }

    console.log('Starting folder creation process');
    setCreatingFolders(true);
    setError('');

    try {
      // Log the detailed course data to check its structure
      console.log('Detailed course data:', detailedCourseData.data);

      // Check if courses exist
      if (!detailedCourseData.data?.courses) {
        console.error('No courses data available');
        setError('No courses data available. Try refreshing the page.');
        setCreatingFolders(false);
        return;
      }

      // Get course names from the detailed course data
      const allCourses = detailedCourseData.data.courses;
      console.log('All courses:', allCourses);

      // Check if courses have a status field
      const hasStatusField = allCourses.some(course => course.status !== undefined);
      console.log('Courses have status field:', hasStatusField);

      // First try to get current courses if status field exists
      let courseNames = [];
      let currentCourses = [];

      if (hasStatusField) {
        currentCourses = allCourses.filter(course => course.status === 'current');
        console.log('Current courses:', currentCourses);

        if (currentCourses.length > 0) {
          courseNames = currentCourses.map(course => course.name);
        }
      }

      // If no current courses found, use favorite courses
      if (courseNames.length === 0 && favoriteCourses.length > 0) {
        console.log('No current courses found, using favorite courses');
        const favoriteCourseObjects = allCourses.filter(course => favoriteCourses.includes(course.id));
        courseNames = favoriteCourseObjects.map(course => course.name);
      }

      // If still no courses, use all courses as a fallback
      if (courseNames.length === 0) {
        console.log('No current or favorite courses found, using all courses');
        courseNames = allCourses.map(course => course.name);
      }

      console.log('Course names for folder creation:', courseNames);

      if (courseNames.length === 0) {
        console.warn('No courses found to create folders for');
        setError('No courses found to create folders for. Please try refreshing the page.');
        setCreatingFolders(false);
        return;
      }

      // Log user ID
      console.log('User ID for folder creation:', user.uid);

      // Call the API to create folders
      console.log('Calling createClassFolders API with:', {
        userId: user.uid,
        classNames: courseNames
      });

      try {
        const result = await createClassFolders(user.uid, courseNames);
        console.log('API response:', result);

        if (result.success) {
          console.log('Folder creation successful');
          setError(`Successfully created ${result.folder_count} folders for ${result.semester_name}!`);
        } else {
          console.error('Folder creation failed with result:', result);
          setError('Failed to create semester folders.');
        }
      } catch (apiError) {
        // Check if this is a Google authentication error
        if (apiError.isGoogleAuthError && apiError.auth_url) {
          console.log('Google authentication required. Opening auth in new window:', apiError.auth_url);
          setError('Google authentication required. Opening in a new window...');

          // Open Google authentication page in a new window
          window.open(apiError.auth_url, '_blank', 'noopener,noreferrer');
          return;
        }

        // Re-throw for the outer catch block to handle
        throw apiError;
      }
    } catch (err) {
      console.error('Failed to create semester folders:', err);
      setError('Failed to create semester folders: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingFolders(false);
      console.log('Folder creation process completed');
    }
  };

  const handleRefreshCache = async () => {
    try {
      setRefreshingCache(true);
      setError('');

      // Reset cache status
      stage1CachedRef.current = false;
      stage2CachedRef.current = false;
      detailedDataCachedRef.current = false;

      // Set loading state
      setTwoStageData(prev => ({ ...prev, loading: true, error: null }));
      setDetailedCourseData(prev => ({ ...prev, loading: false, error: null }));

      console.log('Refreshing cache by bypassing browser cache...');

      // Fetch data with cache bypassing
      const data = await getTwoStageData({ bypassCache: true });

      // Update the data and mark both stages as cached
      setTwoStageData(prev => ({
        ...prev,
        loading: false,
        data: data
      }));

      // Mark as cached
      stage1CachedRef.current = true;
      stage2CachedRef.current = true;

      console.log('Two-stage cache refreshed successfully:', data);

      // Now fetch detailed course data
      console.log('Refreshing detailed course data...');
      const detailedData = await getDetailedCourseData({ bypassCache: true });

      // Mark detailed data as cached
      detailedDataCachedRef.current = true;

      console.log('Detailed course data refreshed successfully:', detailedData);

      // Log the structure of assignments to check if we have upcoming assignments
      if (detailedData && detailedData.assignments) {
        console.log('Refreshed assignments structure:', Object.keys(detailedData.assignments));
        if (detailedData.assignments.upcoming) {
          console.log('Refreshed upcoming assignments sample:', detailedData.assignments.upcoming.slice(0, 2));
        }
      }

      // Show success message
      setError('Cache refreshed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } catch (err) {
      console.error('Failed to refresh cache:', err);
      setTwoStageData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to refresh cache'
      }));
      setDetailedCourseData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to refresh cache'
      }));
      setError('Failed to refresh cache: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshingCache(false);
    }
  };

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
          courses={detailedCourseData.data?.courses?.filter(course =>
            favoriteCourses.includes(course.id)
          ) || []}
          allCourses={detailedCourseData.data?.courses || []}
          loading={detailedCourseData.loading}
          refreshing={refreshingCache}
          onAddCourse={handleAddCourse}
          onRemoveCourse={handleRemoveCourse}
          onRefreshData={handleRefreshCache}
        />

        {/* Upcoming Assignments and Announcements Section */}
        <div className="mt-8 flex flex-col lg:flex-row" style={{ gap: '2rem' }}>
          <div className="lg:w-1/2 flex flex-col">
            <UpcomingAssignments
              assignments={detailedCourseData.data?.assignments?.upcoming || []}
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
          previousGPA={3.75}
          requiredCredits={120}
          upcomingDeadlines={5}
          dueThisWeek={3}
          courses={detailedCourseData.data?.courses || []}
        />

        {/* Create Semester Folders Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleCreateSemesterFolders}
            disabled={creatingFolders || detailedCourseData.loading}
            className={`px-6 py-3 rounded-lg font-medium text-white
              ${creatingFolders ? 'bg-gray-400' : 'bg-[var(--glide-blue)] hover:bg-[var(--blue-accent-hover)]'}
              transition-colors shadow-md flex items-center justify-center`}
          >
            {creatingFolders ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Folders...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Create Semester Folders
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
