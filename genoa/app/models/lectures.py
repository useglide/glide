"""
Lecture Models

This module contains Pydantic models for lecture-related endpoints.
"""

from pydantic import BaseModel
from typing import Dict, Any


class LectureNotesResponse(BaseModel):
    """Response model for lecture notes endpoint."""
    notes: str
    lecture_id: str
    metadata: Dict[str, Any]
