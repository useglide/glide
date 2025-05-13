from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from app.core.security import get_current_user
from app.services.canvas_service import canvas_service
from app.services.firebase_service import firebase_service

router = APIRouter()

@router.get("/course/{course_id}", response_model=Dict[str, Any])
async def get_course_assignments(course_id: int = Path(..., description="The ID of the course"), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all assignments for a specific course"""
    try:
        credentials = await firebase_service.get_canvas_credentials(current_user["uid"])
        return {"assignments": await canvas_service.get_course_assignments(credentials, course_id)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{assignment_id}", response_model=Dict[str, Any])
async def get_assignment_details(assignment_id: int = Path(..., description="The ID of the assignment"), course_id: int = Query(..., description="The ID of the course"), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get detailed information for a specific assignment"""
    try:
        credentials = await firebase_service.get_canvas_credentials(current_user["uid"])
        return await canvas_service.get_assignment_details(credentials, course_id, assignment_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/upcoming/course/{course_id}", response_model=List[Dict[str, Any]])
async def get_upcoming_assignments(course_id: int = Path(..., description="The ID of the course"), days: int = Query(14, description="Number of days to look ahead"), current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get upcoming assignments for a specific course"""
    try:
        credentials = await firebase_service.get_canvas_credentials(current_user["uid"])
        return await canvas_service.get_upcoming_assignments(credentials, course_id, days)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
