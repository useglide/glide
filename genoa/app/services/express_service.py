"""
Express.js Backend Service

This module provides a service for interacting with the Express.js backend,
particularly for accessing cached data.
"""

import httpx
import json
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

from app.core.config import settings
from app.core.auth import get_firebase_token


class ExpressService:
    """
    Service for interacting with the Express.js backend.
    This service provides methods to access cached data from the Express.js backend.
    """

    def __init__(self, firebase_token: Optional[str] = None):
        """
        Initialize the Express.js service with optional Firebase token.

        Args:
            firebase_token: Firebase ID token for authentication
        """
        self.base_url = settings.EXPRESS_BACKEND_URL
        self.firebase_token = firebase_token
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Add authorization header if token is provided
        if firebase_token:
            self.headers["Authorization"] = f"Bearer {firebase_token}"

    async def _make_request(self, method: str, endpoint: str, params: Dict = None, data: Dict = None) -> Any:
        """
        Make a request to the Express.js backend.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            params: Query parameters
            data: Request body data

        Returns:
            Response data as JSON
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            async with httpx.AsyncClient() as client:
                if method.upper() == "GET":
                    response = await client.get(url, headers=self.headers, params=params)
                elif method.upper() == "POST":
                    response = await client.post(url, headers=self.headers, json=data)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"Error response from Express backend: {error_text}")
                    raise HTTPException(
                        status_code=response.status_code, 
                        detail=f"Express backend error: {error_text}"
                    )
                
                return response.json()
        except httpx.RequestError as e:
            print(f"Request error when accessing Express backend: {str(e)}")
            raise HTTPException(
                status_code=503, 
                detail=f"Failed to connect to Express backend: {str(e)}"
            )

    async def get_two_stage_data(self) -> Dict[str, Any]:
        """
        Get data from the two-stage endpoint.
        This includes current courses, announcements, and assignments.

        Returns:
            Two-stage data including courses, announcements, and assignments
        """
        return await self._make_request("GET", "two-stage-data")

    async def get_detailed_course_data(self) -> Dict[str, Any]:
        """
        Get detailed course data for all courses.
        This includes all courses (current and past) with their assignments.

        Returns:
            Detailed course data
        """
        return await self._make_request("GET", "courses/detailed")

    async def get_course_assignments(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Get assignments for a specific course.

        Args:
            course_id: Canvas course ID

        Returns:
            List of assignments for the course
        """
        return await self._make_request("GET", f"courses/{course_id}/assignments")

    async def get_combined_course_data(self) -> Dict[str, Any]:
        """
        Get combined course data, grades, and assignments.

        Returns:
            Combined course data
        """
        return await self._make_request("GET", "combined-course-data")

    async def get_all_data(self) -> Dict[str, Any]:
        """
        Get all data for the user.
        This includes user info, courses, announcements, calendar events, etc.

        Returns:
            All user data
        """
        return await self._make_request("GET", "all-data")


async def get_express_service() -> ExpressService:
    """
    Get an instance of the Express service with Firebase authentication.

    Returns:
        An authenticated ExpressService instance
    """
    # Get Firebase token for authentication
    firebase_token = await get_firebase_token()
    
    # Create and return the service
    return ExpressService(firebase_token=firebase_token)
