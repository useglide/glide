"""
Agent tools for Canvas data retrieval.
These tools wrap the existing Canvas service functions to be used by the LangChain agent.
"""
from typing import Dict, Any, List, Optional
from langchain_core.tools import tool
from app.services.canvas_service import canvas_service

class CanvasAgentTools:
    """Tools for Canvas data retrieval to be used by the LangChain agent."""
    
    def __init__(self, credentials: Dict[str, str]):
        """
        Initialize the tools with user credentials.
        
        Args:
            credentials: Dict with canvasUrl and canvasApiKey
        """
        self.credentials = credentials
    
    @tool
    async def get_user_info(self) -> Dict[str, Any]:
        """
        Get current user information from Canvas.
        Use this tool when you need to know about the user's profile information.
        """
        return await canvas_service.get_user_info(self.credentials)
    
    @tool
    async def get_all_courses(self) -> List[Dict[str, Any]]:
        """
        Get all available courses for the user.
        Use this tool when you need a list of all courses the user has access to.
        """
        return await canvas_service.get_courses(
            self.credentials,
            include_terms=True,
            include_teachers=True,
            include_scores=True
        )
    
    @tool
    async def get_current_courses(self, course_ids: List[int]) -> List[Dict[str, Any]]:
        """
        Get current courses by IDs.
        
        Args:
            course_ids: List of course IDs to retrieve
            
        Use this tool when you need detailed information about specific current courses.
        """
        courses = await canvas_service.get_courses(
            self.credentials,
            include_terms=True,
            include_teachers=True,
            include_scores=True
        )
        
        # Filter courses by IDs
        return [course for course in courses if course['id'] in course_ids]
    
    @tool
    async def get_course_details(self, course_id: int) -> Dict[str, Any]:
        """
        Get detailed information for a specific course.
        
        Args:
            course_id: The ID of the course
            
        Use this tool when you need comprehensive details about a specific course.
        """
        return await canvas_service.get_course_details(self.credentials, course_id)
    
    @tool
    async def get_course_syllabus(self, course_id: int) -> Dict[str, Any]:
        """
        Get the syllabus for a specific course.
        
        Args:
            course_id: The ID of the course
            
        Use this tool when you need to see the syllabus content for a course.
        """
        return await canvas_service.get_course_syllabus(self.credentials, course_id)
    
    @tool
    async def get_course_assignments(self, course_id: int, include_submission: bool = False) -> List[Dict[str, Any]]:
        """
        Get assignments for a specific course.
        
        Args:
            course_id: The ID of the course
            include_submission: Whether to include submission details
            
        Use this tool when you need a list of all assignments for a specific course.
        """
        return await canvas_service.get_course_assignments(
            self.credentials,
            course_id,
            include_submission=include_submission
        )
    
    @tool
    async def get_assignment_details(self, course_id: int, assignment_id: int) -> Dict[str, Any]:
        """
        Get detailed information for a specific assignment.
        
        Args:
            course_id: The ID of the course
            assignment_id: The ID of the assignment
            
        Use this tool when you need comprehensive details about a specific assignment.
        """
        return await canvas_service.get_assignment_details(
            self.credentials,
            course_id,
            assignment_id
        )
    
    @tool
    async def get_upcoming_assignments(self, course_id: int, days: int = 14) -> List[Dict[str, Any]]:
        """
        Get upcoming assignments for a specific course.
        
        Args:
            course_id: The ID of the course
            days: Number of days to look ahead (default: 14)
            
        Use this tool when you need to know what assignments are coming up in the next few days.
        """
        return await canvas_service.get_upcoming_assignments(
            self.credentials,
            course_id,
            days
        )
