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
 * Send a message to the chat API
 * @param {string} message - The message to send
 * @param {string} conversationId - The conversation ID (optional)
 * @returns {Promise<Object>} The response from the API
 */
export const sendChatMessage = async (message, conversationId = null) => {
  try {
    // Get the user's ID token for authentication
    let token = null;
    try {
      token = await getIdToken();
    } catch (error) {
      console.warn('User not authenticated, proceeding without token');
    }

    // Prepare the request body
    const requestBody = {
      message: message,
      conversation_id: conversationId
    };

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Send the request to the Gemini-powered chat endpoint
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error('Chat endpoint failed:', response.status);

      // Return a friendly error message
      return {
        response: "I'm sorry, I'm having trouble connecting to my backend services right now. Please try again in a moment.",
        conversation_id: conversationId || "error"
      };
    }

    // Parse the response data
    const data = await response.json();

    // Return in the format expected by the chat panel
    return {
      response: data.response,
      conversation_id: data.conversation_id || conversationId || "simple-chat"
    };
  } catch (error) {
    console.error('Chat API request failed:', error);
    // Return a friendly error message instead of throwing
    return {
      response: "I'm sorry, I encountered an error while processing your request. Please try again later.",
      conversation_id: conversationId || "error"
    };
  }
};

/**
 * Get the chat history for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} The chat history
 */
export const getChatHistory = async (conversationId) => {
  try {
    // Check if we have a conversation ID
    if (!conversationId) {
      console.warn('No conversation ID provided for chat history');
      return { messages: [] };
    }

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

    // Send the request to the memory API
    const response = await fetch(`${API_URL}/memory/${conversationId}`, {
      method: 'GET',
      headers: headers
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Memory API error:', errorData.detail || response.status);
      return { messages: [] };
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error('Memory API request failed:', error);
    // Return empty history on error
    return { messages: [] };
  }
};

/**
 * Clear the chat history for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} The response from the API
 */
export const clearChatHistory = async (conversationId) => {
  try {
    // Check if we have a conversation ID
    if (!conversationId) {
      console.warn('No conversation ID provided for clearing chat history');
      return { success: true };
    }

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

    // Send the request to the memory API
    const response = await fetch(`${API_URL}/memory/${conversationId}/clear`, {
      method: 'POST',
      headers: headers
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Memory API error:', errorData.detail || response.status);
      return { success: false };
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error('Memory API request failed:', error);
    // Return success on error to avoid breaking the UI
    return { success: true };
  }
};
