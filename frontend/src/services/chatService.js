'use client';

import { auth } from '../config/firebase';

// Get the FastAPI URL from environment variables
const FASTAPI_URL = (process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000/api').replace(/\/$/, '');

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
 * Send a chat message to the Canvas AI agent
 * @param {string} message - The user's message
 * @returns {Promise<Object>} The agent's response
 */
export const sendChatMessage = async (message) => {
  try {
    const token = await getIdToken();

    const response = await fetch(`${FASTAPI_URL}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Chat API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat request failed:', error);
    throw error;
  }
};
