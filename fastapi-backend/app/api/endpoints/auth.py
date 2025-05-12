from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.models.user import UserCreate, UserLogin, Token
from app.models.canvas import CanvasCredentials
from app.services.firebase_service import firebase_service

router = APIRouter()

@router.post("/canvas-credentials", response_model=Dict[str, Any])
async def store_canvas_credentials(
    credentials: CanvasCredentials,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Store Canvas credentials for a user
    """
    try:
        uid = current_user["uid"]
        result = await firebase_service.store_canvas_credentials(uid, credentials.dict())
        return {"message": "Canvas credentials stored successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store Canvas credentials: {str(e)}"
        )

@router.get("/canvas-credentials", response_model=CanvasCredentials)
async def get_canvas_credentials(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get Canvas credentials for a user
    """
    try:
        uid = current_user["uid"]
        credentials = await firebase_service.get_canvas_credentials(uid)
        return credentials
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Canvas credentials: {str(e)}"
        )
