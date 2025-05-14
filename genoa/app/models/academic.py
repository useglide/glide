"""
Academic Models

This module contains Pydantic models for academic improvement endpoints.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class StudyPlanRequest(BaseModel):
    """Request model for study plan endpoint."""
    subject: Optional[str] = None
    course_id: Optional[int] = None
    days_ahead: int = 14
    conversation_id: Optional[str] = None


class StudyPlanResponse(BaseModel):
    """Response model for study plan endpoint."""
    response: str
    study_plan: Dict[str, Any]
    conversation_id: str
