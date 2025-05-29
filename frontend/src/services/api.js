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
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
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
      throw new Error(errorData.error || errorData.detail || `Registration failed: ${response.status}`);
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
 * Get Google OAuth token from Firebase user
 * @returns {Promise<string>} Google OAuth access token
 */
export const getGoogleOAuthToken = async () => {
  try {
    // Import the function dynamically to avoid circular dependencies
    const { useAuth } = await import('../context/AuthContext');
    const { getGoogleToken } = useAuth();

    // Get the token from the auth context
    const tokenData = await getGoogleToken();
    return tokenData.accessToken;
  } catch (error) {
    console.error('Failed to get Google OAuth token:', error);
    throw error;
  }
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
    // Get Firebase ID token for authentication
    const token = await getIdToken();
    console.log('Got ID token for authentication');

    // Try to get Google OAuth token if available
    let googleToken = null;
    let isGoogleUser = false;

    try {
      // Check if user is signed in with Google
      const user = auth.currentUser;
      if (user) {
        isGoogleUser = user.providerData.some(
          provider => provider.providerId === 'google.com'
        );
      }

      if (isGoogleUser) {
        // Get Firebase ID token for Google-authenticated user
        googleToken = await user.getIdToken(true);
        console.log('User is authenticated with Google, using Firebase ID token');
      }
    } catch (tokenError) {
      console.log('Error checking Google authentication:', tokenError.message);
      // Continue without Google token - the backend will handle this case
    }

    const requestBody = {
      user_id: userId,
      class_names: classNames,
      parent_folder_id: parentFolderId,
      google_token: googleToken, // Include Google token if available
      is_google_user: isGoogleUser // Indicate if user is authenticated with Google
    };
    console.log('Request body prepared (token details omitted)');

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

          // If we have an auth_url, open it in a new window
          if (errorData.detail.auth_url) {
            console.log('Google authentication required, opening auth URL');

            // Open the auth URL in a new window
            const authWindow = window.open(errorData.detail.auth_url, '_blank', 'width=800,height=600');

            // Throw a special error that can be handled by the caller
            throw {
              isGoogleAuthError: true,
              message: errorData.detail.message || 'Google authentication required',
              authUrl: errorData.detail.auth_url,
              authWindow: authWindow
            };
          } else {
            // If no auth_url is provided, prompt the user to sign in with Google
            throw {
              isGoogleAuthError: true,
              message: errorData.detail.message || 'Google authentication required',
              requiresGoogleSignIn: true
            };
          }
        }

        errorDetail = errorData.detail || errorData.error || `HTTP error ${response.status}`;
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
 * Get data from the two-stage endpoint
 * @returns {Promise<Object>} Two-stage data
 */
export const getTwoStageData = async () => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, 'two-stage-data');
    console.log(`Fetching two-stage data for user: ${user.uid}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Two-stage data fetch failed:', error);
    throw error;
  }
};

/**
 * Get detailed course data (all courses with assignments)
 * @returns {Promise<Object>} Detailed course data
 */
export const getDetailedCourseData = async () => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, 'courses/detailed');
    console.log(`Fetching detailed course data for user: ${user.uid}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Detailed course data fetch failed:', error);
    throw error;
  }
};

/**
 * Get announcements for a specific course
 * @param {number} courseId - Course ID
 * @returns {Promise<Object>} Course announcements data
 */
export const getCourseAnnouncements = async (courseId) => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, `courses/${courseId}/announcements`);
    console.log(`Fetching announcements for course ${courseId}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Course announcements fetch failed for course ${courseId}:`, error);
    throw error;
  }
};



/**
 * Get detailed information for a specific assignment
 * @param {number} courseId - Course ID
 * @param {number} assignmentId - Assignment ID
 * @returns {Promise<Object>} Assignment details
 */
export const getAssignmentDetails = async (courseId, assignmentId) => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, `courses/${courseId}/assignments/${assignmentId}/details`);
    console.log(`Fetching assignment details for user: ${user.uid}, course: ${courseId}, assignment: ${assignmentId}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Assignment details fetch failed:', error);
    throw error;
  }
};

/**
 * Get user's favorite courses
 * @returns {Promise<Array>} List of favorite courses
 */
export const getFavoriteCourses = async () => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, 'favorite-courses');
    console.log(`Fetching favorite courses for user: ${user.uid}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Favorite courses fetch failed:', error);
    throw error;
  }
};

/**
 * Add a course to favorites
 * @param {number} courseId - Course ID to add to favorites
 * @param {string} color - Optional color for the course
 * @returns {Promise<Object>} Result of operation
 */
