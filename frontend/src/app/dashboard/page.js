'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getTwoStageData, getDetailedCourseData } from '../../services/api';
import { CurrentCourses } from '../../components/CurrentCourses';
import { UpcomingAssignments } from '../../components/UpcomingAssignments';
import { Announcements } from '../../components/Announcements';
import { YourProgress } from '../../components/YourProgress';
import { Header } from '../../components/Header';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [refreshingCache, setRefreshingCache] = useState(false);
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
          currentGPA={3.78}
          previousGPA={3.75}
          completedCredits={109}
          requiredCredits={120}
          upcomingDeadlines={5}
          dueThisWeek={3}
        />
      </div>
    </>
  );
}
