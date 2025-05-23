from typing import Dict, List, Any, Optional
import requests
from canvasapi import Canvas
import time
import functools
from datetime import datetime, timedelta

from app.core.config import settings
from app.services.firestore_service import FirestoreService


# Cache dictionary to store results
_cache = {}

def canvas_cache(ttl_seconds=300):
    """
    Decorator for caching Canvas API results.

    Args:
        ttl_seconds: Time to live in seconds for cached results

    Returns:
        Decorated function with caching
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Create a cache key from function name and arguments
            key_parts = [func.__name__]

            # Add positional args to key
            for arg in args[1:]:  # Skip self
                key_parts.append(str(arg))

            # Add keyword args to key
            for k, v in sorted(kwargs.items()):
                key_parts.append(f"{k}:{v}")

            cache_key = ":".join(key_parts)

            # Check if result is in cache and not expired
            if cache_key in _cache:
                result, timestamp = _cache[cache_key]
                if time.time() - timestamp < ttl_seconds:
                    print(f"Cache hit for {func.__name__}")
                    return result

            # Call the original function
            result = await func(*args, **kwargs)

            # Store result in cache
            _cache[cache_key] = (result, time.time())

            return result
        return wrapper
    return decorator


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
            print("Canvas initialization started")
            print(f"Canvas URL: {self.canvas_url}")
            print(f"API Key present: {bool(self.api_key)}")
            print(f"API Key length: {len(self.api_key) if self.api_key else 0}")
            print(f"API Key format: {self.api_key[:5]}...{self.api_key[-5:] if self.api_key and len(self.api_key) > 10 else ''}")

            if not self.canvas_url or not self.api_key:
                print("ERROR: Cannot initialize Canvas API: Missing canvas_url or api_key")
                if not self.canvas_url:
                    print("Canvas URL is missing or empty")
                if not self.api_key:
                    print("Canvas API key is missing or empty")
                self.canvas = None
                return

            # Validate URL format
            if not self.canvas_url.startswith(('http://', 'https://')):
                print(f"ERROR: Invalid Canvas URL format: {self.canvas_url}")
                print("Canvas URL must start with http:// or https://")
                self.canvas = None
                return

            # Validate API key format (basic check)
            if len(self.api_key) < 20:  # Most Canvas API tokens are longer
                print(f"WARNING: Canvas API key seems too short ({len(self.api_key)} chars)")
                print("This may not be a valid Canvas API token")

            print(f"Initializing Canvas API with URL: {self.canvas_url}")
            try:
                self.canvas = Canvas(self.canvas_url, self.api_key)
                print("Canvas API initialized successfully")

                # Test the connection by getting the current user
                try:
                    user = self.canvas.get_current_user()
                    print(f"Canvas connection test successful - current user: {user.name} (ID: {user.id})")
                except Exception as user_e:
                    print(f"WARNING: Canvas client initialized but failed to get current user: {str(user_e)}")
                    print("This may indicate an issue with the API key or permissions")
                    print("Common issues:")
                    print("1. The API key may be invalid or expired")
                    print("2. The API key may not have sufficient permissions")
                    print("3. The Canvas URL may be incorrect")
                    print("4. The Canvas instance may be down or unreachable")
            except Exception as canvas_e:
                print(f"ERROR: Failed to create Canvas client object: {str(canvas_e)}")
                self.canvas = None
                raise
        except Exception as e:
            print(f"ERROR initializing Canvas API: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
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

    async def validate_canvas_credentials(self, canvas_url: str, api_key: str) -> bool:
        """
        Validate Canvas credentials by making a test API call.

        Args:
            canvas_url: The Canvas URL to validate
            api_key: The Canvas API key to validate

        Returns:
            True if credentials are valid, False otherwise
        """
        try:
            print(f"Validating Canvas credentials for URL: {canvas_url}")

            # Basic validation
            if not canvas_url or not api_key:
                print("Missing Canvas URL or API key")
                return False

            if not canvas_url.startswith(('http://', 'https://')):
                print(f"Invalid Canvas URL format: {canvas_url}")
                return False

            # Create a temporary Canvas client
            temp_canvas = Canvas(canvas_url, api_key)

            # Try to get current user
            try:
                user = temp_canvas.get_current_user()
                print(f"Canvas credentials validation successful - user: {user.name} (ID: {user.id})")
                return True
            except Exception as e:
                print(f"Canvas credentials validation failed: {str(e)}")
                return False

        except Exception as e:
            print(f"Error validating Canvas credentials: {str(e)}")
            return False

    async def get_courses(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get courses for a user.

        Args:
            user_id: Optional Firebase user ID. If provided, will fetch credentials from Firestore.

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

                # Validate credentials before initializing
                is_valid = await self.validate_canvas_credentials(self.canvas_url, self.api_key)
                if not is_valid:
                    print("Canvas credentials validation failed. Please check your Canvas API key and URL.")
                    print("You may need to regenerate your Canvas API token.")
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
                print("This may indicate that your Canvas API token has expired or has insufficient permissions.")
                print("Try regenerating your Canvas API token with the correct permissions.")
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

    async def get_upcoming_assignments_from_firestore(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get upcoming assignments for a user directly from Firestore.

        Args:
            user_id: Firebase user ID

        Returns:
            List of upcoming assignments from Firestore
        """
        try:
            print(f"Getting upcoming assignments from Firestore for user ID: {user_id}")

            # Get user's courses first
            courses = await self.get_courses_from_firestore(user_id, "current")

            if not courses:
                print(f"No courses found for user {user_id}, cannot get assignments")
                return []

            # Initialize Canvas with user credentials
            credentials = await self.firestore_service.get_canvas_credentials(user_id)

            if not credentials:
                print(f"No Canvas credentials found for user {user_id}")
                return []

            self.canvas_url = credentials.get("canvas_url")
            self.api_key = credentials.get("api_key")

            # Validate credentials before initializing
            is_valid = await self.validate_canvas_credentials(self.canvas_url, self.api_key)
            if not is_valid:
                print("Canvas credentials validation failed. Please check your Canvas API key and URL.")
                print("You may need to regenerate your Canvas API token.")
                return []

            self.initialize_canvas()

            if not self.canvas:
                print("Canvas client not initialized, cannot get assignments")
                return []

            # Get assignments for each course
            from datetime import datetime, timedelta
            all_assignments = []

            # Define date range for upcoming assignments (next 30 days)
            now = datetime.now()
            future_cutoff = now + timedelta(days=30)

            for course in courses:
                try:
                    course_id = course.get("id")
                    if not course_id:
                        continue

                    # Get Canvas course
                    canvas_course = self.canvas.get_course(course_id)

                    # Get assignments
                    assignments = canvas_course.get_assignments(
                        bucket="upcoming",
                        order_by="due_at",
                        include=["submission"]
                    )

                    # Process assignments
                    for assignment in assignments:
                        # Skip assignments without due dates
                        if not assignment.due_at:
                            continue

                        # Parse due date
                        due_date = datetime.fromisoformat(assignment.due_at.replace('Z', '+00:00'))

                        # Skip assignments due after cutoff
                        if due_date > future_cutoff:
                            continue

                        # Format assignment data
                        assignment_data = {
                            "id": assignment.id,
                            "name": assignment.name,
                            "due_at": assignment.due_at,
                            "course_id": course_id,
                            "course_name": course.get("name", "Unknown Course"),
                            "course_code": course.get("course_code", "")
                        }

                        all_assignments.append(assignment_data)
                except Exception as e:
                    print(f"Error getting assignments for course {course.get('name')}: {str(e)}")
                    continue

            # Sort by due date
            all_assignments.sort(key=lambda a: a.get("due_at", ""))

            print(f"Retrieved {len(all_assignments)} upcoming assignments")
            return all_assignments
        except Exception as e:
            print(f"Error getting upcoming assignments from Firestore: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []

    @canvas_cache(ttl_seconds=600)  # Cache for 10 minutes
    async def get_course_syllabus(self, user_id: str, course_id: str) -> Dict[str, Any]:
        """
        Get the syllabus for a specific course.

        Args:
            user_id: Firebase user ID
            course_id: Canvas course ID

        Returns:
            Dictionary containing syllabus information
        """
        try:
            print(f"Getting syllabus for course {course_id} for user {user_id}")

            # Initialize Canvas with user credentials
            credentials = await self.firestore_service.get_canvas_credentials(user_id)

            if not credentials:
                print(f"No Canvas credentials found for user {user_id}")
                return {"error": "Canvas credentials not found"}

            self.canvas_url = credentials.get("canvas_url")
            self.api_key = credentials.get("api_key")

            # Validate credentials before initializing
            is_valid = await self.validate_canvas_credentials(self.canvas_url, self.api_key)
            if not is_valid:
                print("Canvas credentials validation failed. Please check your Canvas API key and URL.")
                return {"error": "Invalid Canvas credentials. Please regenerate your Canvas API token."}

            self.initialize_canvas()

            if not self.canvas:
                print("Canvas client not initialized, cannot get syllabus")
                return {"error": "Canvas client initialization failed"}

            # Get the course
            try:
                canvas_course = self.canvas.get_course(course_id, include=["syllabus_body"])

                # Get course data
                course_data = {
                    "id": canvas_course.id,
                    "name": canvas_course.name,
                    "course_code": canvas_course.course_code,
                    "syllabus_body": getattr(canvas_course, "syllabus_body", "No syllabus available")
                }

                return course_data
            except Exception as e:
                print(f"Error getting course syllabus: {str(e)}")
                return {"error": f"Failed to get syllabus: {str(e)}"}

        except Exception as e:
            print(f"Error in get_course_syllabus: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return {"error": str(e)}

    @canvas_cache(ttl_seconds=300)  # Cache for 5 minutes
    async def get_course_announcements(self, user_id: str, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get announcements for a specific course or all courses.

        Args:
            user_id: Firebase user ID
            course_id: Optional Canvas course ID. If not provided, get announcements for all courses.

        Returns:
            List of announcements
        """
        try:
            print(f"Getting announcements for user {user_id}" + (f" and course {course_id}" if course_id else ""))

            # Initialize Canvas with user credentials
            credentials = await self.firestore_service.get_canvas_credentials(user_id)

            if not credentials:
                print(f"No Canvas credentials found for user {user_id}")
                return []

            self.canvas_url = credentials.get("canvas_url")
            self.api_key = credentials.get("api_key")

            # Validate credentials before initializing
            is_valid = await self.validate_canvas_credentials(self.canvas_url, self.api_key)
            if not is_valid:
                print("Canvas credentials validation failed. Please check your Canvas API key and URL.")
                print("You may need to regenerate your Canvas API token.")
                return []

            self.initialize_canvas()

            if not self.canvas:
                print("Canvas client not initialized, cannot get announcements")
                return []

            # Get courses if course_id is not provided
            context_codes = []
            if course_id:
                context_codes.append(f"course_{course_id}")
            else:
                # Get user's current courses
                courses = await self.get_courses_from_firestore(user_id, "current")
                for course in courses:
                    course_id = course.get("id")
                    if course_id:
                        context_codes.append(f"course_{course_id}")

            if not context_codes:
                print("No courses found, cannot get announcements")
                return []

            # Get announcements
            try:
                # Calculate date range (last 30 days)
                now = datetime.now()
                start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
                end_date = now.strftime("%Y-%m-%d")

                # We need to use the REST API directly since canvasapi doesn't have a method for announcements
                headers = {"Authorization": f"Bearer {self.api_key}"}
                params = {
                    "context_codes[]": context_codes,
                    "start_date": start_date,
                    "end_date": end_date,
                    "active_only": "true"
                }

                url = f"{self.canvas_url}/api/v1/announcements"
                response = requests.get(url, headers=headers, params=params)

                if response.status_code != 200:
                    print(f"Error getting announcements: {response.status_code} - {response.text}")
                    return []

                announcements_data = response.json()

                # Format announcements
                formatted_announcements = []
                for announcement in announcements_data:
                    # Extract course ID from context_code
                    context_code = announcement.get("context_code", "")
                    announcement_course_id = context_code.replace("course_", "") if context_code.startswith("course_") else None

                    # Format announcement data
                    formatted_announcement = {
                        "id": announcement.get("id"),
                        "title": announcement.get("title"),
                        "message": announcement.get("message"),
                        "posted_at": announcement.get("posted_at"),
                        "course_id": announcement_course_id,
                        "context_code": announcement.get("context_code")
                    }

                    formatted_announcements.append(formatted_announcement)

                # Sort by posted_at (newest first)
                formatted_announcements.sort(key=lambda a: a.get("posted_at", ""), reverse=True)

                return formatted_announcements
            except Exception as e:
                print(f"Error getting announcements: {str(e)}")
                return []

        except Exception as e:
            print(f"Error in get_course_announcements: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []

    @canvas_cache(ttl_seconds=300)  # Cache for 5 minutes
    async def get_detailed_grades(self, user_id: str, course_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get detailed grade information for a specific course or all courses.

        Args:
            user_id: Firebase user ID
            course_id: Optional Canvas course ID. If not provided, get grades for all courses.

        Returns:
            Dictionary containing detailed grade information
        """
        try:
            print(f"Getting detailed grades for user {user_id}" + (f" and course {course_id}" if course_id else ""))

            # Initialize Canvas with user credentials
            credentials = await self.firestore_service.get_canvas_credentials(user_id)

            if not credentials:
                print(f"No Canvas credentials found for user {user_id}")
                return {"error": "Canvas credentials not found"}

            self.canvas_url = credentials.get("canvas_url")
            self.api_key = credentials.get("api_key")

            # Validate credentials before initializing
            is_valid = await self.validate_canvas_credentials(self.canvas_url, self.api_key)
            if not is_valid:
                print("Canvas credentials validation failed. Please check your Canvas API key and URL.")
                return {"error": "Invalid Canvas credentials. Please regenerate your Canvas API token."}

            self.initialize_canvas()

            if not self.canvas:
                print("Canvas client not initialized, cannot get grades")
                return {"error": "Canvas client initialization failed"}

            # Get courses
            courses_to_check = []
            if course_id:
                try:
                    canvas_course = self.canvas.get_course(course_id)
                    courses_to_check.append(canvas_course)
                except Exception as e:
                    print(f"Error getting course {course_id}: {str(e)}")
                    return {"error": f"Failed to get course: {str(e)}"}
            else:
                # Get user's current courses
                try:
                    user = self.canvas.get_current_user()
                    courses = user.get_courses(include=["total_scores"])
                    courses_to_check = list(courses)
                except Exception as e:
                    print(f"Error getting courses: {str(e)}")
                    return {"error": f"Failed to get courses: {str(e)}"}

            if not courses_to_check:
                print("No courses found, cannot get grades")
                return {"error": "No courses found"}

            # Get grades for each course
            result = {
                "courses": []
            }

            for course in courses_to_check:
                try:
                    # Get assignments for the course
                    assignments = course.get_assignments()

                    # Get submissions for the user
                    submissions = []
                    for assignment in assignments:
                        try:
                            # Get user's submission for this assignment
                            user_submissions = assignment.get_submissions(user_id=user.id)
                            for submission in user_submissions:
                                if submission.user_id == user.id:
                                    submissions.append({
                                        "id": submission.id,
                                        "assignment_id": assignment.id,
                                        "assignment_name": assignment.name,
                                        "score": submission.score,
                                        "grade": submission.grade,
                                        "submitted_at": submission.submitted_at,
                                        "late": submission.late,
                                        "missing": getattr(submission, "missing", False),
                                        "points_possible": assignment.points_possible
                                    })
                                    break
                        except Exception as e:
                            print(f"Error getting submission for assignment {assignment.name}: {str(e)}")
                            continue

                    # Get enrollment for the course to get overall grade
                    enrollments = course.get_enrollments(user_id=user.id)
                    enrollment = next((e for e in enrollments if e.user_id == user.id), None)

                    current_grade = None
                    final_grade = None
                    if enrollment:
                        current_grade = getattr(enrollment, "computed_current_grade", None)
                        final_grade = getattr(enrollment, "computed_final_grade", None)

                    # Format course grade data
                    course_data = {
                        "id": course.id,
                        "name": course.name,
                        "course_code": course.course_code,
                        "current_grade": current_grade,
                        "final_grade": final_grade,
                        "submissions": submissions
                    }

                    result["courses"].append(course_data)
                except Exception as e:
                    print(f"Error getting grades for course {course.name}: {str(e)}")
                    continue

            return result
        except Exception as e:
            print(f"Error in get_detailed_grades: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return {"error": str(e)}

    @canvas_cache(ttl_seconds=600)  # Cache for 10 minutes
    async def get_course_schedule(self, user_id: str, course_id: str) -> Dict[str, Any]:
        """
        Get the schedule for a specific course.

        Args:
            user_id: Firebase user ID
            course_id: Canvas course ID

        Returns:
            Dictionary containing course schedule information
        """
        try:
            print(f"Getting schedule for course {course_id} for user {user_id}")

            # Initialize Canvas with user credentials
            credentials = await self.firestore_service.get_canvas_credentials(user_id)

            if not credentials:
                print(f"No Canvas credentials found for user {user_id}")
                return {"error": "Canvas credentials not found"}

            self.canvas_url = credentials.get("canvas_url")
            self.api_key = credentials.get("api_key")

            # Validate credentials before initializing
            is_valid = await self.validate_canvas_credentials(self.canvas_url, self.api_key)
            if not is_valid:
                print("Canvas credentials validation failed. Please check your Canvas API key and URL.")
                return {"error": "Invalid Canvas credentials. Please regenerate your Canvas API token."}

            self.initialize_canvas()

            if not self.canvas:
                print("Canvas client not initialized, cannot get course schedule")
                return {"error": "Canvas client initialization failed"}

            # Get the course
            try:
                canvas_course = self.canvas.get_course(course_id)

                # Get calendar events for the course
                # We need to use the REST API directly since canvasapi doesn't have a method for calendar events
                headers = {"Authorization": f"Bearer {self.api_key}"}
                params = {
                    "context_codes[]": [f"course_{course_id}"],
                    "type": "event",
                    "start_date": datetime.now().strftime("%Y-%m-%d"),
                    "end_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")
                }

                url = f"{self.canvas_url}/api/v1/calendar_events"
                response = requests.get(url, headers=headers, params=params)

                if response.status_code != 200:
                    print(f"Error getting calendar events: {response.status_code} - {response.text}")
                    return {"error": "Failed to get calendar events"}

                events_data = response.json()

                # Format events
                formatted_events = []
                for event in events_data:
                    formatted_event = {
                        "id": event.get("id"),
                        "title": event.get("title"),
                        "description": event.get("description"),
                        "start_at": event.get("start_at"),
                        "end_at": event.get("end_at"),
                        "location_name": event.get("location_name")
                    }

                    formatted_events.append(formatted_event)

                # Sort by start_at
                formatted_events.sort(key=lambda e: e.get("start_at", ""))

                # Get course data
                course_data = {
                    "id": canvas_course.id,
                    "name": canvas_course.name,
                    "course_code": canvas_course.course_code,
                    "events": formatted_events
                }

                return course_data
            except Exception as e:
                print(f"Error getting course schedule: {str(e)}")
                return {"error": f"Failed to get course schedule: {str(e)}"}

        except Exception as e:
            print(f"Error in get_course_schedule: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return {"error": str(e)}