export const addFavoriteCourse = async (courseId, color = null) => {
  try {
    const data = { courseId };
    if (color) {
      data.color = color;
    }

    return fetchWithAuth(joinUrl(API_URL, 'favorite-courses'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Failed to add course to favorites:', error);
    throw error;
  }
};

/**
 * Remove a course from favorites
 * @param {number} courseId - Course ID to remove from favorites
 * @returns {Promise<Object>} Result of operation
 */
export const removeFavoriteCourse = async (courseId) => {
  try {
    return fetchWithAuth(joinUrl(API_URL, `favorite-courses/${courseId}`), {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Failed to remove course from favorites:', error);
    throw error;
  }
};

/**
 * Update a favorite course's color
 * @param {number} courseId - Course ID to update
 * @param {string} color - New color for the course
 * @returns {Promise<Object>} Result of operation
 */
export const updateFavoriteCourseColor = async (courseId, color) => {
  try {
    return fetchWithAuth(joinUrl(API_URL, `favorite-courses/${courseId}/color`), {
      method: 'PATCH',
      body: JSON.stringify({ color })
    });
  } catch (error) {
    console.error('Failed to update favorite course color:', error);
    throw error;
  }
};

// ===== LECTURE NOTES API =====

/**
 * Get the lecture notes API URL
 * @returns {string} The lecture notes API URL
 */
const getLectureNotesApiUrl = () => {
  const GENOA_API_URL = process.env.NEXT_PUBLIC_GENOA_API_URL || 'http://localhost:8000/api';
  return GENOA_API_URL.endsWith('/v1') ? GENOA_API_URL : `${GENOA_API_URL}/v1`;
};

/**
 * Make an authenticated request to the lecture notes API
 * @param {string} endpoint - The endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The response data
 */
const fetchLectureNotesApi = async (endpoint, options = {}) => {
  try {
    const token = await getIdToken();
    const baseUrl = getLectureNotesApiUrl();
    const url = joinUrl(baseUrl, `lecture-notes/${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Lecture notes API request failed:', error);
    throw error;
  }
};

/**
 * Update a favorite course's display name
 * @param {number} courseId - Course ID to update
 * @param {string} displayName - New display name for the course
 * @returns {Promise<Object>} Result of operation
 */
export const updateFavoriteCourseDisplayName = async (courseId, displayName) => {
  try {
    return fetchWithAuth(joinUrl(API_URL, `favorite-courses/${courseId}/display-name`), {
      method: 'PATCH',
      body: JSON.stringify({ displayName })
    });
  } catch (error) {
    console.error('Failed to update favorite course display name:', error);
    throw error;
  }
};

/**
 * Get user's explicitly removed courses
 * @returns {Promise<Array>} List of removed course IDs
 */
export const getRemovedCourses = async () => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, 'removed-courses');
    console.log(`Fetching removed courses for user: ${user.uid}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error response:`, errorData);
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`API response data:`, result);
    return result;
  } catch (error) {
    console.error('Removed courses fetch failed:', error);
    throw error;
  }
};

/**
 * Submit an assignment
 * @param {number} courseId - Course ID
 * @param {number} assignmentId - Assignment ID
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} Submission result
 */
export const submitAssignment = async (courseId, assignmentId, submissionData) => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, `courses/${courseId}/assignments/${assignmentId}/submissions`);
    console.log(`Submitting assignment for user: ${user.uid}, course: ${courseId}, assignment: ${assignmentId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submissionData),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Assignment submission failed:', error);
    throw error;
  }
};

/**
 * Upload a file for submission
 * @param {number} courseId - Course ID
 * @param {number} assignmentId - Assignment ID
 * @param {number} userId - User ID
 * @param {File} file - File object from input
 * @returns {Promise<Object>} Upload result
 */
export const uploadSubmissionFile = async (courseId, assignmentId, userId, file) => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, `courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/files`);
    console.log(`Uploading file for submission: ${user.uid}, course: ${courseId}, assignment: ${assignmentId}`);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type header - let browser set it with boundary for FormData
      },
      body: formData,
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

/**
 * Get detailed submission information including attachments
 * @param {number} courseId - Course ID
 * @param {number} assignmentId - Assignment ID
 * @param {number} userId - User ID (defaults to 'self')
 * @returns {Promise<Object>} Detailed submission information
 */
export const getSubmissionDetails = async (courseId, assignmentId, userId = 'self') => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, `courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/details`);
    console.log(`Fetching submission details for user: ${user.uid}, course: ${courseId}, assignment: ${assignmentId}, userId: ${userId}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch submission details:', error);
    throw error;
  }
};

/**
 * Download a submitted file
 * @param {number} courseId - Course ID
 * @param {number} assignmentId - Assignment ID
 * @param {number} userId - User ID (defaults to 'self')
 * @param {number} fileId - File ID
 * @returns {Promise<Blob>} File blob for download
 */
export const downloadSubmissionFile = async (courseId, assignmentId, userId = 'self', fileId) => {
  try {
    const token = await getIdToken();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const url = joinUrl(API_URL, `courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/files/${fileId}/download`);
    console.log(`Downloading submission file for user: ${user.uid}, course: ${courseId}, assignment: ${assignmentId}, userId: ${userId}, fileId: ${fileId}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `API error: ${response.status}`);
    }

    return response.blob();
  } catch (error) {
    console.error('Failed to download submission file:', error);
    throw error;
  }
};
