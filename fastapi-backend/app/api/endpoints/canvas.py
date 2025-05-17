from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional, List

from app.services.canvas_service import CanvasService
from app.core.security import get_current_user

router = APIRouter()


@router.get("/courses", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_courses(
    user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get the authenticated user's Canvas courses.

    Args:
        user: Authenticated user information

    Returns:
        List of Canvas courses
    """
    try:
        # Get user ID and token
        user_id = user.get("uid")
        id_token = getattr(user, "token", None)  # Get the token if available

        print(f"Getting courses for user ID: {user_id}")

        # Initialize Canvas service
        canvas_service = CanvasService()

        # Get courses with both user ID and token
        courses = await canvas_service.get_courses(user_id, id_token)

        return courses
    except Exception as e:
        # Log the error
        print(f"Error getting Canvas courses: {str(e)}")

        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving your Canvas courses. Please try again later."
        )
