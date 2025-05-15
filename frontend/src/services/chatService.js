'use client';

import { auth } from '../config/firebase';

// Get the API URL from environment variables
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
    // Get the user's ID token for authentication (for future use with auth)
    await getIdToken();

    // Prepare the request body
    const requestBody = {
      message: message,
      conversation_id: conversationId
    };

    // Send the request to the new Gemini-powered chat endpoint
    // Note: Not sending auth token to FastAPI backend as it doesn't have Firebase auth
    const response = await fetch(`${GENOA_API_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

    // Send the request to the memory API
    const response = await fetch(`${GENOA_API_URL}/v1/memory/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
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

    // Send the request to the memory API
    const response = await fetch(`${GENOA_API_URL}/v1/memory/${conversationId}/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
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
