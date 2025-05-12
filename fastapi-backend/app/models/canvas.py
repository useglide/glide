from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CanvasCredentials(BaseModel):
    """Canvas credentials model"""
    canvasUrl: str
    canvasApiKey: str
    
class Teacher(BaseModel):
    """Teacher model"""
    id: int
    display_name: str
    avatar_image_url: Optional[str] = None
    
class Term(BaseModel):
    """Term model"""
    id: int
    name: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    
class Enrollment(BaseModel):
    """Enrollment model"""
    type: str
    role: str
    computed_current_score: Optional[float] = None
    computed_final_score: Optional[float] = None
    
class Course(BaseModel):
    """Course model"""
    id: int
    name: str
    course_code: Optional[str] = None
    workflow_state: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    enrollment_term_id: Optional[int] = None
    public_description: Optional[str] = None
    syllabus_body: Optional[str] = None
    default_view: Optional[str] = None
    image_download_url: Optional[str] = None
    term: Optional[Term] = None
    teachers: Optional[List[Teacher]] = None
    enrollments: Optional[List[Dict[str, Any]]] = None
    
class Submission(BaseModel):
    """Submission model"""
    id: int
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    grade: Optional[str] = None
    late: Optional[bool] = None
    missing: Optional[bool] = None
    workflow_state: Optional[str] = None
    
class Assignment(BaseModel):
    """Assignment model"""
    id: int
    name: str
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    points_possible: Optional[float] = None
    grading_type: Optional[str] = None
    submission_types: Optional[List[str]] = None
    html_url: Optional[str] = None
    published: Optional[bool] = None
    allowed_attempts: Optional[int] = None
    unlock_at: Optional[datetime] = None
    lock_at: Optional[datetime] = None
    submission: Optional[Submission] = None
