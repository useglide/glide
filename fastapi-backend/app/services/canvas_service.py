from typing import Dict, List, Any, Optional
from canvasapi import Canvas
from canvasapi.exceptions import CanvasException

class CanvasService:
    """Service for Canvas API operations using canvasapi library"""

    @staticmethod
    def create_canvas_client(credentials: Dict[str, str]) -> Canvas:
        """
        Create a Canvas API client with the provided credentials

        Args:
            credentials: Dict with canvasUrl and canvasApiKey

        Returns:
            Canvas client instance
        """
        canvas_url = credentials.get('canvasUrl')
        canvas_api_key = credentials.get('canvasApiKey')

        if not canvas_url or not canvas_api_key:
            raise ValueError('Canvas URL and API key are required')

        return Canvas(canvas_url, canvas_api_key)

    @staticmethod
    async def get_user_info(credentials: Dict[str, str]) -> Dict[str, Any]:
        """
        Get current user information

        Args:
            credentials: Dict with canvasUrl and canvasApiKey

        Returns:
            User data
        """
        try:
            canvas = CanvasService.create_canvas_client(credentials)
            user = canvas.get_current_user()

            # Convert user object to dict
            user_data = {
                'id': user.id,
                'name': user.name,
                'email': getattr(user, 'email', None),
                'login_id': getattr(user, 'login_id', None),
                'avatar_url': getattr(user, 'avatar_url', None),
                'bio': getattr(user, 'bio', None),
                'primary_email': getattr(user, 'primary_email', None),
                'time_zone': getattr(user, 'time_zone', None),
                'locale': getattr(user, 'locale', None)
            }

            return user_data
        except CanvasException as error:
            print(f'Error getting user info: {error}')
            raise

    @staticmethod
    async def get_courses(credentials: Dict[str, str], include_terms: bool = True,
                         include_teachers: bool = True, include_scores: bool = True) -> List[Dict[str, Any]]:
        """
        Get all available courses

        Args:
            credentials: Dict with canvasUrl and canvasApiKey
            include_terms: Whether to include terms
            include_teachers: Whether to include teachers
            include_scores: Whether to include total scores

        Returns:
            List of courses
        """
        try:
            canvas = CanvasService.create_canvas_client(credentials)

            # Build parameters
            params = {'state': ['available']}
            includes = []

            if include_terms:
                includes.append('term')
            if include_teachers:
                includes.append('teachers')
            if include_scores:
                includes.append('total_scores')

            if includes:
                params['include'] = includes

            # Get courses
            courses = canvas.get_courses(**params)

            # Convert course objects to dicts
            course_list = []
            for course in courses:
                course_dict = {
                    'id': course.id,
                    'name': course.name,
                    'course_code': getattr(course, 'course_code', None),
                    'workflow_state': getattr(course, 'workflow_state', None),
                    'start_at': getattr(course, 'start_at', None),
                    'end_at': getattr(course, 'end_at', None),
                    'enrollment_term_id': getattr(course, 'enrollment_term_id', None),
                    'public_description': getattr(course, 'public_description', None),
                    'syllabus_body': getattr(course, 'syllabus_body', None),
                    'default_view': getattr(course, 'default_view', None),
                    'image_download_url': getattr(course, 'image_download_url', None),
                }

                # Add term if available
                if include_terms and hasattr(course, 'term'):
                    course_dict['term'] = {
                        'id': course.term.get('id'),
                        'name': course.term.get('name'),
                        'start_at': course.term.get('start_at'),
                        'end_at': course.term.get('end_at')
                    }

                # Add teachers if available
                if include_teachers and hasattr(course, 'teachers'):
                    course_dict['teachers'] = [
                        {
                            'id': teacher.get('id'),
                            'display_name': teacher.get('display_name'),
                            'avatar_image_url': teacher.get('avatar_image_url')
                        }
                        for teacher in course.teachers
                    ]

                # Add enrollments if available
                if hasattr(course, 'enrollments'):
                    course_dict['enrollments'] = course.enrollments

                course_list.append(course_dict)

            return course_list
        except CanvasException as error:
            print(f'Error getting courses: {error}')
            raise

    @staticmethod
    async def get_course_assignments(credentials: Dict[str, str], course_id: int,
                                    include_submission: bool = False) -> List[Dict[str, Any]]:
        """
        Get assignments for a specific course

        Args:
            credentials: Dict with canvasUrl and canvasApiKey
            course_id: Course ID
            include_submission: Whether to include submission

        Returns:
            List of assignments
        """
        try:
            canvas = CanvasService.create_canvas_client(credentials)
            course = canvas.get_course(course_id)

            # Build parameters
            params = {}
            if include_submission:
                params['include'] = ['submission']

            # Get assignments
            assignments = course.get_assignments(**params)

            # Convert assignment objects to dicts
            assignment_list = []
            for assignment in assignments:
                assignment_dict = {
                    'id': assignment.id,
                    'name': assignment.name,
                    'description': getattr(assignment, 'description', None),
                    'due_at': getattr(assignment, 'due_at', None),
                    'points_possible': getattr(assignment, 'points_possible', None),
                    'grading_type': getattr(assignment, 'grading_type', None),
                    'submission_types': getattr(assignment, 'submission_types', None),
                    'html_url': getattr(assignment, 'html_url', None),
                    'published': getattr(assignment, 'published', None),
                    'allowed_attempts': getattr(assignment, 'allowed_attempts', None),
                    'unlock_at': getattr(assignment, 'unlock_at', None),
                    'lock_at': getattr(assignment, 'lock_at', None),
                }

                # Add submission if available
                if include_submission and hasattr(assignment, 'submission'):
                    assignment_dict['submission'] = {
                        'id': assignment.submission.get('id'),
                        'submitted_at': assignment.submission.get('submitted_at'),
                        'score': assignment.submission.get('score'),
                        'grade': assignment.submission.get('grade'),
                        'late': assignment.submission.get('late'),
                        'missing': assignment.submission.get('missing'),
                        'workflow_state': assignment.submission.get('workflow_state')
                    }

                assignment_list.append(assignment_dict)

            return assignment_list
        except CanvasException as error:
            print(f'Error getting course assignments: {error}')
            raise

    @staticmethod
    async def get_course_syllabus(credentials: Dict[str, str], course_id: int) -> Dict[str, Any]:
        """Get the syllabus for a specific course"""
        if CanvasService.is_mock_credentials(credentials):
            return {"syllabus_body": "<h1>Mock Syllabus</h1><p>This is a mock syllabus for development purposes.</p>"}

        try:
            canvas = CanvasService.create_canvas_client(credentials)
            course = canvas.get_course(course_id)
            return {"syllabus_body": getattr(course, "syllabus_body", "No syllabus available")}
        except CanvasException as error:
            print(f'Error getting course syllabus: {error}')
            raise

    @staticmethod
    async def get_course_professor(credentials: Dict[str, str], course_id: int) -> Dict[str, Any]:
        """Get the professor information for a specific course"""
        if CanvasService.is_mock_credentials(credentials):
            return {
                "id": 9876,
                "display_name": "Dr. Mock Professor",
                "avatar_image_url": "https://example.com/avatar.png",
                "email": "professor@example.com"
            }

        try:
            canvas = CanvasService.create_canvas_client(credentials)
            course = canvas.get_course(course_id, include=["teachers"])

            if not hasattr(course, "teachers") or not course.teachers:
                return {"error": "No professor information available"}

            professor = course.teachers[0]
            return {
                "id": professor.get("id"),
                "display_name": professor.get("display_name"),
                "avatar_image_url": professor.get("avatar_image_url"),
                "email": professor.get("email", "No email available")
            }
        except CanvasException as error:
            print(f'Error getting course professor: {error}')
            raise

    @staticmethod
    async def get_course_details(credentials: Dict[str, str], course_id: int) -> Dict[str, Any]:
        """Get detailed information for a specific course"""
        if CanvasService.is_mock_credentials(credentials):
            return {
                "id": course_id,
                "name": "Mock Course 101",
                "course_code": "MOCK101",
                "workflow_state": "available",
                "start_at": "2023-09-01T00:00:00Z",
                "end_at": "2023-12-15T00:00:00Z",
                "syllabus_body": "<h1>Mock Syllabus</h1><p>This is a mock syllabus for development purposes.</p>",
                "term": {"id": 123, "name": "Fall 2023"},
                "teachers": [{"id": 9876, "display_name": "Dr. Mock Professor"}]
            }

        try:
            canvas = CanvasService.create_canvas_client(credentials)
            course = canvas.get_course(course_id, include=["term", "teachers", "syllabus_body"])

            course_details = {
                "id": course.id,
                "name": course.name,
                "course_code": getattr(course, "course_code", None),
                "workflow_state": getattr(course, "workflow_state", None),
                "start_at": getattr(course, "start_at", None),
                "end_at": getattr(course, "end_at", None),
                "syllabus_body": getattr(course, "syllabus_body", None)
            }

            # Add term if available
            if hasattr(course, "term"):
                course_details["term"] = {
                    "id": course.term.get("id"),
                    "name": course.term.get("name")
                }

            # Add teachers if available
            if hasattr(course, "teachers"):
                course_details["teachers"] = [
                    {
                        "id": teacher.get("id"),
                        "display_name": teacher.get("display_name")
                    }
                    for teacher in course.teachers
                ]

            return course_details
        except CanvasException as error:
            print(f'Error getting course details: {error}')
            raise

    @staticmethod
    async def get_assignment_details(credentials: Dict[str, str], course_id: int, assignment_id: int) -> Dict[str, Any]:
        """Get detailed information for a specific assignment"""
        if CanvasService.is_mock_credentials(credentials):
            return {
                "id": assignment_id,
                "name": "Mock Assignment",
                "description": "<p>This is a mock assignment description.</p>",
                "due_at": "2023-10-15T23:59:59Z",
                "points_possible": 100,
                "submission_types": ["online_upload"],
                "course_id": course_id
            }

        try:
            canvas = CanvasService.create_canvas_client(credentials)
            course = canvas.get_course(course_id)
            assignment = course.get_assignment(assignment_id)

            return {
                "id": assignment.id,
                "name": assignment.name,
                "description": getattr(assignment, "description", None),
                "due_at": getattr(assignment, "due_at", None),
                "points_possible": getattr(assignment, "points_possible", None),
                "grading_type": getattr(assignment, "grading_type", None),
                "submission_types": getattr(assignment, "submission_types", None),
                "html_url": getattr(assignment, "html_url", None),
                "published": getattr(assignment, "published", None),
                "course_id": course_id
            }
        except CanvasException as error:
            print(f'Error getting assignment details: {error}')
            raise

    @staticmethod
    async def get_upcoming_assignments(credentials: Dict[str, str], course_id: int, days: int = 14) -> List[Dict[str, Any]]:
        """Get upcoming assignments for a specific course"""
        from datetime import datetime, timedelta

        if CanvasService.is_mock_credentials(credentials):
            today = datetime.now()
            return [
                {
                    "id": 1001,
                    "name": "Mock Assignment 1",
                    "due_at": (today + timedelta(days=3)).isoformat(),
                    "points_possible": 50
                },
                {
                    "id": 1002,
                    "name": "Mock Assignment 2",
                    "due_at": (today + timedelta(days=7)).isoformat(),
                    "points_possible": 75
                },
                {
                    "id": 1003,
                    "name": "Mock Assignment 3",
                    "due_at": (today + timedelta(days=10)).isoformat(),
                    "points_possible": 100
                }
            ]

        try:
            canvas = CanvasService.create_canvas_client(credentials)
            course = canvas.get_course(course_id)

            # Calculate date range
            today = datetime.now()
            end_date = today + timedelta(days=days)

            # Get assignments due in the specified date range
            assignments = course.get_assignments(bucket="upcoming")

            upcoming_assignments = []
            for assignment in assignments:
                # Skip assignments without due dates
                if not getattr(assignment, "due_at", None):
                    continue

                # Parse due date
                due_date = datetime.fromisoformat(assignment.due_at.replace('Z', '+00:00'))

                # Check if assignment is due within the specified range
                if today <= due_date <= end_date:
                    upcoming_assignments.append({
                        "id": assignment.id,
                        "name": assignment.name,
                        "due_at": assignment.due_at,
                        "points_possible": getattr(assignment, "points_possible", None),
                        "html_url": getattr(assignment, "html_url", None)
                    })

            return upcoming_assignments
        except CanvasException as error:
            print(f'Error getting upcoming assignments: {error}')
            raise

# Create service instance
canvas_service = CanvasService()
