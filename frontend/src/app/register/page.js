'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { registerUser, createClassFolders, getUserCourses } from '../../services/api';
import { auth } from '../../config/firebase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [canvasUrl, setCanvasUrl] = useState('');
  const [canvasApiKey, setCanvasApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithToken } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !canvasUrl || !canvasApiKey) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Register user through our API
      const result = await registerUser({
        email,
        password,
        canvasUrl,
        canvasApiKey
      });

      // If registration returns a token, use it to log in
      if (result.token) {
        await loginWithToken(result.token);

        try {
          // Get the user's courses
          const user = auth.currentUser;
          if (!user) {
            throw new Error('User not authenticated');
          }

          const coursesData = await getUserCourses();

          // Filter for current courses only
          const currentCourses = coursesData.filter(course => course.status === 'current');

          // Extract course names for folder creation
          const courseNames = currentCourses.map(course => course.name);

          if (courseNames.length > 0) {
            try {
              // Create folders for the user's current courses
              await createClassFolders(user.uid, courseNames);
              console.log(`Created folders for ${courseNames.length} courses`);
            } catch (apiError) {
              // Check if this is a Google authentication error
              if (apiError.isGoogleAuthError && apiError.auth_url) {
                console.log('Google authentication required. Will handle after registration.');
                // We'll let the user complete registration first, then they can authenticate with Google later
                // No need to open a window here as they'll be redirected to dashboard where they can authenticate
              } else {
                // Re-throw other errors
                throw apiError;
              }
            }
          }
        } catch (folderError) {
          // Log the error but don't prevent the user from proceeding
          console.error('Error creating course folders:', folderError);
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Otherwise, redirect to login page
        router.push('/login');
      }
    } catch (err) {
      setError('Failed to register: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Canvas Dashboard</h1>
          <h2 className="mt-2 text-xl">Create a new account</h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Confirm Password"
              />
            </div>

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
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
