'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getTwoStageData } from '../../services/api';

export default function Dashboard() {
  const [error, setError] = useState('');
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [twoStageData, setTwoStageData] = useState({
    loading: false,
    error: null
  });

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
        console.log('Fetching two-stage data with caching...');
        const data = await getTwoStageData({ cache: 'force-cache' });

        // Set the data and mark both stages as cached
        setTwoStageData(prev => ({
          ...prev,
          loading: false
        }));

        stage1CachedRef.current = true;
        stage2CachedRef.current = true;

        console.log('Two-stage data cached successfully:', data);
      } catch (err) {
        console.error('Failed to fetch two-stage data:', err);
        setTwoStageData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch two-stage data'
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
        loading: false
      }));

      // Mark as cached
      stage1CachedRef.current = true;
      stage2CachedRef.current = true;

      console.log('Cache refreshed successfully:', data);

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

        {/* Refresh Cache Button */}
        <div className="mb-4 bg-white p-4 shadow sm:rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cache Control</h2>
            <button
              onClick={handleRefreshCache}
              disabled={refreshingCache || twoStageData.loading}
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
          {twoStageData.loading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Loading data...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
