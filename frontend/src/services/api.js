'use client';

import { auth } from '../config/firebase';

// Ensure no trailing slashes in API URLs
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const AUTH_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '/auth').replace(/\/$/, '')
  : 'http://localhost:3001/auth';

// Helper function to join URL paths without double slashes
const joinUrl = (base, path) => {
  if (!path) return base;
  return `${base}/${path.replace(/^\//, '')}`;
};

/**
 * Get the current user's ID token for authentication
 * @returns {Promise<string>} The ID token
 */
const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken();
};

/**
 * Make an authenticated API request
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The response data
 */
const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = await getIdToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(joinUrl(AUTH_URL, 'register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Registration failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Store Canvas credentials for the current user
 * @param {Object} credentials - Canvas credentials
 * @returns {Promise<Object>} Result
 */
export const storeCanvasCredentials = async (credentials) => {
  return fetchWithAuth(joinUrl(AUTH_URL, 'canvas-credentials'), {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
};

/**
 * Get Canvas credentials for the current user
 * @returns {Promise<Object>} Canvas credentials
 */
export const getCanvasCredentials = async () => {
  return fetchWithAuth(joinUrl(AUTH_URL, 'canvas-credentials'));
};

/**
 * Get user's courses
 * @returns {Promise<Object>} User's courses
 */
export const getUserCourses = async () => {
  return fetchWithAuth(joinUrl(AUTH_URL, 'courses'));
};

/**
 * Refresh user's courses
 * @returns {Promise<Object>} Result
 */
export const refreshUserCourses = async () => {
  return fetchWithAuth(joinUrl(AUTH_URL, 'courses/refresh'), {
    method: 'POST'
  });
};

/**
 * Update course status for existing courses
 * @returns {Promise<Object>} Result
 */
export const updateCourseStatus = async () => {
  return fetchWithAuth(joinUrl(AUTH_URL, 'courses/update-status'), {
    method: 'POST'
  });
};

/**
 * Ensure user has courses, fetching them if they don't exist
 * @returns {Promise<Object>} Result
 */
export const ensureUserHasCourses = async () => {
  return fetchWithAuth(joinUrl(AUTH_URL, 'courses/ensure'), {
    method: 'POST'
  });
};

/**
 * Create folders for user's enrolled classes
 * @param {string} userId - User ID
 * @param {Array<string>} classNames - List of class names to create folders for
 * @param {string} parentFolderId - Optional parent folder ID
 * @returns {Promise<Object>} Result of folder creation
 */
export const createClassFolders = async (userId, classNames, parentFolderId = null) => {
  const GENOA_API_URL = process.env.NEXT_PUBLIC_GENOA_API_URL || 'http://localhost:8000/api';
  // Make sure we're using the correct API version path
  const apiUrl = GENOA_API_URL.endsWith('/v1') ? GENOA_API_URL : `${GENOA_API_URL}/v1`;

  console.log('createClassFolders called with:', { userId, classNames, parentFolderId });
  console.log('Using API URL:', apiUrl);

  try {
    const token = await getIdToken();
    console.log('Got ID token for authentication');

    const requestBody = {
      user_id: userId,
      class_names: classNames,
      parent_folder_id: parentFolderId
    };
    console.log('Request body:', requestBody);

    console.log(`Sending POST request to ${apiUrl}/folders/create-class-folders`);
    const response = await fetch(`${apiUrl}/folders/create-class-folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      let errorDetail = 'Unknown error';
      let errorData;

      try {
        errorData = await response.json();

        // Check if this is a Google authentication required error
        if (response.status === 401 &&
            typeof errorData.detail === 'object' &&
            errorData.detail.error_type === 'google_auth_required') {

          // Return a special error object with auth_url that can be handled by the caller
          throw {
            isGoogleAuthError: true,
            message: errorData.detail.message || 'Google authentication required',
            auth_url: errorData.detail.auth_url
          };
        }

        errorDetail = errorData.detail || `HTTP error ${response.status}`;
        console.error('Error response body:', errorData);
      } catch (parseError) {
        if (parseError.isGoogleAuthError) {
          // Re-throw the special Google auth error
          throw parseError;
        }
        console.error('Could not parse error response:', parseError);
        errorDetail = `Failed to create class folders: ${response.status}`;
      }

      throw new Error(errorDetail);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Failed to create class folders:', error);
    throw error;
  }
};

/**
 * Get data from the two-stage endpoint with browser caching
 * @param {Object} options - Options for the request
 * @returns {Promise<Object>} Two-stage data
 */
export const getTwoStageData = async (options = {}) => {
  const { cache = 'force-cache', bypassCache = false } = options;

  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add user ID and timestamp to URL to ensure unique cache per user
    const url = joinUrl(API_URL, 'two-stage-data');
    const urlWithUserAndCache = bypassCache
      ? `${url}?uid=${user.uid}&_=${Date.now()}`
      : `${url}?uid=${user.uid}`;

    console.log(`Fetching two-stage data for user: ${user.uid}`);

    // Use the cache option to enable browser caching
    const response = await fetch(urlWithUserAndCache, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: bypassCache ? 'no-store' : cache,
      // Add next.js specific cache control
      next: bypassCache ? { revalidate: 0 } : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Two-stage data fetch failed:', error);
    throw error;
  }
};

/**
 * Get detailed course data (all courses with assignments)
 * This should be called after the two-stage load is cached
 * @param {Object} options - Options for the request
 * @returns {Promise<Object>} Detailed course data
 */
export const getDetailedCourseData = async (options = {}) => {
  const { cache = 'force-cache', bypassCache = false } = options;

  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add user ID and timestamp to URL to ensure unique cache per user
    const url = joinUrl(API_URL, 'courses/detailed');
    const urlWithUserAndCache = bypassCache
      ? `${url}?uid=${user.uid}&_=${Date.now()}`
      : `${url}?uid=${user.uid}`;

    console.log(`Fetching detailed course data for user: ${user.uid}`);

    // Use the cache option to enable browser caching
    const response = await fetch(urlWithUserAndCache, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: bypassCache ? 'no-store' : cache,
      // Add next.js specific cache control
      next: bypassCache ? { revalidate: 0 } : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Detailed course data fetch failed:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific assignment
 * @param {number} courseId - Course ID
 * @param {number} assignmentId - Assignment ID
 * @param {Object} options - Options for the request
 * @returns {Promise<Object>} Assignment details
 */
export const getAssignmentDetails = async (courseId, assignmentId, options = {}) => {
  const { cache = 'force-cache', bypassCache = false } = options;

  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add user ID and timestamp to URL to ensure unique cache per user
    const url = joinUrl(API_URL, `courses/${courseId}/assignments/${assignmentId}/details`);
    const urlWithUserAndCache = bypassCache
      ? `${url}?uid=${user.uid}&_=${Date.now()}`
      : `${url}?uid=${user.uid}`;

    console.log(`Fetching assignment details for user: ${user.uid}, course: ${courseId}, assignment: ${assignmentId}`);

    // Use the cache option to enable browser caching
    const response = await fetch(urlWithUserAndCache, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: bypassCache ? 'no-store' : cache,
      // Add next.js specific cache control
      next: bypassCache ? { revalidate: 0 } : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Assignment details fetch failed:', error);
    throw error;
  }
};


