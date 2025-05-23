"""
Canvas data agent for the Glide application.

This specialized agent handles detailed Canvas LMS data retrieval and presentation.
"""

from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import re

from app.agents.base import BaseAgent, AgentResponse
from app.services.canvas_service import CanvasService


class CanvasDataAgent(BaseAgent):
    """
    Consolidated agent responsible for all Canvas LMS integration and data retrieval.

    This agent combines the functionality of the previous Canvas Agent and Canvas Data Agent
    to provide a single interface for all Canvas-related operations.

    This agent can:
    1. Access course syllabi and important dates
    2. Retrieve current and upcoming assignments with due dates
    3. Get course schedules and meeting times
    4. Provide instructor information and office hours
    5. Retrieve grade information and feedback
    6. Get course announcements and updates
    7. List all current courses
    8. Search for specific information within course materials
    9. Summarize upcoming deadlines across all courses
    """

    def __init__(self):
        """Initialize the Canvas data agent."""
        super().__init__(name="canvas_data")
        self.canvas_service = CanvasService()

        # Keywords that indicate a Canvas data-related query
        # Merged with keywords from Canvas Agent to ensure complete coverage
        self.course_info_keywords = [
            "course info", "course details", "class info", "class details",
            "syllabus", "course syllabus", "class syllabus", "important dates",
            "course schedule", "class schedule", "meeting time", "meeting schedule",
            "when is class", "when does class meet", "course calendar",
            # Added from Canvas Agent
            "canvas course", "canvas class", "my course", "my class",
            "what course", "what class", "show course", "show class",
            "list course", "list class", "all course", "all class"
        ]

        self.instructor_keywords = [
            "instructor", "professor", "teacher", "faculty",
            "office hours", "contact professor", "contact instructor",
            "email professor", "email instructor", "teacher contact"
        ]

        self.assignment_keywords = [
            "assignment", "homework", "due", "deadline", "submit",
            "upcoming assignment", "assignment due", "next assignment",
            "upcoming deadline", "what's due", "what is due", "when is due",
            # Added from Canvas Agent
            "canvas assignment", "my assignment"
        ]

        self.grade_keywords = [
            "grade", "score", "mark", "point", "feedback",
            "how am i doing", "performance", "assessment",
            "my grade", "current grade", "final grade", "grade report",
            # Added from Canvas Agent
            "canvas grade"
        ]

        self.announcement_keywords = [
            "announcement", "update", "news", "notification",
            "course announcement", "class announcement", "recent announcement",
            "latest update", "course update", "class update"
        ]

        self.search_keywords = [
            "search", "find", "look for", "locate",
            "search for", "find information", "search course", "search class"
        ]

        self.summary_keywords = [
            "summary", "summarize", "overview", "digest",
            "upcoming", "what's coming", "what is coming", "next week",
            "this week", "deadlines", "all deadlines", "all assignments"
        ]

    def can_handle(self, message: str, context: Dict[str, Any]) -> bool:
        """
        Determine if this agent can handle the given message.

        Args:
            message: The message to check
            context: Additional context for checking

        Returns:
            True if the agent can handle the message, False otherwise
        """
        # Check if user is authenticated
        user_id = context.get("user", {}).get("uid")
        if not user_id:
            return False

        # Normalize the message
        message_lower = message.lower()

        # Check if this is a Canvas data-related query
        is_course_info_query = any(keyword in message_lower for keyword in self.course_info_keywords)
        is_instructor_query = any(keyword in message_lower for keyword in self.instructor_keywords)
        is_assignment_query = any(keyword in message_lower for keyword in self.assignment_keywords)
        is_grade_query = any(keyword in message_lower for keyword in self.grade_keywords)
        is_announcement_query = any(keyword in message_lower for keyword in self.announcement_keywords)
        is_search_query = any(keyword in message_lower for keyword in self.search_keywords)
        is_summary_query = any(keyword in message_lower for keyword in self.summary_keywords)

        return (
            is_course_info_query or is_instructor_query or is_assignment_query or
            is_grade_query or is_announcement_query or is_search_query or is_summary_query
        )

    async def process(self, message: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process a Canvas data-related message.

        Args:
            message: The message to process
            context: Additional context for processing

        Returns:
            AgentResponse containing the Canvas data information
        """
        try:
            # Get user information
            user_id = context.get("user", {}).get("uid")
            id_token = context.get("user", {}).get("token")

            if not user_id:
                return {
                    "content": "You need to be logged in to access Canvas information.",
                    "metadata": {},
                    "handled": False
                }

            # Normalize the message
            message_lower = message.lower()

            # Extract course identifier if present
            course_id, course_name = self._extract_course_identifier(message_lower)

            # Handle different types of queries
            if any(keyword in message_lower for keyword in self.course_info_keywords):
                return await self._handle_course_info_query(user_id, message_lower, course_id, course_name)
            elif any(keyword in message_lower for keyword in self.instructor_keywords):
                return await self._handle_instructor_query(user_id, message_lower, course_id, course_name)
            elif any(keyword in message_lower for keyword in self.assignment_keywords):
                return await self._handle_assignment_query(user_id, message_lower, course_id, course_name)
            elif any(keyword in message_lower for keyword in self.grade_keywords):
                return await self._handle_grade_query(user_id, message_lower, course_id, course_name)
            elif any(keyword in message_lower for keyword in self.announcement_keywords):
                return await self._handle_announcement_query(user_id, message_lower, course_id, course_name)
            elif any(keyword in message_lower for keyword in self.search_keywords):
                return await self._handle_search_query(user_id, message_lower)
            elif any(keyword in message_lower for keyword in self.summary_keywords):
                return await self._handle_summary_query(user_id, message_lower)
            else:
                # Fallback for other Canvas data-related queries
                return {
                    "content": "I'm not sure how to handle that Canvas request. Try asking about course information, instructors, assignments, grades, or announcements.",
                    "metadata": {},
                    "handled": False
                }
        except Exception as e:
            print(f"Error in Canvas data agent: {str(e)}")
            # Return a graceful error message
            return {
                "content": "I'm sorry, I encountered an issue while trying to access your Canvas information. Please try again later.",
                "metadata": {},
                "handled": True  # Mark as handled to prevent fallback to other agents
            }

    def _extract_course_identifier(self, message: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Extract course identifier (ID or name) from the message.

        Args:
            message: The message to extract from

        Returns:
            Tuple of (course_id, course_name) if found, (None, None) otherwise
        """
        # Try to extract course ID (numeric)
        course_id_match = re.search(r'course\s+(\d+)', message)
        if course_id_match:
            return course_id_match.group(1), None

        # Try to extract course name
        course_name_match = re.search(r'for\s+([a-zA-Z0-9\s]+(?:101|201|301|401|I{1,3}|IV|V?I{0,3}))', message)
        if course_name_match:
            return None, course_name_match.group(1).strip()

        return None, None

    async def _handle_course_info_query(
        self, user_id: str, message: str, course_id: Optional[str], course_name: Optional[str]
    ) -> AgentResponse:
        """
        Handle queries about course information, syllabi, and schedules.

        Args:
            user_id: The user ID
            message: The original message
            course_id: Optional course ID
            course_name: Optional course name

        Returns:
            AgentResponse with course information
        """
        try:
            # Get courses from Firestore
            courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")

            if not courses:
                return {
                    "content": "I couldn't find any Canvas courses. You might need to set up your Canvas credentials in Glide first.",
                    "metadata": {},
                    "handled": True
                }

            # If course ID or name is provided, filter courses
            target_course = None
            if course_id:
                target_course = next((c for c in courses if str(c.get("id")) == course_id), None)
            elif course_name:
                # Try to find a course with a similar name
                for course in courses:
                    if course_name.lower() in course.get("name", "").lower() or course_name.lower() in course.get("course_code", "").lower():
                        target_course = course
                        break

            # If we found a specific course, get detailed information
            if target_course:
                # Get syllabus if available
                syllabus = "No syllabus information available."
                if "syllabus" in message:
                    try:
                        # Fetch the syllabus from Canvas API
                        course_id = str(target_course.get("id"))
                        syllabus_data = await self.canvas_service.get_course_syllabus(user_id, course_id)
                        if "error" not in syllabus_data:
                            syllabus = syllabus_data.get("syllabus_body", "No syllabus information available.")
                        else:
                            syllabus = f"Could not retrieve syllabus: {syllabus_data.get('error')}"
                    except Exception as e:
                        print(f"Error getting syllabus: {str(e)}")

                # Format course information
                response = f"**Course Information: {target_course.get('name')}** ({target_course.get('course_code')})\n\n"

                # Add term if available
                if target_course.get('term'):
                    response += f"**Term:** {target_course.get('term')}\n\n"

                # Add teachers if available
                if target_course.get('teachers'):
                    teachers = ", ".join([teacher.get('display_name') for teacher in target_course.get('teachers')])
                    response += f"**Instructor(s):** {teachers}\n\n"

                # Add course schedule if available
                if "schedule" in message or "meeting" in message:
                    response += "**Course Schedule:**\n"
                    response += "Course schedule information is not currently available through the API.\n\n"

                # Add syllabus if requested
                if "syllabus" in message:
                    response += "**Syllabus:**\n"
                    response += f"{syllabus}\n\n"

                # Add important dates if requested
                if "important date" in message:
                    response += "**Important Dates:**\n"
                    response += "Important dates information is not currently available through the API.\n\n"

                return {
                    "content": response,
                    "metadata": {"course": target_course},
                    "handled": True
                }
            else:
                # List all courses
                response = "Here are your current Canvas courses:\n\n"

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

                response += "You can ask for more details about a specific course by including the course name in your question."

                return {
                    "content": response,
                    "metadata": {"courses": courses},
                    "handled": True
                }
        except Exception as e:
            print(f"Error handling course info query: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue while trying to retrieve course information. Please try again later.",
                "metadata": {},
                "handled": True
            }

    async def _handle_instructor_query(
        self, user_id: str, message: str, course_id: Optional[str], course_name: Optional[str]
    ) -> AgentResponse:
        """
        Handle queries about instructors and office hours.

        Args:
            user_id: The user ID
            message: The original message
            course_id: Optional course ID
            course_name: Optional course name

        Returns:
            AgentResponse with instructor information
        """
        try:
            # Get courses from Firestore
            courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")

            if not courses:
                return {
                    "content": "I couldn't find any Canvas courses. You might need to set up your Canvas credentials in Glide first.",
                    "metadata": {},
                    "handled": True
                }

            # If course ID or name is provided, filter courses
            target_course = None
            if course_id:
                target_course = next((c for c in courses if str(c.get("id")) == course_id), None)
            elif course_name:
                # Try to find a course with a similar name
                for course in courses:
                    if course_name.lower() in course.get("name", "").lower() or course_name.lower() in course.get("course_code", "").lower():
                        target_course = course
                        break

            # If we found a specific course, get instructor information
            if target_course:
                # Format instructor information
                response = f"**Instructor Information for {target_course.get('name')}** ({target_course.get('course_code')})\n\n"

                # Add teachers if available
                if target_course.get('teachers'):
                    for i, teacher in enumerate(target_course.get('teachers'), 1):
                        response += f"**Instructor {i}: {teacher.get('display_name')}**\n"

                        # Add email if available
                        if teacher.get('email'):
                            response += f"Email: {teacher.get('email')}\n"

                        # Add office hours if available (placeholder)
                        if "office hour" in message:
                            response += "Office Hours: Information not available through the API.\n"

                        response += "\n"
                else:
                    response += "No instructor information is available for this course.\n"

                # Add note about contacting instructors
                response += "\nYou can usually contact instructors through Canvas messages or by email."

                return {
                    "content": response,
                    "metadata": {"course": target_course},
                    "handled": True
                }
            else:
                # List all instructors across courses
                response = "Here are the instructors for your current Canvas courses:\n\n"

                for i, course in enumerate(courses, 1):
                    # Add course name and code
                    response += f"**{i}. {course.get('name')}** ({course.get('course_code')})\n"

                    # Add teachers if available
                    if course.get('teachers'):
                        teachers = ", ".join([teacher.get('display_name') for teacher in course.get('teachers')])
                        response += f"   Instructor(s): {teachers}\n"
                    else:
                        response += "   No instructor information available\n"

                    # Add a separator between courses
                    response += "\n"

                response += "You can ask for more details about a specific instructor by including the course name in your question."

                return {
                    "content": response,
                    "metadata": {"courses": courses},
                    "handled": True
                }
        except Exception as e:
            print(f"Error handling instructor query: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue while trying to retrieve instructor information. Please try again later.",
                "metadata": {},
                "handled": True
            }

    async def _handle_assignment_query(
        self, user_id: str, message: str, course_id: Optional[str], course_name: Optional[str]
    ) -> AgentResponse:
        """
        Handle queries about assignments and due dates.

        Args:
            user_id: The user ID
            message: The original message
            course_id: Optional course ID
            course_name: Optional course name

        Returns:
            AgentResponse with assignment information
        """
        try:
            # Get upcoming assignments from Firestore
            assignments = await self.canvas_service.get_upcoming_assignments_from_firestore(user_id)

            if not assignments:
                return {
                    "content": "I couldn't find any upcoming assignments for you. If you've recently added assignments in Canvas, they may take a few minutes to sync.",
                    "metadata": {},
                    "handled": True
                }

            # Sort assignments by due date
            assignments.sort(
                key=lambda a: datetime.fromisoformat(a.get("due_at", "9999-12-31T23:59:59").replace('Z', '+00:00'))
            )

            # If course ID or name is provided, filter assignments
            if course_id or course_name:
                # Get courses first to match course name to ID
                courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")

                target_course_id = None
                if course_id:
                    target_course_id = course_id
                elif course_name and courses:
                    # Try to find a course with a similar name
                    for course in courses:
                        if course_name.lower() in course.get("name", "").lower() or course_name.lower() in course.get("course_code", "").lower():
                            target_course_id = str(course.get("id"))
                            break

                if target_course_id:
                    # Filter assignments by course ID
                    filtered_assignments = [a for a in assignments if str(a.get("course_id")) == target_course_id]

                    if not filtered_assignments:
                        return {
                            "content": f"I couldn't find any upcoming assignments for that specific course. Try asking about all your assignments instead.",
                            "metadata": {},
                            "handled": True
                        }

                    assignments = filtered_assignments

            # Format assignments for display
            response = "Here are your upcoming assignments:\n\n"

            # Group assignments by course
            assignments_by_course = {}
            for assignment in assignments:
                course_id = assignment.get("course_id")
                if course_id not in assignments_by_course:
                    assignments_by_course[course_id] = []
                assignments_by_course[course_id].append(assignment)

            # Format assignments by course
            for course_id, course_assignments in assignments_by_course.items():
                # Get course name from first assignment
                course_name = course_assignments[0].get("course_name", "Unknown Course")
                response += f"**{course_name}**\n"

                # Add assignments for this course
                for assignment in course_assignments:
                    # Format due date
                    due_date = datetime.fromisoformat(assignment.get("due_at", "").replace('Z', '+00:00'))
                    due_date_str = due_date.strftime("%A, %B %d at %I:%M %p")

                    # Add assignment details
                    response += f"- {assignment.get('name')}\n"
                    response += f"  Due: {due_date_str}\n"

                # Add separator between courses
                response += "\n"

            return {
                "content": response,
                "metadata": {"assignments": assignments},
                "handled": True
            }
        except Exception as e:
            print(f"Error handling assignment query: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue while trying to retrieve assignment information. Please try again later.",
                "metadata": {},
                "handled": True
            }

    async def _handle_grade_query(
        self, user_id: str, message: str, course_id: Optional[str], course_name: Optional[str]
    ) -> AgentResponse:
        """
        Handle queries about grades and feedback.

        Args:
            user_id: The user ID
            message: The original message
            course_id: Optional course ID
            course_name: Optional course name

        Returns:
            AgentResponse with grade information
        """
        try:
            # Get courses from Firestore
            courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")

            if not courses:
                return {
                    "content": "I couldn't find any Canvas courses. You might need to set up your Canvas credentials in Glide first.",
                    "metadata": {},
                    "handled": True
                }

            # If course ID or name is provided, filter courses
            target_course = None
            if course_id:
                target_course = next((c for c in courses if str(c.get("id")) == course_id), None)
            elif course_name:
                # Try to find a course with a similar name
                for course in courses:
                    if course_name.lower() in course.get("name", "").lower() or course_name.lower() in course.get("course_code", "").lower():
                        target_course = course
                        break

            # If we found a specific course, get grade information
            if target_course:
                course_id = str(target_course.get("id"))
                grade_data = await self.canvas_service.get_detailed_grades(user_id, course_id)

                if "error" in grade_data:
                    response = f"**Grade Information for {target_course.get('name')}** ({target_course.get('course_code')})\n\n"
                    error_msg = grade_data.get('error', '')
                    response += f"I encountered an error retrieving your grade information: {error_msg}\n\n"

                    # Add helpful instructions for fixing Canvas API token issues
                    if 'Invalid access token' in error_msg:
                        response += "It looks like your Canvas API token is invalid or has expired. To fix this:\n\n"
                        response += "1. Go to your Canvas account settings\n"
                        response += "2. Click on 'Approved Integrations' or 'Developer Keys'\n"
                        response += "3. Generate a new API token with appropriate permissions\n"
                        response += "4. Update your Canvas API token in Glide settings\n\n"
                        response += "You can also use the Canvas Authentication Diagnostics tool in Glide to help troubleshoot this issue."
                    else:
                        response += "Please check your Canvas dashboard for the most up-to-date grade information."

                    return {
                        "content": response,
                        "metadata": {"course": target_course},
                        "handled": True
                    }

                # Get the course data from the response
                course_data = next((c for c in grade_data.get("courses", []) if str(c.get("id")) == course_id), None)

                if not course_data:
                    response = f"**Grade Information for {target_course.get('name')}** ({target_course.get('course_code')})\n\n"
                    response += "No grade information is currently available for this course.\n\n"
                    response += "Please check your Canvas dashboard for the most up-to-date grade information."

                    return {
                        "content": response,
                        "metadata": {"course": target_course},
                        "handled": True
                    }

                # Format grade information
                response = f"**Grade Information for {course_data.get('name')}** ({course_data.get('course_code')})\n\n"

                # Add current grade if available
                if course_data.get('current_grade'):
                    response += f"**Current Grade:** {course_data.get('current_grade')}\n\n"
                elif course_data.get('final_grade'):
                    response += f"**Final Grade:** {course_data.get('final_grade')}\n\n"
                else:
                    response += "No overall grade information is currently available for this course.\n\n"

                # Add assignment grades if available
                submissions = course_data.get("submissions", [])
                if submissions:
                    response += "**Recent Assignment Grades:**\n\n"

                    # Sort submissions by date (newest first)
                    submissions.sort(key=lambda s: s.get("submitted_at", ""), reverse=True)

                    # Show up to 5 most recent submissions
                    for i, submission in enumerate(submissions[:5], 1):
                        assignment_name = submission.get("assignment_name", "Unknown Assignment")
                        score = submission.get("score")
                        grade = submission.get("grade")
                        points_possible = submission.get("points_possible")

                        response += f"{i}. **{assignment_name}**\n"

                        if score is not None:
                            if points_possible:
                                response += f"   Score: {score}/{points_possible}\n"
                            else:
                                response += f"   Score: {score}\n"
                        elif grade:
                            response += f"   Grade: {grade}\n"
                        else:
                            response += "   No grade available\n"

                        # Add submission status
                        if submission.get("missing"):
                            response += "   Status: Missing\n"
                        elif submission.get("late"):
                            response += "   Status: Late\n"

                        response += "\n"
                else:
                    response += "No assignment grades are currently available for this course.\n"

                return {
                    "content": response,
                    "metadata": {"course": target_course, "grade_data": course_data},
                    "handled": True
                }
            else:
                # Get grades for all courses
                grade_data = await self.canvas_service.get_detailed_grades(user_id)

                if "error" in grade_data:
                    response = "**Grade Information**\n\n"
                    error_msg = grade_data.get('error', '')
                    response += f"I encountered an error retrieving your grade information: {error_msg}\n\n"

                    # Add helpful instructions for fixing Canvas API token issues
                    if 'Invalid access token' in error_msg:
                        response += "It looks like your Canvas API token is invalid or has expired. To fix this:\n\n"
                        response += "1. Go to your Canvas account settings\n"
                        response += "2. Click on 'Approved Integrations' or 'Developer Keys'\n"
                        response += "3. Generate a new API token with appropriate permissions\n"
                        response += "4. Update your Canvas API token in Glide settings\n\n"
                        response += "You can also use the Canvas Authentication Diagnostics tool in Glide to help troubleshoot this issue."
                    else:
                        response += "Please check your Canvas dashboard for the most up-to-date grade information."

                    return {
                        "content": response,
                        "metadata": {},
                        "handled": True
                    }

                # List grades for all courses
                response = "Here are your current grades:\n\n"

                courses_data = grade_data.get("courses", [])
                if not courses_data:
                    response += "I couldn't find any grade information for your courses. Please check your Canvas dashboard for the most up-to-date grade information."

                    return {
                        "content": response,
                        "metadata": {},
                        "handled": True
                    }

                has_grades = False
                for i, course in enumerate(courses_data, 1):
                    # Add course name and code
                    response += f"**{i}. {course.get('name')}** ({course.get('course_code')})\n"

                    # Add current grade if available
                    if course.get('current_grade'):
                        response += f"   Current Grade: {course.get('current_grade')}\n"
                        has_grades = True
                    elif course.get('final_grade'):
                        response += f"   Final Grade: {course.get('final_grade')}\n"
                        has_grades = True
                    else:
                        response += "   No grade information available\n"

                    # Add recent assignment count
                    submissions = course.get("submissions", [])
                    if submissions:
                        graded_submissions = [s for s in submissions if s.get("score") is not None or s.get("grade")]
                        if graded_submissions:
                            response += f"   Recent Graded Assignments: {len(graded_submissions)}\n"

                    # Add a separator between courses
                    response += "\n"

                if not has_grades:
                    response += "I couldn't find any grade information for your courses. For detailed grade information, please check your Canvas dashboard."
                else:
                    response += "You can ask for more details about a specific course by including the course name in your question."

                return {
                    "content": response,
                    "metadata": {"courses": courses},
                    "handled": True
                }
        except Exception as e:
            print(f"Error handling grade query: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue while trying to retrieve grade information. Please try again later.",
                "metadata": {},
                "handled": True
            }

    async def _handle_announcement_query(
        self, user_id: str, message: str, course_id: Optional[str], course_name: Optional[str]
    ) -> AgentResponse:
        """
        Handle queries about course announcements and updates.

        Args:
            user_id: The user ID
            message: The original message
            course_id: Optional course ID
            course_name: Optional course name

        Returns:
            AgentResponse with announcement information
        """
        try:
            # This would be implemented to fetch announcements from Canvas API
            # For now, return a placeholder

            # Get courses from Firestore
            courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")

            if not courses:
                return {
                    "content": "I couldn't find any Canvas courses. You might need to set up your Canvas credentials in Glide first.",
                    "metadata": {},
                    "handled": True
                }

            # If course ID or name is provided, filter courses
            target_course = None
            if course_id:
                target_course = next((c for c in courses if str(c.get("id")) == course_id), None)
            elif course_name:
                # Try to find a course with a similar name
                for course in courses:
                    if course_name.lower() in course.get("name", "").lower() or course_name.lower() in course.get("course_code", "").lower():
                        target_course = course
                        break

            # If we found a specific course, get announcement information
            if target_course:
                course_id = str(target_course.get("id"))
                announcements = await self.canvas_service.get_course_announcements(user_id, course_id)

                response = f"**Announcements for {target_course.get('name')}** ({target_course.get('course_code')})\n\n"

                if announcements:
                    for i, announcement in enumerate(announcements[:5], 1):  # Show up to 5 announcements
                        # Format posted date
                        posted_at = announcement.get("posted_at")
                        if posted_at:
                            try:
                                posted_date = datetime.fromisoformat(posted_at.replace('Z', '+00:00'))
                                posted_date_str = posted_date.strftime("%A, %B %d at %I:%M %p")
                            except:
                                posted_date_str = posted_at
                        else:
                            posted_date_str = "Unknown date"

                        # Add announcement details
                        response += f"**{i}. {announcement.get('title')}**\n"
                        response += f"Posted: {posted_date_str}\n\n"

                        # Add a truncated message (first 200 characters)
                        message = announcement.get("message", "")
                        if message:
                            # Remove HTML tags
                            import re
                            clean_message = re.sub(r'<[^>]+>', '', message)
                            if len(clean_message) > 200:
                                clean_message = clean_message[:200] + "..."
                            response += f"{clean_message}\n\n"
                else:
                    response += "No recent announcements found for this course.\n\n"

                return {
                    "content": response,
                    "metadata": {"course": target_course, "announcements": announcements},
                    "handled": True
                }
            else:
                # Get announcements for all courses
                announcements = await self.canvas_service.get_course_announcements(user_id)

                response = "**Recent Course Announcements**\n\n"

                if announcements:
                    # Group announcements by course
                    announcements_by_course = {}
                    for announcement in announcements:
                        course_id = announcement.get("course_id")
                        if course_id not in announcements_by_course:
                            announcements_by_course[course_id] = []
                        announcements_by_course[course_id].append(announcement)

                    # Show up to 2 announcements per course, for up to 3 courses
                    courses_shown = 0
                    for course_id, course_announcements in announcements_by_course.items():
                        if courses_shown >= 3:
                            break

                        # Get course name from course ID
                        course_name = next((c.get("name") for c in courses if str(c.get("id")) == course_id), "Unknown Course")

                        response += f"**{course_name}**\n"

                        # Show up to 2 announcements per course
                        for i, announcement in enumerate(course_announcements[:2], 1):
                            # Format posted date
                            posted_at = announcement.get("posted_at")
                            if posted_at:
                                try:
                                    posted_date = datetime.fromisoformat(posted_at.replace('Z', '+00:00'))
                                    posted_date_str = posted_date.strftime("%A, %B %d at %I:%M %p")
                                except:
                                    posted_date_str = posted_at
                            else:
                                posted_date_str = "Unknown date"

                            # Add announcement details
                            response += f"{i}. {announcement.get('title')}\n"
                            response += f"   Posted: {posted_date_str}\n\n"

                        courses_shown += 1
                        response += "\n"
                else:
                    response += "No recent announcements found for your courses.\n\n"

                return {
                    "content": response,
                    "metadata": {"courses": courses},
                    "handled": True
                }
        except Exception as e:
            print(f"Error handling announcement query: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue while trying to retrieve announcement information. Please try again later.",
                "metadata": {},
                "handled": True
            }

    async def _handle_search_query(self, user_id: str, message: str) -> AgentResponse:
        """
        Handle search queries for Canvas information.

        Args:
            user_id: The user ID
            message: The original message

        Returns:
            AgentResponse with search results
        """
        try:
            # Extract search term
            search_term = None
            search_match = re.search(r'(?:search|find|look for)\s+(?:for\s+)?([a-zA-Z0-9\s]+)', message.lower())
            if search_match:
                search_term = search_match.group(1).strip()

            if not search_term:
                return {
                    "content": "I'm not sure what you're looking for. Please specify what you want to search for in Canvas.",
                    "metadata": {},
                    "handled": True
                }

            # Get courses, assignments, announcements, and syllabi
            courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")
            assignments = await self.canvas_service.get_upcoming_assignments_from_firestore(user_id)
            announcements = await self.canvas_service.get_course_announcements(user_id)

            # Search in courses
            matching_courses = []
            for course in courses:
                if (search_term.lower() in course.get("name", "").lower() or
                    search_term.lower() in course.get("course_code", "").lower()):
                    matching_courses.append(course)

            # Search in assignments
            matching_assignments = []
            for assignment in assignments:
                if search_term.lower() in assignment.get("name", "").lower():
                    matching_assignments.append(assignment)

            # Search in announcements
            matching_announcements = []
            for announcement in announcements:
                if (search_term.lower() in announcement.get("title", "").lower() or
                    search_term.lower() in announcement.get("message", "").lower()):
                    matching_announcements.append(announcement)

            # Search in syllabi (for matching courses)
            matching_syllabi = []
            for course in matching_courses[:3]:  # Limit to 3 courses to avoid too many API calls
                try:
                    course_id = str(course.get("id"))
                    syllabus_data = await self.canvas_service.get_course_syllabus(user_id, course_id)

                    if "error" not in syllabus_data:
                        syllabus_body = syllabus_data.get("syllabus_body", "")

                        # Remove HTML tags for searching
                        import re
                        clean_syllabus = re.sub(r'<[^>]+>', '', syllabus_body)

                        if search_term.lower() in clean_syllabus.lower():
                            matching_syllabi.append({
                                "course_id": course_id,
                                "course_name": course.get("name"),
                                "course_code": course.get("course_code")
                            })
                except Exception as e:
                    print(f"Error searching syllabus for course {course.get('name')}: {str(e)}")
                    continue

            # Format response
            response = f"**Search Results for '{search_term}'**\n\n"

            if matching_courses:
                response += "**Matching Courses:**\n"
                for i, course in enumerate(matching_courses, 1):
                    response += f"{i}. {course.get('name')} ({course.get('course_code')})\n"
                response += "\n"

            if matching_assignments:
                response += "**Matching Assignments:**\n"
                for i, assignment in enumerate(matching_assignments[:5], 1):  # Limit to 5 assignments
                    # Format due date
                    due_date = datetime.fromisoformat(assignment.get("due_at", "").replace('Z', '+00:00'))
                    due_date_str = due_date.strftime("%A, %B %d at %I:%M %p")

                    response += f"{i}. {assignment.get('name')}\n"
                    response += f"   Course: {assignment.get('course_name')}\n"
                    response += f"   Due: {due_date_str}\n\n"

                if len(matching_assignments) > 5:
                    response += f"*...and {len(matching_assignments) - 5} more matching assignments*\n\n"

            if matching_announcements:
                response += "**Matching Announcements:**\n"
                for i, announcement in enumerate(matching_announcements[:3], 1):  # Limit to 3 announcements
                    # Format posted date
                    posted_at = announcement.get("posted_at")
                    if posted_at:
                        try:
                            posted_date = datetime.fromisoformat(posted_at.replace('Z', '+00:00'))
                            posted_date_str = posted_date.strftime("%A, %B %d")
                        except:
                            posted_date_str = posted_at
                    else:
                        posted_date_str = "Unknown date"

                    # Get course name
                    course_id = announcement.get("course_id")
                    course_name = next((c.get("name") for c in courses if str(c.get("id")) == course_id), "Unknown Course")

                    response += f"{i}. {announcement.get('title')}\n"
                    response += f"   Course: {course_name}\n"
                    response += f"   Posted: {posted_date_str}\n\n"

                if len(matching_announcements) > 3:
                    response += f"*...and {len(matching_announcements) - 3} more matching announcements*\n\n"

            if matching_syllabi:
                response += "**Matching Syllabi:**\n"
                for i, syllabus in enumerate(matching_syllabi, 1):
                    response += f"{i}. {syllabus.get('course_name')} ({syllabus.get('course_code')})\n"
                response += "\nThe search term was found in the syllabus for these courses.\n\n"

            if not matching_courses and not matching_assignments and not matching_announcements and not matching_syllabi:
                response += f"I couldn't find any Canvas content matching '{search_term}'. Try a different search term."

            return {
                "content": response,
                "metadata": {
                    "search_term": search_term,
                    "matching_courses": matching_courses,
                    "matching_assignments": matching_assignments,
                    "matching_announcements": matching_announcements,
                    "matching_syllabi": matching_syllabi
                },
                "handled": True
            }
        except Exception as e:
            print(f"Error handling search query: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue while searching Canvas information. Please try again later.",
                "metadata": {},
                "handled": True
            }

    async def _handle_summary_query(self, user_id: str, _message: str) -> AgentResponse:
        """
        Handle summary queries for Canvas information.

        Args:
            user_id: The user ID
            _message: The original message (unused)

        Returns:
            AgentResponse with summary information
        """
        try:
            # Get upcoming assignments
            assignments = await self.canvas_service.get_upcoming_assignments_from_firestore(user_id)

            # Get recent announcements
            announcements = await self.canvas_service.get_course_announcements(user_id)

            # Get courses
            courses = await self.canvas_service.get_courses_from_firestore(user_id, "current")

            # Get grades
            grade_data = await self.canvas_service.get_detailed_grades(user_id)

            if not assignments and not announcements and not courses:
                return {
                    "content": "I couldn't find any Canvas data to summarize. If you've recently added content in Canvas, it may take a few minutes to sync.",
                    "metadata": {},
                    "handled": True
                }

            # Format response
            response = "**Canvas Summary**\n\n"

            # Course summary
            if courses:
                response += f"**Current Courses:** {len(courses)}\n\n"

            # Grade summary
            if "error" not in grade_data:
                courses_with_grades = []
                for course in grade_data.get("courses", []):
                    if course.get("current_grade") or course.get("final_grade"):
                        courses_with_grades.append(course)

                if courses_with_grades:
                    response += "**Current Grades:**\n"
                    for course in courses_with_grades[:3]:  # Show up to 3 courses
                        grade = course.get("current_grade") or course.get("final_grade") or "No grade"
                        response += f"- {course.get('name')}: {grade}\n"

                    if len(courses_with_grades) > 3:
                        response += f"...and {len(courses_with_grades) - 3} more courses with grades\n"

                    response += "\n"

            # Assignment summary
            if assignments:
                # Sort assignments by due date
                assignments.sort(
                    key=lambda a: datetime.fromisoformat(a.get("due_at", "9999-12-31T23:59:59").replace('Z', '+00:00'))
                )

                # Determine time frame for summary
                now = datetime.now()
                this_week_end = now + timedelta(days=7)
                next_week_end = now + timedelta(days=14)

                # Filter assignments by time frame
                this_week_assignments = []
                next_week_assignments = []
                later_assignments = []

                for assignment in assignments:
                    due_date = datetime.fromisoformat(assignment.get("due_at", "").replace('Z', '+00:00'))

                    if due_date <= this_week_end:
                        this_week_assignments.append(assignment)
                    elif due_date <= next_week_end:
                        next_week_assignments.append(assignment)
                    else:
                        later_assignments.append(assignment)

                # This week's assignments
                response += "**Due This Week:**\n"
                if this_week_assignments:
                    for assignment in this_week_assignments[:5]:  # Show up to 5 assignments
                        # Format due date
                        due_date = datetime.fromisoformat(assignment.get("due_at", "").replace('Z', '+00:00'))
                        due_date_str = due_date.strftime("%A, %B %d at %I:%M %p")

                        response += f"- {assignment.get('name')} ({assignment.get('course_code')})\n"
                        response += f"  Due: {due_date_str}\n"

                    if len(this_week_assignments) > 5:
                        response += f"...and {len(this_week_assignments) - 5} more assignments due this week\n"
                else:
                    response += "No assignments due this week.\n"

                response += "\n"

                # Next week's assignments
                response += "**Due Next Week:**\n"
                if next_week_assignments:
                    for assignment in next_week_assignments[:3]:  # Show up to 3 assignments
                        # Format due date
                        due_date = datetime.fromisoformat(assignment.get("due_at", "").replace('Z', '+00:00'))
                        due_date_str = due_date.strftime("%A, %B %d at %I:%M %p")

                        response += f"- {assignment.get('name')} ({assignment.get('course_code')})\n"
                        response += f"  Due: {due_date_str}\n"

                    if len(next_week_assignments) > 3:
                        response += f"...and {len(next_week_assignments) - 3} more assignments due next week\n"
                else:
                    response += "No assignments due next week.\n"

                response += "\n"

                # Later assignments
                if later_assignments:
                    response += "**Coming Up Later:**\n"
                    response += f"{len(later_assignments)} more assignment(s) due after the next two weeks.\n\n"

            # Recent announcements
            if announcements:
                # Sort announcements by posted_at (newest first)
                announcements.sort(
                    key=lambda a: a.get("posted_at", ""), reverse=True
                )

                # Show up to 3 recent announcements
                response += "**Recent Announcements:**\n"
                for i, announcement in enumerate(announcements[:3], 1):
                    # Format posted date
                    posted_at = announcement.get("posted_at")
                    if posted_at:
                        try:
                            posted_date = datetime.fromisoformat(posted_at.replace('Z', '+00:00'))
                            posted_date_str = posted_date.strftime("%A, %B %d")
                        except:
                            posted_date_str = posted_at
                    else:
                        posted_date_str = "Unknown date"

                    # Get course name
                    course_id = announcement.get("course_id")
                    course_name = next((c.get("name") for c in courses if str(c.get("id")) == course_id), "Unknown Course")

                    response += f"{i}. {announcement.get('title')}\n"
                    response += f"   Course: {course_name}\n"
                    response += f"   Posted: {posted_date_str}\n\n"

                if len(announcements) > 3:
                    response += f"...and {len(announcements) - 3} more recent announcements\n"

            return {
                "content": response,
                "metadata": {
                    "courses": courses,
                    "assignments": {
                        "this_week": this_week_assignments,
                        "next_week": next_week_assignments,
                        "later": later_assignments
                    },
                    "announcements": announcements[:3] if announcements else [],
                    "grades": grade_data.get("courses", []) if "error" not in grade_data else []
                },
                "handled": True
            }
        except Exception as e:
            print(f"Error handling summary query: {str(e)}")
            return {
                "content": "I'm sorry, I encountered an issue while summarizing Canvas information. Please try again later.",
                "metadata": {},
                "handled": True
            }