from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class GoogleAuthUrlRequest(BaseModel):
    """Request model for getting Google OAuth URL."""
    user_id: str = Field(..., description="Firebase user ID")


class GoogleAuthUrlResponse(BaseModel):
    """Response model for Google OAuth URL."""
    auth_url: str = Field(..., description="Google OAuth authorization URL")
    status: str = Field("url_generated", description="Status of the request")


class GoogleAuthCallbackRequest(BaseModel):
    """Request model for Google OAuth callback."""
    user_id: str = Field(..., description="Firebase user ID")
    auth_code: str = Field(..., description="Authorization code from Google OAuth")


class GoogleAuthCallbackResponse(BaseModel):
    """Response model for Google OAuth callback."""
    status: str = Field(..., description="Status of the authentication (authenticated)")
    success: bool = Field(..., description="Whether authentication was successful")
    message: Optional[str] = Field(None, description="Error message if authentication failed")


class GoogleAuthStatusRequest(BaseModel):
    """Request model for checking Google auth status."""
    user_id: str = Field(..., description="Firebase user ID")


class GoogleAuthStatusResponse(BaseModel):
    """Response model for Google auth status."""
    has_valid_credentials: bool = Field(..., description="Whether the user has valid Google credentials")
    needs_authentication: bool = Field(..., description="Whether the user needs to authenticate with Google")
