"""
LLM agent for the Glide application.

This agent handles general queries using Gemini.
"""

from typing import Dict, Any, Optional, List
import requests
import json
import random

from app.agents.base import BaseAgent, AgentResponse
from app.core.config import settings


class LLMAgent(BaseAgent):
    """
    Agent responsible for handling general queries using Gemini.

    This agent serves as a fallback for queries that other specialized agents
    cannot handle. It uses Google's Gemini API to generate responses.
    """

    def __init__(self, system_prompt: str):
        """
        Initialize the LLM agent.

        Args:
            system_prompt: The system prompt to use for Gemini
        """
        super().__init__(name="llm")
        self.api_key = settings.GEMINI_API_KEY
        self.system_prompt = system_prompt
        self.variability_level = 0.7  # Default variability level

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required")

    def can_handle(self, message: str, context: Dict[str, Any]) -> bool:
        """
        Determine if this agent can handle the given message.

        Args:
            message: The message to check
            context: Additional context for checking

        Returns:
            True if the agent can handle the message, False otherwise
        """
        # This agent can handle any message as a fallback
        return True

    async def process(self, message: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process a message using Gemini.

        Args:
            message: The message to process
            context: Additional context for processing

        Returns:
            AgentResponse containing the Gemini response
        """
        # Get conversation history
        conversation_history = context.get("history", [])

        # Call Gemini API
        response = self._call_gemini_api(message, conversation_history)

        return {
            "content": response,
            "metadata": {},
            "handled": True
        }

    def set_variability(self, level: float) -> None:
        """
        Set the variability level for responses.

        Args:
            level: A float between 0.0 and 1.0 where higher values mean more variability
        """
        if 0.0 <= level <= 1.0:
            self.variability_level = level
        else:
            raise ValueError("Variability level must be between 0.0 and 1.0")

    def _enhance_system_prompt(self) -> str:
        """
        Enhance the system prompt with instructions for response variability.

        Returns:
            Enhanced system prompt
        """
        variability_instruction = """
        IMPORTANT INSTRUCTION FOR RESPONSE STYLE:
        Please vary your response style and wording. Don't use the same phrases repeatedly.
        Use different sentence structures, vocabulary, and expressions while maintaining the same meaning.
        Avoid starting responses the same way each time.
        """

        return f"{self.system_prompt}\n\n{variability_instruction}"

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

            # Get enhanced system prompt with variability instructions
            enhanced_prompt = self._enhance_system_prompt()

            # Format conversation history for the API
            formatted_history = [
                # Always include system prompt as the first message
                {
                    "role": "user",
                    "parts": [{"text": enhanced_prompt}]
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
                    # Adjust temperature based on variability level
                    temperature = min(0.9, max(0.5, self.variability_level))

                    # Adjust topP and topK based on variability level
                    top_p = min(0.98, max(0.8, 0.85 + self.variability_level * 0.15))
                    top_k = int(min(60, max(20, 20 + self.variability_level * 40)))

                    payload = {
                        "contents": formatted_history + [
                            {
                                "role": "user",
                                "parts": [{"text": message}]
                            }
                        ],
                        "generationConfig": {
                            "temperature": temperature,
                            "topP": top_p,
                            "topK": top_k,
                            "maxOutputTokens": 1024
                        }
                    }

                    # Make the API request
                    response = requests.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        data=json.dumps(payload)
                    )

                    # Check if the request was successful
                    if response.status_code == 200:
                        response_json = response.json()

                        # Extract the response text
                        if "candidates" in response_json and len(response_json["candidates"]) > 0:
                            candidate = response_json["candidates"][0]
                            if "content" in candidate and "parts" in candidate["content"]:
                                parts = candidate["content"]["parts"]
                                if len(parts) > 0 and "text" in parts[0]:
                                    return parts[0]["text"]

                        # If we couldn't extract the text, return the raw response
                        return f"Error: Could not extract response text from API response: {response_json}"
                    else:
                        print(f"Error with model {model_name}: {response.status_code} - {response.text}")
                        # Try the next model
                        continue

                except Exception as e:
                    print(f"Error with model {model_name}: {str(e)}")
                    # Try the next model
                    continue

            # If all models failed, return a varied error message
            return self._get_varied_error_message("connection")

        except Exception as e:
            print(f"Error calling Gemini API: {str(e)}")
            return self._get_varied_error_message("processing")

    def _get_varied_error_message(self, error_type: str) -> str:
        """
        Get a varied error message based on the error type.

        Args:
            error_type: The type of error (connection, processing, etc.)

        Returns:
            A varied error message
        """
        connection_errors = [
            "I'm sorry, I'm having trouble connecting to my language model right now. Please try again later.",
            "It seems I can't reach my language model at the moment. Could you try again in a bit?",
            "I'm experiencing connection issues with my backend services. Please try again shortly.",
            "My connection to the language model is temporarily unavailable. Please try again soon.",
            "I apologize, but I'm having difficulty connecting to my language services. Could we try again in a moment?"
        ]

        processing_errors = [
            "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
            "I couldn't process that request properly. Could you try again?",
            "Something went wrong while processing your request. Let's try again in a moment.",
            "I encountered an issue while working on your request. Please try again shortly.",
            "I apologize, but I couldn't complete that task. Could we try again?"
        ]

        if error_type == "connection":
            return random.choice(connection_errors)
        elif error_type == "processing":
            return random.choice(processing_errors)
        else:
            return "I'm sorry, something went wrong. Please try again later."
