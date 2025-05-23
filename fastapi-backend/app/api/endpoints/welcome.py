from fastapi import APIRouter, Depends, status, HTTPException
from typing import Dict, Any, Optional

from app.services.welcome_agent import WelcomeAgent
from app.core.security import optional_auth, get_current_user
from app.models.chat import WelcomeResponse
from app.core.config import settings

router = APIRouter()


@router.get("/message", response_model=WelcomeResponse, status_code=status.HTTP_200_OK)
async def get_welcome_message(
    user: Optional[Dict[str, Any]] = Depends(optional_auth)
) -> WelcomeResponse:
    """
    Get a personalized welcome message for the user.

    Args:
        user: Optional authenticated user information

    Returns:
        WelcomeResponse containing the welcome message
    """
    try:
        # Initialize welcome agent
        welcome_agent = WelcomeAgent()

        # Generate welcome message
        message = await welcome_agent.generate_welcome_message(user)

        # Return the response
        return WelcomeResponse(message=message)
    except Exception as e:
        # Log the error
        print(f"Error generating welcome message: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

        # Return a default message on error
        return WelcomeResponse(
            message="Welcome to Glide! I'm your AI assistant, here to help you manage your coursework."
        )


@router.get("/personalized", response_model=WelcomeResponse, status_code=status.HTTP_200_OK)
async def get_personalized_welcome_message(
    user: Dict[str, Any] = Depends(get_current_user)
) -> WelcomeResponse:
    """
    Get a personalized welcome message for the authenticated user.
    This endpoint requires authentication.

    Args:
        user: Authenticated user information

    Returns:
        WelcomeResponse containing the personalized welcome message
    """
    try:
        # Initialize welcome agent
        welcome_agent = WelcomeAgent()

        # Generate welcome message
        message = await welcome_agent.generate_welcome_message(user)

        # Return the response
        return WelcomeResponse(message=message)
    except Exception as e:
        # Log the error
        print(f"Error generating personalized welcome message: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

        # Return a default message on error
        return WelcomeResponse(
            message="Welcome to Glide! I'm your AI assistant, here to help you manage your coursework."
        )
