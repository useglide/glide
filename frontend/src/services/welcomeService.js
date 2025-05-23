'use client';

import { auth } from '../config/firebase';

// Get the API URL from environment variables
const GENOA_API_URL = process.env.NEXT_PUBLIC_GENOA_API_URL || 'http://localhost:8000/api';
// Make sure we're using the correct API version path
const API_URL = GENOA_API_URL.endsWith('/v1') ? GENOA_API_URL : `${GENOA_API_URL}/v1`;

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
 * Get a personalized welcome message from the API
 * @param {string} cacheParam - Optional cache-busting parameter
 * @returns {Promise<string>} The welcome message
 */
export const getWelcomeMessage = async (cacheParam = '') => {
  try {
    // Get the user's ID token for authentication
    let token = null;
    try {
      token = await getIdToken();
    } catch (error) {
      console.warn('User not authenticated, proceeding without token');
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Send the request to the welcome message endpoint with cache-busting parameter
    const url = cacheParam ? `${API_URL}/welcome/message?${cacheParam}` : `${API_URL}/welcome/message`;
    console.log('Fetching welcome message from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      cache: 'no-store' // Ensure we don't use cached responses
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error('Welcome message endpoint failed:', response.status);

      // Return a default message on error
      return "Hi there! I'm your Glide Assistant. How can I help you today?";
    }

    // Parse the response data
    const data = await response.json();

    // Log the welcome message for debugging
    console.log('Welcome message from API:', data.message);

    // Return the welcome message
    return data.message;
  } catch (error) {
    console.error('Failed to get welcome message:', error);

    // Return a default message on error
    return "Hi there! I'm your Glide Assistant. How can I help you today?";
  }
};
