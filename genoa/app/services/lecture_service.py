"""
Lecture Service Module

This module provides functionality for processing lecture audio and generating notes
using Google's Gemini multimodal model.
"""

import os
import tempfile
from typing import Dict, Any, Optional, List, BinaryIO
import base64
import google.generativeai as genai
from pydantic import BaseModel
from fastapi import UploadFile

from app.core.config import settings


class LectureService:
    """
    Service for processing lecture audio and generating notes using Gemini multimodal model.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Lecture Service with Google API key.

        Args:
            api_key: Google API key for Gemini. If not provided, uses the one from settings.
        """
        self.api_key = api_key or settings.GOOGLE_API_KEY
        if not self.api_key:
            raise ValueError("Google API key is required for Lecture Service")

        # Configure the Gemini API
        genai.configure(api_key=self.api_key)

        # Get the multimodal model
        self.model = genai.GenerativeModel('gemini-1.5-pro')

    async def process_audio(self, audio_file: UploadFile,
                           title: Optional[str] = None,
                           context: Optional[str] = None) -> Dict[str, Any]:
        """
        Process lecture audio and generate notes.

        Args:
            audio_file: The uploaded audio file
            title: Optional title of the lecture
            context: Optional context about the lecture (subject, course, etc.)

        Returns:
            Dictionary containing the generated notes and metadata
        """
        try:
            # Create a temporary file to store the uploaded audio
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1]) as temp:
                # Write the uploaded file content to the temporary file
                content = await audio_file.read()
                temp.write(content)
                temp_path = temp.name

            # Process the audio file with Gemini
            result = await self._generate_notes_from_audio(temp_path, title, context)

            # Clean up the temporary file
            os.unlink(temp_path)

            return result

        except Exception as e:
            # Clean up in case of error
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.unlink(temp_path)

            # Add more context to the error
            error_message = f"Error processing audio file: {str(e)}"
            print(f"ERROR: {error_message}")

            # Re-raise with more context
            raise Exception(error_message) from e

    async def _generate_notes_from_audio(self,
                                        audio_path: str,
                                        title: Optional[str] = None,
                                        context: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate notes from an audio file using Gemini multimodal.

        Args:
            audio_path: Path to the audio file
            title: Optional title of the lecture
            context: Optional context about the lecture

        Returns:
            Dictionary containing the generated notes and metadata
        """
        # Read the audio file
        with open(audio_path, "rb") as f:
            audio_data = f.read()

        # Prepare the prompt
        prompt_parts = []

        # Add context if provided
        if title and context:
            prompt_parts.append(f"This is a lecture titled '{title}'. Context: {context}")
        elif title:
            prompt_parts.append(f"This is a lecture titled '{title}'.")
        elif context:
            prompt_parts.append(f"This is a lecture with the following context: {context}")

        # Add instructions for note generation
        prompt_parts.append("""
        Please listen to this lecture audio and create comprehensive, well-structured notes.
        The notes should:

        1. Include a summary of the main topics and key points
        2. Be organized with clear headings and subheadings
        3. Highlight important concepts, definitions, and examples
        4. Include any formulas, equations, or specific terminology mentioned
        5. Capture the relationships between different concepts
        6. Note any assignments, deadlines, or action items mentioned

        Format the notes in Markdown for readability.
        """)

        # Add the audio data
        prompt_parts.append({
            "mime_type": f"audio/{os.path.splitext(audio_path)[1][1:]}",
            "data": base64.b64encode(audio_data).decode('utf-8')
        })

        # Generate content with Gemini
        try:
            # Try using the async version first
            response = await self.model.generate_content_async(prompt_parts)
            notes = response.text
        except AttributeError:
            # Fall back to synchronous version if async is not available
            response = self.model.generate_content(prompt_parts)
            notes = response.text

        # Create a structured response
        result = {
            "notes": notes,
            "metadata": {
                "title": title or "Untitled Lecture",
                "context": context or "No context provided",
                "model": "gemini-1.5-pro",
                "timestamp": None  # This would be filled in by the API endpoint
            }
        }

        return result
