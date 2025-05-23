"""
Welcome agent for the Glide application.

This agent generates personalized welcome messages for users.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import random

from app.agents.base import BaseAgent, AgentResponse
from app.services.canvas_service import CanvasService


class WelcomeAgent(BaseAgent):
    """
    Agent responsible for generating personalized welcome messages for users.

    This agent creates friendly, warm, and professional welcome messages that:
    1. Are confident but never guess or make up information
    2. Will push back or correct users when necessary
    3. Present information in a comforting and supportive way
    4. Focus on helping users feel supported rather than overwhelmed
    """

    def __init__(self):
        """Initialize the Welcome agent."""
        super().__init__(name="welcome")
        self.canvas_service = CanvasService()

        # Greeting templates based on time of day
        self.morning_greetings = [
            "Good morning, {}!",
            "Morning, {}!",
            "Hello {}, good morning!",
        ]

        self.afternoon_greetings = [
            "Good afternoon, {}!",
            "Hello {}, good afternoon!",
            "Hi there, {}!",
        ]

        self.evening_greetings = [
            "Good evening, {}!",
            "Evening, {}!",
            "Hello {}, good evening!",
        ]

        # Message body templates
        self.message_bodies = [
            "I'm here to help you stay organized and on top of your coursework.",
            "I can help you keep track of assignments, access course materials, and manage your academic schedule.",
            "I'm designed to make your academic life easier by helping you manage your courses and assignments.",
            "I'm ready to assist you with your academic needs and help you stay organized.",
        ]

        # Closing statement templates
        self.closing_statements = [
            "How can I assist you today?",
            "What can I help you with today?",
            "Is there anything specific you'd like help with today?",
            "What would you like to know about your courses or assignments?",
        ]

        # Identity question keywords
        self.identity_keywords = [
            "who are you", "what are you", "what's your name", "what is your name",
            "who made you", "who created you", "what can you do", "your purpose",
            "tell me about yourself", "introduce yourself", "your capabilities"
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
        # Check if this is a welcome message request
        if context.get("is_welcome_request", False):
            return True

        # Check if this is an identity question
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in self.identity_keywords)

    async def process(self, message: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process a welcome-related message.

        Args:
            message: The message to process
            context: Additional context for processing

        Returns:
            AgentResponse containing the welcome message
        """
        # Get user information
        user = context.get("user", {})

        # Check if this is a welcome message request
        if context.get("is_welcome_request", False):
            welcome_message = await self._generate_welcome_message(user)
            return {
                "content": welcome_message,
                "metadata": {},
                "handled": True
            }

        # Check if this is an identity question
        message_lower = message.lower()
        if any(keyword in message_lower for keyword in self.identity_keywords):
            identity_response = await self._get_identity_response(user)
            return {
                "content": identity_response,
                "metadata": {},
                "handled": True
            }

        # Fallback
        return {
            "content": "I'm your Glide Assistant, here to help you manage your coursework and academic life.",
            "metadata": {},
            "handled": False
        }

    async def _generate_welcome_message(self, user: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a personalized welcome message for the user.

        Args:
            user: Optional user information from Firebase

        Returns:
            A personalized welcome message
        """
        # Extract user name if available
        user_name = user.get("displayName") if user and user.get("displayName") else "there"

        # Generate greeting
        greeting = self._get_time_based_greeting(user_name)

        # Select closing statement (we don't need message body anymore)
        closing = random.choice(self.closing_statements)

        # Get user ID if available
        user_id = user.get("uid") if user else None

        # Initialize assignment summary
        assignment_summary = ""

        # If user is authenticated, try to get upcoming assignments
        if user_id:
            try:
                print(f"Fetching assignments for welcome message for user {user_id}")
                assignments = await self._get_upcoming_assignments(user_id)
                print(f"Retrieved {len(assignments) if assignments else 0} assignments for welcome message")

                # Check if we successfully retrieved assignments (even if the list is empty)
                if assignments is not None:
                    # Count assignments due in the next week
                    now = datetime.now()
                    one_week_from_now = now + timedelta(days=7)

                    due_this_week = [
                        a for a in assignments
                        if a.get("due_at") and datetime.fromisoformat(a.get("due_at", "").replace('Z', '+00:00')) <= one_week_from_now
                    ]

                    print(f"Found {len(due_this_week)} assignments due this week")

                    if due_this_week:
                        assignment_count = len(due_this_week)
                        next_assignment = due_this_week[0]
                        print(f"Next assignment: {next_assignment.get('name')} for {next_assignment.get('course_name')}")

                        due_date = datetime.fromisoformat(next_assignment.get("due_at", "").replace('Z', '+00:00'))
                        days_until_due = (due_date - now).days

                        if days_until_due < 1:
                            time_until_due = "today"
                        elif days_until_due == 1:
                            time_until_due = "tomorrow"
                        else:
                            time_until_due = f"in {days_until_due} days"

                        assignment_summary = f"You have {assignment_count} assignment{'s' if assignment_count != 1 else ''} due in the next week, with '{next_assignment.get('name')}' for {next_assignment.get('course_name')} due {time_until_due}."
                    else:
                        # No assignments due this week
                        assignment_summary = "Great news! You don't have any assignments due in the next week. You're all caught up!"
            except Exception as e:
                print(f"Error getting assignments for welcome message: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")

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

    def _get_time_based_greeting(self, name: str) -> str:
        """
        Get a greeting based on the time of day.

        Args:
            name: The name to include in the greeting

        Returns:
            A time-appropriate greeting
        """
        hour = datetime.now().hour

        if 5 <= hour < 12:
            return random.choice(self.morning_greetings).format(name)
        elif 12 <= hour < 18:
            return random.choice(self.afternoon_greetings).format(name)
        else:
            return random.choice(self.evening_greetings).format(name)

    async def _get_upcoming_assignments(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get upcoming assignments for a user.

        Args:
            user_id: Firebase user ID

        Returns:
            List of upcoming assignments
        """
        try:
            # Get assignments from Firestore
            assignments = await self.canvas_service.get_upcoming_assignments_from_firestore(user_id)

            # Sort by due date
            if assignments:
                assignments.sort(
                    key=lambda a: datetime.fromisoformat(a.get("due_at", "9999-12-31T23:59:59").replace('Z', '+00:00'))
                )

            return assignments
        except Exception as e:
            print(f"Error getting upcoming assignments: {str(e)}")
            return []

    async def _get_identity_response(self, user: Optional[Dict[str, Any]] = None) -> str:
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
            print(f"Error getting identity response: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return base_response
