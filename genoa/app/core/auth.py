from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, Optional

from app.services.canvas_service import CanvasService
from app.core.config import settings

# This is a simplified authentication system
# In a real application, you would implement proper token validation and user management
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Get the current authenticated user based on the provided token.

    In a real application, you would validate the token and retrieve the user from a database.
    This is a simplified version that just returns a mock user.
    """
    # In a real application, you would validate the token and retrieve the user
    # For now, we'll just return a mock user
    if not token:
        # Use the Canvas API key from environment variables if no token is provided
        token = settings.CANVAS_API_KEY
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
        "canvas_token": canvas_token,
        "firebase_token": token
    }

async def get_canvas_service() -> CanvasService:
    """
    Get a Canvas service instance using the Canvas API key from settings.
    """
    # Get the Canvas token from settings
    canvas_token = settings.CANVAS_API_KEY
    if not canvas_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Canvas API key not found in settings",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CanvasService(base_url=settings.CANVAS_BASE_URL, access_token=canvas_token)

async def get_firebase_token(request: Request = None) -> Optional[str]:
    """
    Get the Firebase ID token from the request headers or environment variables.

    In a production environment, this would extract the token from the Authorization header
    and validate it with Firebase Admin SDK. For simplicity, we're using a mock token or
    the Canvas API key as a fallback.

    Args:
        request: FastAPI request object

    Returns:
        Firebase ID token or None if not available
    """
    # In a real application, you would extract and validate the token from the request
    # For now, we'll use the Canvas API key as a mock Firebase token
    return settings.CANVAS_API_KEY
