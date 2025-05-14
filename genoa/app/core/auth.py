from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, Optional

from app.services.canvas_service import CanvasService
from app.core.config import settings

# This is a simplified authentication system
# In a real application, you would implement proper token validation and user management
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Get the current authenticated user based on the provided token.

    In a real application, you would validate the token and retrieve the user from a database.
    This is a simplified version that just returns a mock user.
    """
    # In a real application, you would validate the token and retrieve the user
    # For now, we'll just return a mock user
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use the Canvas API key from environment variables if available
    canvas_token = settings.CANVAS_API_KEY or token

    # Mock user data
    return {
        "id": "user123",
        "username": "testuser",
        "email": "testuser@example.com",
        "canvas_token": canvas_token
    }

def get_canvas_service(user: Dict[str, Any] = Depends(get_current_user)) -> CanvasService:
    """
    Get a Canvas service instance for the current user.
    """
    # Get the Canvas token from the user object
    canvas_token = user.get("canvas_token")
    if not canvas_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Canvas token not found for user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CanvasService(base_url=settings.CANVAS_BASE_URL, access_token=canvas_token)
