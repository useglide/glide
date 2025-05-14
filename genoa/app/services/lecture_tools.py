"""
Lecture Tools Module

This module provides LangChain tools for processing lecture audio and generating notes
using Google's Gemini multimodal model.
"""

from typing import Dict, Any, List
from langchain.tools import Tool
from app.services.lecture_service import LectureService

class LectureTools:
    """
    A class that provides LangChain tools for processing lecture audio and generating notes.
    These tools can be used by the AI agent to process lecture recordings.
    """

    def __init__(self, lecture_service: LectureService):
        """
        Initialize the Lecture tools with a Lecture service instance.

        Args:
            lecture_service: An instance of LectureService
        """
        self.lecture_service = lecture_service
    
    def get_tools(self) -> List[Tool]:
        """
        Get a list of LangChain tools for processing lecture audio.

        Returns:
            A list of LangChain Tool objects
        """
        return [
            Tool(
                name="process_lecture_audio",
                func=lambda x: "This tool requires direct API access. Please use the /lecture-notes page to upload and process lecture audio.",
                description="Process lecture audio and generate notes. This tool requires direct API access and cannot be used through the chat interface. Direct users to the /lecture-notes page."
            ),
            Tool(
                name="explain_lecture_notes_tool",
                func=lambda: self._explain_lecture_notes_tool(),
                description="Explain how to use the lecture notes tool to process lecture recordings."
            )
        ]
    
    def _explain_lecture_notes_tool(self) -> Dict[str, Any]:
        """
        Provide information about how to use the lecture notes tool.
        
        Returns:
            A dictionary with information about the lecture notes tool
        """
        return {
            "tool_name": "Lecture Notes Generator",
            "description": "A tool that uses Gemini multimodal AI to listen to lecture recordings and generate comprehensive notes.",
            "capabilities": [
                "Process audio recordings of lectures (MP3, WAV, OGG, FLAC, M4A formats)",
                "Generate structured, comprehensive notes with headings and subheadings",
                "Identify key concepts, definitions, and examples from the lecture",
                "Capture formulas, equations, and specific terminology",
                "Note any assignments or deadlines mentioned"
            ],
            "how_to_use": [
                "Go to the /lecture-notes page in your browser",
                "Upload your lecture audio recording",
                "Optionally provide a title and context for better results",
                "Click 'Generate Notes' and wait for processing to complete",
                "View, copy, or download the generated notes in Markdown format"
            ],
            "limitations": [
                "Processing time depends on the length of the audio",
                "Audio quality affects the accuracy of the notes",
                "Currently supports English language lectures only",
                "Maximum file size: 100MB"
            ]
        }
