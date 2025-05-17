from typing import Dict, List, Any, Optional
import requests
from canvasapi import Canvas
import json

from app.core.config import settings
from app.services.firestore_service import FirestoreService


class CanvasService:
    """Service for interacting with the Canvas LMS API."""

    def __init__(self, canvas_url: str = None, api_key: str = None):
        """
        Initialize the Canvas service.

        Args:
            canvas_url: The URL of the Canvas instance
            api_key: The API key for authenticating with Canvas
        """
        self.canvas_url = canvas_url
        self.api_key = api_key
        self.canvas = None
        self.firestore_service = FirestoreService()

        if canvas_url and api_key:
            self.initialize_canvas()

    def initialize_canvas(self):
        """Initialize the Canvas API client."""
        try:
            if not self.canvas_url or not self.api_key:
                print("Cannot initialize Canvas API: Missing canvas_url or api_key")
                self.canvas = None
                return

            print(f"Initializing Canvas API with URL: {self.canvas_url}")
            self.canvas = Canvas(self.canvas_url, self.api_key)
            print("Canvas API initialized successfully")
        except Exception as e:
            print(f"Error initializing Canvas API: {str(e)}")
            self.canvas = None

    async def get_user_canvas_credentials(self, user_id: str, id_token: Optional[str] = None) -> Dict[str, str]:
        """
        Get Canvas credentials for a user from the Express.js backend.

        Args:
            user_id: The Firebase user ID
            id_token: Optional Firebase ID token. If not provided, will use user_id as the token (for backward compatibility)

        Returns:
            Dict containing Canvas URL and API key
        """
        try:
            # Make request to Express.js backend
            url = f"{settings.EXPRESS_BACKEND_URL}/auth/canvas-credentials"

            # Use the provided ID token if available, otherwise use the user_id
            auth_token = id_token if id_token else user_id

            headers = {
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            }

            print(f"Requesting Canvas credentials from: {url} for user ID: {user_id}")
            response = requests.get(url, headers=headers)

            if response.status_code == 401:
                print(f"Authentication failed when getting Canvas credentials. Status code: 401")
                print(f"Make sure the Firebase token is valid and the Express.js backend is configured correctly.")
                print(f"If FIREBASE_AUTH_DISABLED=True, you need to provide a valid Firebase ID token.")

                if settings.FIREBASE_AUTH_DISABLED:
                    print("WARNING: FIREBASE_AUTH_DISABLED is set to True. This will not work in production.")
                    print("You need to set FIREBASE_AUTH_DISABLED=False and provide a valid Firebase ID token.")

                return {}

            response.raise_for_status()

            credentials = response.json()
            if not credentials.get("canvasUrl") or not credentials.get("canvasApiKey"):
                print(f"Canvas credentials incomplete. Response: {credentials}")
                return {}

            return {
                "canvas_url": credentials.get("canvasUrl"),
                "api_key": credentials.get("canvasApiKey")
            }
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error when getting Canvas credentials: {str(e)}")
            print(f"Check if the EXPRESS_BACKEND_URL ({settings.EXPRESS_BACKEND_URL}) is correct and accessible.")
            return {}
        except Exception as e:
            print(f"Error getting Canvas credentials: {str(e)}")
            print(f"Response status code: {getattr(response, 'status_code', 'N/A')}")
            print(f"Response content: {getattr(response, 'text', 'N/A')}")
            return {}

    async def get_courses(self, user_id: Optional[str] = None, id_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get courses for a user.

        Args:
            user_id: Optional Firebase user ID. If provided, will fetch credentials from Firestore.
            id_token: Optional Firebase ID token. Not used when fetching from Firestore directly.

        Returns:
            List of courses
        """
        try:
            # If user_id is provided, get credentials from Firestore
            if user_id and not (self.canvas_url and self.api_key):
                print(f"Getting Canvas credentials from Firestore for user ID: {user_id}")
                credentials = await self.firestore_service.get_canvas_credentials(user_id)

                if not credentials:
                    print("Failed to get Canvas credentials from Firestore")
                    return []

                self.canvas_url = credentials.get("canvas_url")
                self.api_key = credentials.get("api_key")

                if not self.canvas_url or not self.api_key:
                    print(f"Invalid Canvas credentials: URL={self.canvas_url}, API Key={'[REDACTED]' if self.api_key else 'None'}")
                    return []

                self.initialize_canvas()

            # Check if Canvas client is initialized
            if not self.canvas:
                print("Canvas client is not initialized")
                return []

            # Get current user
            try:
                print("Getting current Canvas user")
                user = self.canvas.get_current_user()
                print(f"Current Canvas user: {user.name} (ID: {user.id})")
            except Exception as e:
                print(f"Error getting current Canvas user: {str(e)}")
                return []

            # Get courses
            try:
                print("Getting Canvas courses")
                courses = user.get_courses(include=["term", "teachers"])
                print(f"Retrieved {len(list(courses))} courses")
            except Exception as e:
                print(f"Error getting Canvas courses: {str(e)}")
                return []

            # Format courses
            formatted_courses = []
            for course in courses:
                try:
                    # Get course data as dict
                    course_data = course.__dict__

                    # Extract teacher information
                    teachers = []
                    if hasattr(course, "teachers"):
                        for teacher in course.teachers:
                            teachers.append({
                                "id": teacher.get("id"),
                                "display_name": teacher.get("display_name")
                            })

                    # Format course data
                    formatted_course = {
                        "id": course_data.get("id"),
                        "name": course_data.get("name"),
                        "course_code": course_data.get("course_code"),
                        "term": course_data.get("term", {}).get("name") if course_data.get("term") else None,
                        "start_at": course_data.get("start_at"),
                        "end_at": course_data.get("end_at"),
                        "teachers": teachers
                    }

                    formatted_courses.append(formatted_course)
                except Exception as e:
                    print(f"Error formatting course: {str(e)}")
                    continue

            return formatted_courses
        except Exception as e:
            print(f"Error getting courses: {str(e)}")
            return []

    async def get_courses_from_firestore(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get courses for a user directly from Firestore.

        Args:
            user_id: Firebase user ID
            status: Optional status filter ('current' or 'past')

        Returns:
            List of courses from Firestore
        """
        try:
            print(f"Getting courses from Firestore for user ID: {user_id}")
            courses = await self.firestore_service.get_user_courses(user_id, status)

            if not courses:
                print(f"No courses found in Firestore for user {user_id}")
                # Try to get courses from Canvas API as fallback
                return await self.get_courses(user_id)

            print(f"Retrieved {len(courses)} courses from Firestore")
            return courses
        except Exception as e:
            print(f"Error getting courses from Firestore: {str(e)}")
            return []
