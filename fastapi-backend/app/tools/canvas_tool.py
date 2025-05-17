from typing import Dict, List, Any, Optional
import json

from app.services.canvas_service import CanvasService


class CanvasTool:
    """Tool for retrieving Canvas LMS information for the chatbot."""

    def __init__(self):
        """Initialize the Canvas tool."""
        self.canvas_service = CanvasService()

    async def get_courses(self, user_id: Optional[str] = None, id_token: Optional[str] = None) -> str:
        """
        Get courses for a user and format them for the chatbot.

        Args:
            user_id: Optional Firebase user ID
            id_token: Optional Firebase ID token (not used with Firestore)

        Returns:
            Formatted string with course information
        """
        try:
            # Get courses from Firestore first, then fall back to Canvas API if needed
            courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")

            if not courses:
                return "I couldn't find any Canvas courses. You might need to set up your Canvas credentials in Glide first."

            # Format courses for display
            response = "Here are your Canvas courses:\n\n"

            for i, course in enumerate(courses, 1):
                # Add course name and code
                response += f"**{i}. {course.get('name')}** ({course.get('course_code')})\n"

                # Add term if available
                if course.get('term'):
                    response += f"   Term: {course.get('term')}\n"

                # Add teachers if available
                if course.get('teachers'):
                    teachers = ", ".join([teacher.get('display_name') for teacher in course.get('teachers')])
                    response += f"   Instructor(s): {teachers}\n"

                # Add a separator between courses
                response += "\n"

            return response
        except Exception as e:
            print(f"Error in Canvas tool: {str(e)}")
            return "I'm sorry, I encountered an error while trying to retrieve your Canvas courses. Please try again later."

    async def handle_canvas_query(self, query: str, user_id: Optional[str] = None, id_token: Optional[str] = None) -> Optional[str]:
        """
        Handle a Canvas-related query.

        Args:
            query: The user's query
            user_id: Optional Firebase user ID
            id_token: Optional Firebase ID token (not used with Firestore)

        Returns:
            Response to the query or None if not a Canvas query
        """
        # If no user ID, we can't get Canvas data
        if not user_id:
            print("No user ID provided for Canvas query")
            return None

        # Normalize the query
        query_lower = query.lower()

        # Check if this is a query about Canvas courses
        course_keywords = [
            "canvas course", "canvas class", "my course", "my class",
            "what course", "what class", "show course", "show class",
            "list course", "list class", "all course", "all class"
        ]

        is_course_query = any(keyword in query_lower for keyword in course_keywords)

        if is_course_query:
            return await self.get_courses(user_id)

        return None
