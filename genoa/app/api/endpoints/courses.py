from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.services.canvas_service import CanvasService
from app.core.auth import get_current_user, get_canvas_service

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/{course_id}/syllabus")
async def get_course_syllabus(
    course_id: int,
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> Dict[str, Any]:
    """
    Get the syllabus for a specific course.
    """
    try:
        syllabus = await canvas_service.get_course_syllabus(course_id)
        return {"syllabus": syllabus}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course syllabus: {str(e)}")

@router.get("/{course_id}/professor")
async def get_course_professor(
    course_id: int,
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> Dict[str, Any]:
    """
    Get professor information for a specific course.
    """
    try:
        professor = await canvas_service.get_course_professor(course_id)
        return professor
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get professor information: {str(e)}")

@router.get("/{course_id}")
async def get_course(
    course_id: int,
    canvas_service: CanvasService = Depends(get_canvas_service)
) -> Dict[str, Any]:
    """
    Get detailed information for a specific course.
    """
    try:
        course = await canvas_service.get_course(course_id)
        return course
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course details: {str(e)}")
