from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.security import get_current_user
from app.services.canvas_service import canvas_service
from app.services.firebase_service import firebase_service
from app.models.canvas import Course, Assignment

router = APIRouter()

@router.get("/user", response_model=Dict[str, Any])
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user information from Canvas
    """
    try:
        uid = current_user["uid"]
        credentials = await firebase_service.get_canvas_credentials(uid)
        user_data = await canvas_service.get_user_info(credentials)
        return user_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user data: {str(e)}"
        )

@router.get("/courses", response_model=List[Course])
async def get_courses(
    include_terms: bool = Query(True, description="Include terms"),
    include_teachers: bool = Query(True, description="Include teachers"),
    include_scores: bool = Query(True, description="Include total scores"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all available courses
    """
    try:
        uid = current_user["uid"]
        credentials = await firebase_service.get_canvas_credentials(uid)
        courses = await canvas_service.get_courses(
            credentials, 
            include_terms=include_terms,
            include_teachers=include_teachers,
            include_scores=include_scores
        )
        return courses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch courses: {str(e)}"
        )

@router.get("/courses/current", response_model=List[Course])
async def get_current_courses(
    include_terms: bool = Query(True, description="Include terms"),
    include_teachers: bool = Query(True, description="Include teachers"),
    include_scores: bool = Query(True, description="Include total scores"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get current courses from Firestore and Canvas
    """
    try:
        uid = current_user["uid"]
        credentials = await firebase_service.get_canvas_credentials(uid)
        
        # Get current course IDs from Firestore
        course_ids = await firebase_service.get_current_courses(uid)
        
        if not course_ids:
            return []
        
        # Get all courses from Canvas
        all_courses = await canvas_service.get_courses(
            credentials, 
            include_terms=include_terms,
            include_teachers=include_teachers,
            include_scores=include_scores
        )
        
        # Filter courses by IDs from Firestore
        current_courses = [course for course in all_courses if course['id'] in course_ids]
        
        return current_courses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch current courses: {str(e)}"
        )

@router.get("/courses/{course_id}/assignments", response_model=List[Assignment])
async def get_course_assignments(
    course_id: int,
    include_submission: bool = Query(False, description="Include submission"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get assignments for a specific course
    """
    try:
        uid = current_user["uid"]
        credentials = await firebase_service.get_canvas_credentials(uid)
        assignments = await canvas_service.get_course_assignments(
            credentials, 
            course_id,
            include_submission=include_submission
        )
        return assignments
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course assignments: {str(e)}"
        )

@router.get("/two-stage-data", response_model=Dict[str, Any])
async def get_two_stage_data(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get data in two stages: first current courses, then assignments
    """
    try:
        uid = current_user["uid"]
        start_time = __import__('time').time()
        
        # Get user's Canvas credentials
        try:
            credentials = await firebase_service.get_canvas_credentials(uid)
        except ValueError:
            return {
                "stage": "complete",
                "courses": [],
                "assignments": [],
                "timing": {
                    "totalTimeMs": int((__import__('time').time() - start_time) * 1000),
                    "totalTimeSec": round((__import__('time').time() - start_time), 2),
                    "formattedTime": f"{int((__import__('time').time() - start_time))}s",
                },
                "error": "Canvas credentials not found. Please set up your Canvas credentials."
            }
        
        # Stage 1: Get current courses
        courses = await canvas_service.get_courses(
            credentials, 
            include_terms=True,
            include_teachers=True,
            include_scores=True
        )
        
        # Get current course IDs from Firestore
        current_course_ids = await firebase_service.get_current_courses(uid)
        
        # Filter courses by IDs from Firestore
        current_courses = [course for course in courses if course['id'] in current_course_ids]
        
        # Stage 2: Get assignments for current courses
        all_assignments = []
        for course in current_courses:
            course_assignments = await canvas_service.get_course_assignments(
                credentials, 
                course['id'],
                include_submission=True
            )
            all_assignments.extend(course_assignments)
        
        end_time = __import__('time').time()
        total_time = end_time - start_time
        
        return {
            "stage": "complete",
            "courses": current_courses,
            "assignments": all_assignments,
            "timing": {
                "totalTimeMs": int(total_time * 1000),
                "totalTimeSec": round(total_time, 2),
                "formattedTime": f"{int(total_time)}s",
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch two-stage data: {str(e)}"
        )
