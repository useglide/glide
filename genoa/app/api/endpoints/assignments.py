from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Any

from app.services.canvas_service import CanvasService
from app.core.auth import get_current_user, get_canvas_service

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.get("/course/{course_id}")
async def get_course_assignments(
    course_id: int,
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> List[Dict[str, Any]]:
    """
    Get all assignments for a specific course.
    Note: This is redundant with canvas.py:/courses/{course_id}/assignments.
    """
    try:
        assignments = await canvas_service.get_assignments(course_id)
        return assignments
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course assignments: {str(e)}")

@router.get("/{assignment_id}")
async def get_assignment(
    assignment_id: int,
    course_id: int = Query(..., description="The ID of the course"),
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> Dict[str, Any]:
    """
    Get detailed information for a specific assignment.
    """
    try:
        assignment = await canvas_service.get_assignment(course_id, assignment_id)
        return assignment
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get assignment details: {str(e)}")

@router.get("/upcoming/course/{course_id}")
async def get_upcoming_assignments(
    course_id: int,
    days: int = Query(7, description="Number of days to look ahead"),
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> List[Dict[str, Any]]:
    """
    Get upcoming assignments for a specific course within the specified number of days.
    """
    try:
        upcoming = await canvas_service.get_upcoming_assignments(course_id, days)
        return upcoming
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get upcoming assignments: {str(e)}")
