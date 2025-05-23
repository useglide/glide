"""
API endpoints for Canvas authentication diagnostics.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_user
from app.utils.canvas_auth_helper import diagnose_canvas_auth_issues, update_canvas_credentials

router = APIRouter()


class UpdateCanvasCredentialsRequest(BaseModel):
    """Request model for updating Canvas credentials."""
    canvas_url: str
    api_key: str


@router.get("/diagnose", response_model=Dict[str, Any])
async def diagnose_canvas_auth(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Diagnose Canvas API authentication issues for the current user.

    This endpoint helps users identify and fix issues with their Canvas API authentication.
    """
    if not current_user or not current_user.get("uid"):
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = current_user.get("uid")

    # Run diagnostics
    result = await diagnose_canvas_auth_issues(user_id)

    return result


@router.post("/update-credentials", response_model=Dict[str, Any])
async def update_canvas_auth_credentials(
    request: UpdateCanvasCredentialsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update Canvas API credentials for the current user.

    This endpoint allows users to update their Canvas API credentials when they need to regenerate their API token.
    """
    if not current_user or not current_user.get("uid"):
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = current_user.get("uid")

    # Update credentials
    result = await update_canvas_credentials(user_id, request.canvas_url, request.api_key)

    if not result.get("success", False):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to update Canvas credentials"))

    return result
