'use client';

import { auth } from '../config/firebase';

// Get the API URL from environment variables
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const GENOA_API_URL = process.env.NEXT_PUBLIC_GENOA_API_URL || 'http://localhost:8000/api';

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
 * Send a message to the chat API
 * @param {string} message - The message to send
 * @param {string} conversationId - The conversation ID (optional)
 * @returns {Promise<Object>} The response from the API
 */
export const sendChatMessage = async (message, conversationId = null) => {
  try {
    // Get the user's ID token for authentication
    const token = await getIdToken();

    // Prepare the request body
    const requestBody = {
      query: message,
      conversation_id: conversationId
    };

    // Send the request to the Genoa chat API
    const response = await fetch(`${GENOA_API_URL}/chat/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Chat API error: ${response.status}`);
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error('Chat API request failed:', error);
    throw error;
  }
};

/**
 * Get the chat history for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} The chat history
 */
export const getChatHistory = async (conversationId) => {
  try {
    // Get the user's ID token for authentication
    const token = await getIdToken();

    // Send the request to the Genoa memory API
    const response = await fetch(`${GENOA_API_URL}/memory/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Memory API error: ${response.status}`);
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error('Memory API request failed:', error);
    throw error;
  }
};

/**
 * Clear the chat history for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} The response from the API
 */
export const clearChatHistory = async (conversationId) => {
  try {
    // Get the user's ID token for authentication
    const token = await getIdToken();

    // Send the request to the Genoa memory API
    const response = await fetch(`${GENOA_API_URL}/memory/${conversationId}/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Memory API error: ${response.status}`);
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error('Memory API request failed:', error);
    throw error;
  }
};
