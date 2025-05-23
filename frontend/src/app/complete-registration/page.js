'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  storeCanvasCredentials,
  createClassFolders,
  getUserCourses,
  refreshUserCourses
} from '../../services/api';
import { auth } from '../../config/firebase';

export default function CompleteRegistration() {
  const [canvasUrl, setCanvasUrl] = useState('');
  const [canvasApiKey, setCanvasApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canvasUrl || !canvasApiKey) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Store Canvas credentials
      await storeCanvasCredentials({
        canvasUrl,
        canvasApiKey
      });

      try {
        // First refresh courses from Canvas to ensure they're in Firestore
        console.log('Refreshing courses from Canvas...');
        await refreshUserCourses();
        console.log('Courses refreshed successfully');

        // Now get the user's courses from Firestore
        const coursesData = await getUserCourses();
        console.log(`Retrieved ${coursesData.length} courses from Firestore`);

        // Filter for current courses only
        const currentCourses = coursesData.filter(course => course.status === 'current');
        console.log(`Found ${currentCourses.length} current courses`);

        // Extract course names for folder creation
        const courseNames = currentCourses.map(course => course.name);

        if (courseNames.length > 0) {
          try {
            // Create folders for the user's current courses
            await createClassFolders(user.uid, courseNames);
            console.log(`Created folders for ${courseNames.length} courses`);
          } catch (apiError) {
            // Log the error but continue
            console.error('Error creating folders:', apiError);
          }
        } else {
          console.log('No current courses found to create folders for');
        }
      } catch (coursesError) {
        // Log the error but don't prevent the user from proceeding
        console.error('Error getting or refreshing courses:', coursesError);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to save Canvas credentials: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Complete Your Registration</h1>
          <h2 className="mt-2 text-xl">Add Canvas Information</h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="canvasUrl" className="block text-sm font-medium text-gray-700">
                Canvas URL
              </label>
              <input
                id="canvasUrl"
                name="canvasUrl"
                type="url"
                required
                value={canvasUrl}
                onChange={(e) => setCanvasUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="https://canvas.instructure.com"
              />
            </div>

            <div>
              <label htmlFor="canvasApiKey" className="block text-sm font-medium text-gray-700">
                Canvas API Key
              </label>
              <input
                id="canvasApiKey"
                name="canvasApiKey"
                type="text"
                required
                value={canvasApiKey}
                onChange={(e) => setCanvasApiKey(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Canvas API Key"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can generate an API key in your Canvas account settings.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
