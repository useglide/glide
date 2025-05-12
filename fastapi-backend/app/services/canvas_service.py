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

# Create service instance
canvas_service = CanvasService()
