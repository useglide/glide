from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any

from app.services.canvas_service import CanvasService
from app.core.auth import get_current_user, get_canvas_service

router = APIRouter(prefix="/canvas", tags=["canvas"])

@router.get("/user")
async def get_user_info(
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> Dict[str, Any]:
    """
    Get information about the current user.
    """
    try:
        user_info = await canvas_service.get_user_info()
        return user_info
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user information: {str(e)}")

@router.get("/courses")
async def get_courses(
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> List[Dict[str, Any]]:
    """
    Get all available courses for the user.
    """
    try:
        courses = await canvas_service.get_courses()
        return courses
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get courses: {str(e)}")

@router.get("/courses/current")
async def get_current_courses(
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> List[Dict[str, Any]]:
    """
    Get current courses (filtered by Firestore).
    Note: This is a simplified version that just returns all courses.
    In a real implementation, you would filter based on Firestore data.
    """
    try:
        courses = await canvas_service.get_courses()
        # In a real implementation, you would filter courses based on Firestore data
        return courses
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get current courses: {str(e)}")

@router.get("/courses/{course_id}/assignments")
async def get_course_assignments(
    course_id: int,
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> List[Dict[str, Any]]:
    """
    Get assignments for a specific course.
    """
    try:
        assignments = await canvas_service.get_assignments(course_id)
        return assignments
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course assignments: {str(e)}")

@router.get("/two-stage-data")
async def get_two_stage_data(
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> Dict[str, Any]:
    """
    Get current courses and their assignments in one call.
    """
    try:
        data = await canvas_service.get_two_stage_data()
        return data
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get two-stage data: {str(e)}")
