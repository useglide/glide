from typing import List, Optional, Dict, Any
import uuid
import requests
import json
import os

from app.core.config import settings
from app.models.chat import ChatMessage

# In-memory conversation storage (for simplicity)
# In a production environment, this should be replaced with a database
conversation_history: Dict[str, List[Dict[str, str]]] = {}

class ChatService:
    """Service for handling chat interactions with Gemini."""

    def __init__(self):
        """Initialize the chat service with Gemini model."""
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required")

        # System prompt for Gemini
        self.system_prompt = """
        You are Genoa, an AI Assistant powered by Google's Gemini Pro. You are helpful, friendly, and knowledgeable.

        You can answer questions on a wide range of topics, including but not limited to:
        - General knowledge and facts
        - Current events (up to your training cutoff)
        - Science and technology
        - Arts and culture
        - History and geography
        - Math and logic problems

        You can also help with:
        - Creative writing and brainstorming
        - Explaining complex concepts in simple terms
        - Providing balanced perspectives on various topics

        When appropriate, you can mention that Glide is a Canvas LMS integration that helps students manage their courses, assignments, and grades.

        Be helpful, concise, and friendly in your responses.
        If you don't know something, be honest about it.
        """

    def _get_or_create_history(self, conversation_id: Optional[str] = None) -> tuple[str, List[Dict[str, str]]]:
        """Get or create a conversation history."""
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        if conversation_id not in conversation_history:
            # Initialize with system prompt
            conversation_history[conversation_id] = [
                {"role": "system", "content": self.system_prompt}
            ]

        return conversation_id, conversation_history[conversation_id]

    def _call_gemini_api(self, message: str, conversation_history: List[Dict[str, str]]) -> str:
        """
        Call the Gemini API directly using the REST API.

        Args:
            message: The user's message
            conversation_history: The conversation history

        Returns:
            The AI's response
        """
        try:
            # Try different model names if one fails
            model_names = [
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro-latest",
                "gemini-pro",
                "gemini-1.0-pro"
            ]

            # Format conversation history for the API
            formatted_history = []

            # Add previous messages (skip system prompt)
            for msg in conversation_history[1:]:
                if msg["role"] == "user":
                    formatted_history.append({
                        "role": "user",
                        "parts": [{"text": msg["content"]}]
                    })
                elif msg["role"] == "assistant":
                    formatted_history.append({
                        "role": "model",
                        "parts": [{"text": msg["content"]}]
                    })

            # Try each model until one works
            for model_name in model_names:
                try:
                    # Prepare the API URL
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"

                    # Prepare the request payload
                    payload = {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [{"text": f"{self.system_prompt}\n\n{message}"}]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.7,
                            "topP": 0.95,
                            "topK": 40,
                            "maxOutputTokens": 1024
                        }
                    }

                    # If we have conversation history, use it
                    if formatted_history:
                        payload = {
                            "contents": formatted_history + [
                                {
                                    "role": "user",
                                    "parts": [{"text": message}]
                                }
                            ],
                            "generationConfig": {
                                "temperature": 0.7,
                                "topP": 0.95,
                                "topK": 40,
                                "maxOutputTokens": 1024
                            }
                        }

                    # Make the API request
                    response = requests.post(url, json=payload)

                    # Check if the request was successful
                    if response.status_code == 200:
                        # Parse the response
                        response_data = response.json()

                        # Log success with model name
                        print(f"Successfully used model: {model_name}")

                        # Extract the generated text
                        if "candidates" in response_data and len(response_data["candidates"]) > 0:
                            candidate = response_data["candidates"][0]
                            if "content" in candidate and "parts" in candidate["content"]:
                                return candidate["content"]["parts"][0]["text"]

                    # If we get here, this model didn't work
                    print(f"Model {model_name} failed with status {response.status_code}: {response.text}")

                except Exception as e:
                    print(f"Error with model {model_name}: {str(e)}")
                    continue

            # If all models failed, return a fallback response
            return "I'm sorry, I'm having trouble connecting to my AI services right now. Please try again later."

        except Exception as e:
            print(f"Error calling Gemini API: {str(e)}")
            return "I'm sorry, I encountered an error while processing your request. Please try again later."

    def process_message(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        history: Optional[List[ChatMessage]] = None
    ) -> Dict[str, str]:
        """
        Process a user message and return the AI response.

        Args:
            message: The user's message
            conversation_id: Optional conversation ID for context
            history: Optional conversation history

        Returns:
            Dict containing the AI response and conversation ID
        """
        try:
            # Get or create conversation history
            conversation_id, messages = self._get_or_create_history(conversation_id)

            # If history is provided, use it instead of the stored history
            if history:
                messages = [{"role": "system", "content": self.system_prompt}]
                for msg in history:
                    messages.append({"role": msg.role, "content": msg.content})

            # Add the user message to history
            messages.append({"role": "user", "content": message})

            # Call the Gemini API
            ai_response = self._call_gemini_api(message, messages)

            # Add the AI response to history
            messages.append({"role": "assistant", "content": ai_response})

            # Update the conversation history
            conversation_history[conversation_id] = messages

            return {
                "response": ai_response,
                "conversation_id": conversation_id
            }
        except Exception as e:
            # Log the error
            print(f"Error in chat service: {str(e)}")
            raise
