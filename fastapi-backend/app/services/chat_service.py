from typing import List, Optional, Dict, Any
import uuid
import requests
import json
import os

from app.core.config import settings
from app.models.chat import ChatMessage
from app.tools.canvas_tool import CanvasTool

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
        You are Genoa, an AI Assistant powered by Google's Gemini Pro. You are helpful, friendly, and knowledgeable, with a personality similar to Jarvis from Marvel.

        IMPORTANT: When asked about your name, identity, or what you are, ALWAYS respond that you are "Genoa, an AI Assistant powered by Google's Gemini Pro." Never say you don't have a name or identity.

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

        Glide is a Canvas LMS integration that helps students manage their courses, assignments, and grades.
        You can help users with information about their Canvas courses when they ask questions like:
        - "What are my Canvas classes?"
        - "Show me my courses"
        - "List my current classes"

        Be helpful, concise, and friendly in your responses.
        If you don't know something, be honest about it.
        """

        # Initialize Canvas tool
        self.canvas_tool = CanvasTool()

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
            formatted_history = [
                # Always include system prompt as the first message
                {
                    "role": "user",
                    "parts": [{"text": self.system_prompt}]
                },
                {
                    "role": "model",
                    "parts": [{"text": "I am Genoa, an AI Assistant powered by Google's Gemini Pro. I'll help you with your questions."}]
                }
            ]

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

                    # Always use formatted history with the system prompt
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

    def _is_identity_question(self, message: str) -> bool:
        """
        Check if the message is asking about the AI's identity or name.

        Args:
            message: The user's message

        Returns:
            True if the message is asking about identity, False otherwise
        """
        message_lower = message.lower()
        identity_keywords = [
            "what is your name", "who are you", "what are you",
            "what should i call you", "do you have a name",
            "what's your name", "your name", "your identity",
            "what are you called", "introduce yourself"
        ]

        return any(keyword in message_lower for keyword in identity_keywords)

    def _get_identity_response(self) -> str:
        """
        Get a consistent response for identity questions.

        Returns:
            A response about the AI's identity
        """
        return "I am Genoa, an AI Assistant powered by Google's Gemini Pro. I'm here to help answer your questions and assist with your Canvas courses through the Glide application."

    async def process_message(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        history: Optional[List[ChatMessage]] = None,
        user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Process a user message and return the AI response.

        Args:
            message: The user's message
            conversation_id: Optional conversation ID for context
            history: Optional conversation history
            user: Optional user information from Firebase

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

            # Check if this is an identity question
            if self._is_identity_question(message):
                ai_response = self._get_identity_response()
            else:
                # Check if this is a Canvas-related query
                user_id = user.get("uid") if user else None
                id_token = user.get("token") if user else None
                canvas_response = await self.canvas_tool.handle_canvas_query(message, user_id, id_token)

                if canvas_response:
                    ai_response = canvas_response
                else:
                    # Call the Gemini API for non-Canvas queries
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
