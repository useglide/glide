from typing import Dict, Optional, Any, List
import random
from datetime import datetime, timedelta

from app.services.canvas_service import CanvasService

class WelcomeAgent:
    """
    Agent responsible for generating personalized welcome messages for users.

    This agent creates friendly, warm, and professional welcome messages that:
    1. Are confident but never guess or make up information
    2. Will push back or correct users when necessary
    3. Present information in a comforting and supportive way
    4. Focus on helping users feel supported rather than overwhelmed
    """

    def __init__(self):
        """Initialize the welcome agent."""
        # Initialize Canvas service
        self.canvas_service = CanvasService()

        # Time-based greeting templates
        self.morning_greetings = [
            "Good morning, {name}!",
            "Morning, {name}!",
            "Hello {name}, hope your morning is going well!"
        ]

        self.afternoon_greetings = [
            "Good afternoon, {name}!",
            "Hi {name}, hope you're having a good afternoon!",
            "Hello {name}, hope your day is going well!"
        ]

        self.evening_greetings = [
            "Good evening, {name}!",
            "Hi {name}, hope you've had a productive day!",
            "Hello {name}, winding down for the day?"
        ]

        self.general_greetings = [
            "Hello {name}!",
            "Hi there, {name}!",
            "Welcome back, {name}!"
        ]

        # Message body templates that emphasize support and organization
        self.message_bodies = [
            "I'm here to help you stay on top of your coursework. I've organized your assignments by due date and estimated completion time.",
            "I've sorted your upcoming assignments and class materials to help you manage your workload more effectively.",
            "I've organized your course materials and upcoming deadlines to help you plan your week.",
            "I've got all your course materials and assignments organized and ready for you."
        ]

        # Supportive closing statements
        self.closing_statements = [
            "Let me know which assignment you'd like to tackle first, or if you need help with anything else.",
            "What would you like to focus on today? I'm here to help with whatever you need.",
            "How can I help you with your coursework today?",
            "Is there a specific assignment or course you'd like to focus on today?"
        ]

    def _get_time_based_greeting(self, name: Optional[str] = None) -> str:
        """
        Get a greeting based on the time of day.

        Args:
            name: Optional user name to personalize the greeting

        Returns:
            A time-appropriate greeting
        """
        # Default name if none provided
        user_name = name if name else "there"

        # Get current hour (0-23)
        current_hour = datetime.now().hour

        # Select appropriate greeting based on time
        if 5 <= current_hour < 12:  # Morning: 5 AM - 11:59 AM
            greetings = self.morning_greetings
        elif 12 <= current_hour < 18:  # Afternoon: 12 PM - 5:59 PM
            greetings = self.afternoon_greetings
        elif 18 <= current_hour < 23:  # Evening: 6 PM - 10:59 PM
            greetings = self.evening_greetings
        else:  # Late night: 11 PM - 4:59 AM
            greetings = self.general_greetings

        # Randomly select a greeting from the appropriate list
        greeting = random.choice(greetings)

        # Format with user's name
        return greeting.format(name=user_name)

    async def generate_welcome_message(self, user: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a personalized welcome message for the user.

        Args:
            user: Optional user information from Firebase

        Returns:
            A personalized welcome message
        """
        # Log user information for debugging
        print(f"Welcome agent received user object: {user}")

        # Extract user name if available
        user_name = user.get("displayName") if user and user.get("displayName") else "there"
        print(f"Using display name: {user_name}")

        # Generate greeting
        greeting = self._get_time_based_greeting(user_name)

        # Select closing statement (we don't need message body anymore)
        closing = random.choice(self.closing_statements)

        # Get user ID if available
        user_id = user.get("uid") if user else None
        print(f"User ID from auth: {user_id}")

        # Initialize assignment summary
        assignment_summary = ""

        # Get assignment information if user ID is available and not the test user
        if user_id and user_id != "test-user":
            print(f"Attempting to get assignments for authenticated user ID: {user_id}")
            try:
                # Get upcoming assignments
                assignments = await self._get_upcoming_assignments(user_id)
                print(f"Retrieved {len(assignments)} assignments")

                # Format assignment summary
                if assignments:
                    assignment_summary = await self._format_assignment_summary(assignments)
                    print(f"Generated assignment summary: {assignment_summary}")
                else:
                    # No assignments found - user is all caught up!
                    assignment_summary = "Great news! You don't have any assignments due in the next two weeks. You're all caught up!"
                    print(f"No assignments found - using positive message: {assignment_summary}")
            except Exception as e:
                print(f"Error getting assignment information: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
        else:
            if not user_id:
                print("No user ID available, skipping assignment retrieval")
            elif user_id == "test-user":
                print("Test user detected, skipping real assignment retrieval")

        # Create a direct message focused on assignments
        if assignment_summary:
            # Just use the assignment summary as the main message
            welcome_message = f"{greeting} {assignment_summary}"
            print(f"Using assignment summary as main message: {assignment_summary}")
        else:
            # Minimal message when no assignments
            welcome_message = f"{greeting} You don't have any upcoming assignments. Your schedule is clear."
            print("No assignment summary available, using minimal message")

        # Add closing statement without the introduction
        welcome_message += f" {closing}"

        print(f"Final welcome message: {welcome_message}")
        return welcome_message

    async def _get_user_courses(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get the user's current courses from Canvas.

        Args:
            user_id: Firebase user ID

        Returns:
            List of courses
        """
        try:
            print(f"_get_user_courses called for user_id: {user_id}")

            # Check if Firestore service is initialized
            if not self.canvas_service.firestore_service.db:
                print("WARNING: Firestore client is not initialized in canvas_service.firestore_service")

            # Get courses from Firestore with 'current' status
            print(f"Requesting courses with 'current' status from Firestore for user: {user_id}")
            courses = await self.canvas_service.get_courses_from_firestore(user_id, status="current")

            if courses:
                print(f"Successfully retrieved {len(courses)} courses from Firestore")
                course_names = [course.get('name', 'Unknown') for course in courses]
                print(f"Course names: {course_names}")
            else:
                print("No courses returned from Firestore")

            return courses
        except Exception as e:
            print(f"Error getting user courses: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []

    async def _get_upcoming_assignments(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get the user's upcoming assignments.

        Args:
            user_id: Firebase user ID

        Returns:
            List of upcoming assignments
        """
        try:
            print(f"_get_upcoming_assignments called for user_id: {user_id}")

            # Get current courses
            print("Fetching user courses from Firestore...")
            courses = await self._get_user_courses(user_id)
            print(f"Retrieved {len(courses)} courses from Firestore")

            if not courses:
                print("No courses found for user, returning empty assignment list")
                return []

            # Get assignments for each course
            all_assignments = []

            # Initialize Canvas with user credentials
            print("Fetching Canvas credentials from Firestore...")
            credentials = await self.canvas_service.firestore_service.get_canvas_credentials(user_id)

            if credentials:
                print(f"Retrieved Canvas credentials: URL={credentials.get('canvas_url')}, API Key={'[REDACTED]' if credentials.get('api_key') else 'None'}")
                self.canvas_service.canvas_url = credentials.get("canvas_url")
                self.canvas_service.api_key = credentials.get("api_key")
                print("Initializing Canvas client...")
                self.canvas_service.initialize_canvas()
            else:
                print("Failed to retrieve Canvas credentials from Firestore")

            # Check if Canvas client is initialized
            if not self.canvas_service.canvas:
                print("Canvas client is not initialized - cannot fetch assignments")
                return []
            else:
                print("Canvas client successfully initialized")

            # Get current date and calculate date range for filtering assignments
            now = datetime.now()
            future_cutoff = now + timedelta(days=14)  # Get assignments due in next 14 days
            print(f"Looking for assignments due between {now} and {future_cutoff}")

            # Get assignments for each course
            for course in courses:
                try:
                    course_id = course.get("id")
                    if not course_id:
                        print(f"Skipping course with no ID: {course.get('name', 'Unknown')}")
                        continue

                    print(f"Fetching assignments for course: {course.get('name')} (ID: {course_id})")

                    # Get course object from Canvas
                    canvas_course = self.canvas_service.canvas.get_course(course_id)
                    print(f"Successfully retrieved Canvas course object for {course.get('name')}")

                    # Get assignments for this course
                    print(f"Fetching assignments for course {course.get('name')}...")
                    assignments = canvas_course.get_assignments(
                        bucket="upcoming",
                        order_by="due_at",
                        include=["submission"]
                    )
                    print(f"Retrieved assignments for course {course.get('name')}")

                    # Filter and format assignments
                    assignment_count = 0
                    for assignment in assignments:
                        # Skip assignments without due dates
                        if not assignment.due_at:
                            continue

                        # Parse due date
                        due_date = datetime.fromisoformat(assignment.due_at.replace('Z', '+00:00'))

                        # Skip assignments due after the cutoff
                        if due_date > future_cutoff:
                            continue

                        # Add course information to assignment
                        assignment_data = {
                            "id": assignment.id,
                            "name": assignment.name,
                            "due_at": assignment.due_at,
                            "course_name": course.get("name"),
                            "course_code": course.get("course_code"),
                            "course_id": course_id
                        }

                        all_assignments.append(assignment_data)
                        assignment_count += 1

                    print(f"Added {assignment_count} assignments from course {course.get('name')}")
                except Exception as e:
                    print(f"Error getting assignments for course {course.get('name')}: {str(e)}")
                    import traceback
                    print(f"Traceback: {traceback.format_exc()}")
                    continue

            # Sort assignments by due date
            all_assignments.sort(key=lambda a: a.get("due_at", ""))
            print(f"Returning {len(all_assignments)} total assignments")

            return all_assignments
        except Exception as e:
            print(f"Error getting upcoming assignments: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []

    async def _format_assignment_summary(self, assignments: List[Dict[str, Any]]) -> str:
        """
        Format a summary of upcoming assignments.

        Args:
            assignments: List of assignments

        Returns:
            Formatted summary string
        """
        if not assignments:
            return "Great news! You don't have any assignments due in the next two weeks. You're all caught up!"

        # Group assignments by course
        assignments_by_course = {}
        for assignment in assignments:
            course_name = assignment.get("course_name", "Unknown Course")
            if course_name not in assignments_by_course:
                assignments_by_course[course_name] = []
            assignments_by_course[course_name].append(assignment)

        # Format the summary
        summary = f"You have {len(assignments)} upcoming assignment{'s' if len(assignments) != 1 else ''} due in the next two weeks. "

        # Add course breakdown
        course_counts = [f"{len(assignments)} in {course}" for course, assignments in assignments_by_course.items()]
        if course_counts:
            summary += f"That's {', '.join(course_counts[:-1])}{' and ' if len(course_counts) > 1 else ''}{course_counts[-1] if course_counts else ''}. "

        # Add information about the most urgent assignment
        if assignments:
            next_assignment = assignments[0]
            due_date = datetime.fromisoformat(next_assignment.get("due_at", "").replace('Z', '+00:00'))
            days_until_due = (due_date - datetime.now()).days

            if days_until_due < 1:
                time_until_due = "today"
            elif days_until_due == 1:
                time_until_due = "tomorrow"
            else:
                time_until_due = f"in {days_until_due} days"

            summary += f"Your next assignment is '{next_assignment.get('name')}' for {next_assignment.get('course_name')}, due {time_until_due}."

        return summary

    async def get_identity_response(self, user: Optional[Dict[str, Any]] = None) -> str:
        """
        Get a response for identity questions.

        Args:
            user: Optional user information from Firebase

        Returns:
            A response about the AI's identity
        """
        base_response = "I am your Glide Assistant, designed to help you manage your coursework and academic life. I can help you organize assignments, access course materials, and stay on top of your deadlines."

        # Get user ID if available
        user_id = user.get("uid") if user else None

        # If no user ID, return base response
        if not user_id:
            return base_response

        try:
            # Get upcoming assignments
            assignments = await self._get_upcoming_assignments(user_id)

            # If no assignments, return a positive message
            if not assignments:
                return f"{base_response} Great news! You don't have any upcoming assignments due in the next two weeks. You're all caught up!"

            # Add personalized information
            assignment_count = len(assignments)
            next_assignment = assignments[0] if assignments else None

            if next_assignment:
                due_date = datetime.fromisoformat(next_assignment.get("due_at", "").replace('Z', '+00:00'))
                days_until_due = (due_date - datetime.now()).days

                if days_until_due < 1:
                    time_until_due = "today"
                elif days_until_due == 1:
                    time_until_due = "tomorrow"
                else:
                    time_until_due = f"in {days_until_due} days"

                return f"{base_response} Currently, you have {assignment_count} upcoming assignment{'s' if assignment_count != 1 else ''} due in the next two weeks, with '{next_assignment.get('name')}' for {next_assignment.get('course_name')} due {time_until_due}."

            return f"{base_response} Currently, you have {assignment_count} upcoming assignment{'s' if assignment_count != 1 else ''} due in the next two weeks."
        except Exception as e:
            print(f"Error getting assignment information for identity response: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return base_response
