from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional

from app.models.google_auth import (
    GoogleAuthUrlRequest,
    GoogleAuthUrlResponse,
    GoogleAuthCallbackRequest,
    GoogleAuthCallbackResponse,
    GoogleAuthStatusRequest,
    GoogleAuthStatusResponse
)
from app.services.google.google_auth_service import GoogleAuthService
from app.core.security import get_current_user, optional_auth

router = APIRouter()


@router.post("/auth-url", response_model=GoogleAuthUrlResponse, status_code=status.HTTP_200_OK)
async def get_google_auth_url(
    request: GoogleAuthUrlRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> GoogleAuthUrlResponse:
    """
    Get Google OAuth authorization URL for user registration.

    Args:
        request: Request containing user ID
        user: Authenticated user information

    Returns:
        GoogleAuthUrlResponse containing the authorization URL
    """
    try:
        # Verify that the user ID in the request matches the authenticated user
        if user.get("uid") != request.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID in request does not match authenticated user"
            )

        # Initialize GoogleAuthService
        auth_service = GoogleAuthService(user_id=request.user_id)

        # Get authorization URL
        auth_result = auth_service.initialize_auth_for_registration(request.user_id)

        if auth_result.get("status") == "url_generated" and auth_result.get("auth_url"):
            return GoogleAuthUrlResponse(
                auth_url=auth_result["auth_url"],
                status="url_generated"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=auth_result.get("message", "Failed to generate authorization URL")
            )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error
        print(f"Error getting Google auth URL: {str(e)}")

        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating the Google authorization URL."
        )


@router.post("/callback", response_model=GoogleAuthCallbackResponse, status_code=status.HTTP_200_OK)
async def handle_google_auth_callback(
    request: GoogleAuthCallbackRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> GoogleAuthCallbackResponse:
    """
    Handle Google OAuth callback after user authorization.

    Args:
        request: Request containing user ID and authorization code
        user: Authenticated user information

    Returns:
        GoogleAuthCallbackResponse indicating success or failure
    """
    try:
        # Verify that the user ID in the request matches the authenticated user
        if user.get("uid") != request.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID in request does not match authenticated user"
            )

        # Initialize GoogleAuthService
        auth_service = GoogleAuthService(user_id=request.user_id)

        # Handle the authorization callback
        auth_result = auth_service.initialize_auth_for_registration(
            request.user_id,
            auth_code=request.auth_code
        )

        if auth_result.get("status") == "authenticated":
            return GoogleAuthCallbackResponse(
                status="authenticated",
                success=auth_result.get("success", False),
                message=None if auth_result.get("success", False) else "Authentication failed"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=auth_result.get("message", "Failed to authenticate with Google")
            )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error
        print(f"Error handling Google auth callback: {str(e)}")

        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the Google authentication callback."
        )


@router.post("/status", response_model=GoogleAuthStatusResponse, status_code=status.HTTP_200_OK)
async def check_google_auth_status(
    request: GoogleAuthStatusRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> GoogleAuthStatusResponse:
    """
    Check if the user has valid Google credentials.

    Args:
        request: Request containing user ID
        user: Authenticated user information

    Returns:
        GoogleAuthStatusResponse indicating whether the user has valid credentials
    """
    try:
        # Verify that the user ID in the request matches the authenticated user
        if user.get("uid") != request.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID in request does not match authenticated user"
            )

        # Initialize GoogleAuthService
        auth_service = GoogleAuthService(user_id=request.user_id)

        # Check if the user has valid credentials
        has_valid_credentials = auth_service.has_valid_credentials()

        return GoogleAuthStatusResponse(
            has_valid_credentials=has_valid_credentials,
            needs_authentication=not has_valid_credentials
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error
        print(f"Error checking Google auth status: {str(e)}")

        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while checking Google authentication status."
        )
