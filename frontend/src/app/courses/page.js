'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getDetailedCourseData } from '../../services/api';
import { Header } from '../../components/Header';
import { CoursesList } from '../../components/CoursesList';

export default function CoursesPage() {
  const [error, setError] = useState('');
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [detailedCourseData, setDetailedCourseData] = useState({
    loading: false,
    error: null,
    data: null
  });

  // Use refs to track if data has been cached
  const detailedDataCachedRef = useRef(false);

  const { user, logout } = useAuth();
  const router = useRouter();

  // Fetch detailed course data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchDetailedCourseData = async () => {
      try {
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
      } catch (err) {
        console.error('Failed to fetch detailed course data:', err);
        setDetailedCourseData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch detailed course data'
        }));
      }
    };

    fetchDetailedCourseData();
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      setError('Failed to log out: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRefreshCache = async () => {
    try {
      setRefreshingCache(true);
      setError('');

      // Clear browser cache for API endpoints
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          // Try to clear the Next.js data cache
          const cacheKeys = await window.caches.keys();
          for (const key of cacheKeys) {
            // Only clear caches that might contain API data
            if (key.includes('next-data') || key.includes('api-cache')) {
              await window.caches.delete(key);
              console.log(`Cleared cache: ${key}`);
            }
          }
          console.log('Cache cleared before refresh');
        } catch (error) {
          console.error('Error clearing cache:', error);
        }
      }

      // Reset cache status
      detailedDataCachedRef.current = false;

      // Set loading state
      setDetailedCourseData(prev => ({ ...prev, loading: true, error: null }));

      console.log('Refreshing detailed course data...');
      const detailedData = await getDetailedCourseData({ bypassCache: true });

      // Update state with new data
      setDetailedCourseData(prev => ({
        ...prev,
        loading: false,
        data: detailedData
      }));

      // Mark detailed data as cached
      detailedDataCachedRef.current = true;

      // Force a re-render by creating a new reference for the data object
      setDetailedCourseData(prev => ({ ...prev, data: { ...prev.data } }));

      console.log('Detailed course data refreshed successfully:', detailedData);

      // Show success message
      setError('Course data refreshed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } catch (err) {
      console.error('Failed to refresh course data:', err);
      setDetailedCourseData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to refresh course data'
      }));
      setError('Failed to refresh course data: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshingCache(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header title="Courses" onLogout={handleLogout} />

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

        {detailedCourseData.error && (
          <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
            Course data error: {detailedCourseData.error}
          </div>
        )}

        {/* Courses List Section */}
        <CoursesList
          courses={detailedCourseData.data?.courses || []}
          loading={detailedCourseData.loading}
          refreshing={refreshingCache}
          onRefreshData={handleRefreshCache}
        />
      </div>
    </>
  );
}
