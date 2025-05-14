"""
Express.js Backend Tools for LangChain

This module provides LangChain tools for accessing data from the Express.js backend cache.
"""

import json
from typing import Dict, List, Any, Optional
from langchain.tools import Tool

from app.services.express_service import ExpressService


class ExpressTools:
    """
    A class that provides LangChain tools for accessing Express.js backend cached data.
    These tools are used by the AI agent to fetch data from the Express.js cache.
    """

    def __init__(self, express_service: ExpressService):
        """
        Initialize the Express tools with an Express service instance.

        Args:
            express_service: An instance of ExpressService for the current user
        """
        self.express_service = express_service

    async def get_cached_courses(self) -> List[Dict[str, Any]]:
        """Get all courses from the Express.js cache."""
        try:
            data = await self.express_service.get_two_stage_data()
            return data.get("courses", [])
        except Exception as e:
            print(f"Error getting cached courses: {str(e)}")
            return []

    async def get_cached_assignments(self) -> List[Dict[str, Any]]:
        """Get all assignments from the Express.js cache."""
        try:
            data = await self.express_service.get_two_stage_data()
            return data.get("assignments", [])
        except Exception as e:
            print(f"Error getting cached assignments: {str(e)}")
            return []

    async def get_cached_announcements(self) -> List[Dict[str, Any]]:
        """Get all announcements from the Express.js cache."""
        try:
            data = await self.express_service.get_two_stage_data()
            return data.get("announcements", [])
        except Exception as e:
            print(f"Error getting cached announcements: {str(e)}")
            return []

    async def get_cached_course_details(self) -> List[Dict[str, Any]]:
        """Get detailed information for all courses from the Express.js cache."""
        try:
            data = await self.express_service.get_detailed_course_data()
            return data.get("courses", [])
        except Exception as e:
            print(f"Error getting cached course details: {str(e)}")
            return []

    async def get_cached_course_assignments(self, course_id: int) -> List[Dict[str, Any]]:
        """Get assignments for a specific course from the Express.js cache."""
        try:
            data = await self.express_service.get_detailed_course_data()
            courses = data.get("courses", [])
            
            # Find the course with the matching ID
            for course in courses:
                if course.get("id") == course_id:
                    return course.get("assignments", [])
            
            return []
        except Exception as e:
            print(f"Error getting cached course assignments: {str(e)}")
            return []

    async def get_cached_grades(self) -> List[Dict[str, Any]]:
        """Get all grades from the Express.js cache."""
        try:
            data = await self.express_service.get_combined_course_data()
            return data.get("grades", [])
        except Exception as e:
            print(f"Error getting cached grades: {str(e)}")
            return []

    async def find_course_by_id(self, course_id: int) -> Optional[Dict[str, Any]]:
        """Find a course by its ID in the Express.js cache."""
        try:
            courses = await self.get_cached_courses()
            
            # Find the course with the matching ID
            for course in courses:
                if course.get("id") == course_id:
                    return course
            
            # If not found in basic courses, try detailed courses
            detailed_courses = await self.get_cached_course_details()
            for course in detailed_courses:
                if course.get("id") == course_id:
                    return course
            
            return None
        except Exception as e:
            print(f"Error finding course by ID: {str(e)}")
            return None

    async def find_course_by_name(self, course_name: str) -> Optional[Dict[str, Any]]:
        """Find a course by its name in the Express.js cache."""
        try:
            courses = await self.get_cached_courses()
            
            # Find the course with a matching name (case-insensitive partial match)
            course_name_lower = course_name.lower()
            for course in courses:
                if course_name_lower in course.get("name", "").lower():
                    return course
            
            # If not found in basic courses, try detailed courses
            detailed_courses = await self.get_cached_course_details()
            for course in detailed_courses:
                if course_name_lower in course.get("name", "").lower():
                    return course
            
            return None
        except Exception as e:
            print(f"Error finding course by name: {str(e)}")
            return None

    def get_tools(self) -> List[Tool]:
        """
        Get a list of LangChain tools for accessing Express.js backend cached data.

        Returns:
            A list of LangChain Tool objects
        """
        return [
            Tool(
                name="get_cached_courses",
                func=lambda: self.get_cached_courses(),
                description="Get all courses from the Express.js cache. Use this tool to get information about the user's courses without making a new API call."
            ),
            Tool(
                name="get_cached_assignments",
                func=lambda: self.get_cached_assignments(),
                description="Get all assignments from the Express.js cache. Use this tool to get information about the user's assignments without making a new API call."
            ),
            Tool(
                name="get_cached_announcements",
                func=lambda: self.get_cached_announcements(),
                description="Get all announcements from the Express.js cache. Use this tool to get information about course announcements without making a new API call."
            ),
            Tool(
                name="get_cached_course_details",
                func=lambda: self.get_cached_course_details(),
                description="Get detailed information for all courses from the Express.js cache. Use this tool to get comprehensive information about the user's courses without making a new API call."
            ),
            Tool(
                name="get_cached_course_assignments",
                func=lambda course_id: self.get_cached_course_assignments(int(course_id)),
                description="Get assignments for a specific course from the Express.js cache. Input should be a course ID (integer). Use this tool to get assignments for a specific course without making a new API call."
            ),
            Tool(
                name="get_cached_grades",
                func=lambda: self.get_cached_grades(),
                description="Get all grades from the Express.js cache. Use this tool to get information about the user's grades without making a new API call."
            ),
            Tool(
                name="find_course_by_id",
                func=lambda course_id: self.find_course_by_id(int(course_id)),
                description="Find a course by its ID in the Express.js cache. Input should be a course ID (integer). Use this tool to find a specific course by its ID without making a new API call."
            ),
            Tool(
                name="find_course_by_name",
                func=lambda course_name: self.find_course_by_name(course_name),
                description="Find a course by its name in the Express.js cache. Input should be a course name (string). Use this tool to find a specific course by its name without making a new API call."
            )
        ]
