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
 * Get data from the two-stage endpoint with browser caching
 * @param {Object} options - Options for the request
 * @returns {Promise<Object>} Two-stage data
 */
export const getTwoStageData = async (options = {}) => {
  const { cache = 'force-cache', bypassCache = false } = options;

  try {
    const token = await getIdToken();

    // Add a cache buster parameter if bypassCache is true
    const url = joinUrl(API_URL, 'two-stage-data');
    const urlWithCacheBuster = bypassCache
      ? `${url}?_=${Date.now()}`
      : url;

    // Use the cache option to enable browser caching
    const response = await fetch(urlWithCacheBuster, {
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

    // Add a cache buster parameter if bypassCache is true
    const url = joinUrl(API_URL, 'courses/detailed');
    const urlWithCacheBuster = bypassCache
      ? `${url}?_=${Date.now()}`
      : url;

    // Use the cache option to enable browser caching
    const response = await fetch(urlWithCacheBuster, {
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
