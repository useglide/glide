'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  getUserCourses,
  refreshUserCourses,
  updateCourseStatus,
  ensureUserHasCourses,
  getTwoStageData
} from '../../services/api';

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [ensuring, setEnsuring] = useState(false);
  const [error, setError] = useState('');
  const [twoStageData, setTwoStageData] = useState({
    stage1: null,
    stage2: null,
    loading: false,
    error: null
  });
  const [refreshingCache, setRefreshingCache] = useState(false);

  // Use refs to track if data has been cached
  const stage1CachedRef = useRef(false);
  const stage2CachedRef = useRef(false);

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
        // This will cache both stage 1 and stage 2 data
        console.log('Fetching two-stage data with caching...');
        const data = await getTwoStageData({ cache: 'force-cache' });

        // Set the data and mark both stages as cached
        setTwoStageData(prev => ({
          ...prev,
          stage1: data,
          stage2: data,
          loading: false
        }));

        stage1CachedRef.current = true;
        stage2CachedRef.current = true;

        console.log('Two-stage data cached successfully:', data);

        // If we have courses in the data, use them
        if (data.courses && data.courses.length > 0) {
          setCourses(data.courses);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch two-stage data:', err);
        setTwoStageData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch two-stage data'
        }));

        // Fall back to regular course fetching if two-stage fails
        fetchCourses();
      }
    };

    // Fetch user's courses (fallback method)
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const result = await getUserCourses();

        // If courses were found, set them
        if (result.courses && result.courses.length > 0) {
          setCourses(result.courses);
          return true;
        } else if (result.coursesFetched) {
          // If courses were just fetched but none found, show empty state
          setCourses([]);
          return true;
        }

        // If no courses found, try to fetch them automatically
        try {
          setEnsuring(true);
          const ensureResult = await ensureUserHasCourses();

          // Get the courses again after ensuring
          const updatedResult = await getUserCourses();
          setCourses(updatedResult.courses || []);

          if (ensureResult.courseCount > 0 && !ensureResult.coursesExisted) {
            setError(`Successfully fetched ${ensureResult.courseCount} courses (${ensureResult.presentCourses} current, ${ensureResult.pastCourses} past)`);
          }

          return true;
        } catch (ensureErr) {
          console.error('Error ensuring courses:', ensureErr);
          setCourses([]);
          return false;
        } finally {
          setEnsuring(false);
        }
      } catch (err) {
        setError('Failed to load courses: ' + (err.message || 'Unknown error'));
        return false;
      } finally {
        setLoading(false);
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

  const handleRefreshCourses = async () => {
    try {
      setRefreshing(true);
      setError('');
      await refreshUserCourses(); // Remove unused result variable
      const updatedResult = await getUserCourses();
      setCourses(updatedResult.courses || []);
    } catch (err) {
      setError('Failed to refresh courses: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      setError('');
      await updateCourseStatus(); // Remove unused result variable
      const updatedResult = await getUserCourses();
      setCourses(updatedResult.courses || []);
    } catch (err) {
      setError('Failed to update course status: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleEnsureCourses = async () => {
    try {
      setEnsuring(true);
      setError('');
      const result = await ensureUserHasCourses();
      const updatedResult = await getUserCourses();
      setCourses(updatedResult.courses || []);

      if (!result.coursesExisted) {
        setError(`Successfully fetched ${result.courseCount} courses (${result.presentCourses} current, ${result.pastCourses} past)`);
      }
    } catch (err) {
      setError('Failed to ensure courses: ' + (err.message || 'Unknown error'));
    } finally {
      setEnsuring(false);
    }
  };

  const handleRefreshCache = async () => {
    try {
      setRefreshingCache(true);
      setError('');

      // Reset cache status
      stage1CachedRef.current = false;
      stage2CachedRef.current = false;

      // Set loading state
      setTwoStageData(prev => ({ ...prev, loading: true, error: null }));

      console.log('Refreshing cache by bypassing browser cache...');

      // Fetch data with cache bypassing
      const data = await getTwoStageData({ bypassCache: true });

      // Update the data and mark both stages as cached
      setTwoStageData(prev => ({
        ...prev,
        stage1: data,
        stage2: data,
        loading: false
      }));

      // Mark as cached
      stage1CachedRef.current = true;
      stage2CachedRef.current = true;

      console.log('Cache refreshed successfully:', data);

      // Update courses if available
      if (data.courses && data.courses.length > 0) {
        setCourses(data.courses);
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
      setError('Failed to refresh cache: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshingCache(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

        {/* Two-Stage Data Status */}
        <div className="mb-4 bg-white p-4 shadow sm:rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Two-Stage Data Status</h2>
            <button
              onClick={handleRefreshCache}
              disabled={refreshingCache || twoStageData.loading || updating || refreshing || ensuring}
              className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            >
              {refreshingCache ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Cache
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-md ${stage1CachedRef.current ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${stage1CachedRef.current ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">Stage 1 Data</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stage1CachedRef.current ? 'Cached in browser' : 'Not cached'}
              </p>
            </div>
            <div className={`p-3 rounded-md ${stage2CachedRef.current ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${stage2CachedRef.current ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">Stage 2 Data</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stage2CachedRef.current ? 'Cached in browser' : 'Not cached'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 shadow sm:rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Courses</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleUpdateStatus}
                disabled={updating || refreshing || ensuring || twoStageData.loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Fix Course Status'}
              </button>
              <button
                onClick={handleRefreshCourses}
                disabled={refreshing || updating || ensuring || twoStageData.loading}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Courses'}
              </button>
              <button
                onClick={handleEnsureCourses}
                disabled={ensuring || refreshing || updating || twoStageData.loading}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {ensuring ? 'Fetching...' : 'Fetch Missing Courses'}
              </button>
            </div>
          </div>

          {loading || twoStageData.loading ? (
            <div className="mt-4 text-center">
              {twoStageData.loading ? 'Loading two-stage data...' : 'Loading courses...'}
            </div>
          ) : courses.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`rounded-lg border p-4 shadow-sm ${
                    course.status === 'present' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.courseCode}</p>
                  <p className="text-sm text-gray-500">{course.termName}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        course.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.status === 'present' ? 'Current' : 'Past'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-gray-500 mb-4">No courses found.</p>
              <button
                onClick={handleEnsureCourses}
                disabled={ensuring}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {ensuring ? 'Fetching Courses...' : 'Fetch Courses from Canvas'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
