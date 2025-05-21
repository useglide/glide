from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
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
from app.core.security import get_current_user

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


@router.get("/callback", status_code=status.HTTP_200_OK)
async def handle_google_auth_callback_get(
    code: str,
    state: Optional[str] = None,
    error: Optional[str] = None,
    request: Request = None
):
    """
    Handle Google OAuth callback after user authorization (GET endpoint).
    This endpoint is called by Google OAuth after the user authorizes the application.

    Args:
        code: Authorization code from Google OAuth
        state: Optional state parameter
        error: Optional error parameter
        request: FastAPI request object

    Returns:
        HTML page that redirects to the frontend
    """
    try:
        # Print detailed information about the request
        print(f"Google OAuth callback received at URL: {request.url}")
        print(f"Full request URL: {request.url}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Query parameters: {dict(request.query_params)}")

        if error:
            print(f"Error in Google OAuth callback: {error}")
            # Communicate error to parent window or redirect
            html_content = f"""
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Authentication Error</title>
                    <script>
                        window.onload = function() {{
                            // Check if this window was opened by another window
                            if (window.opener && !window.opener.closed) {{
                                // Pass the error to the parent window
                                window.opener.postMessage({{ type: 'GOOGLE_AUTH_ERROR', error: '{error}' }}, '*');
                                // Close this window
                                window.close();
                            }} else {{
                                // Fallback to redirect if this is not a popup
                                window.location.href = '/dashboard?error={error}';
                            }}
                        }};
                    </script>
                </head>
                <body>
                    <p>Authentication failed. You can close this window and return to the application.</p>
                </body>
            </html>
            """
            return HTMLResponse(content=html_content)

        if not code:
            print("Error: No authorization code provided in callback")
            # Communicate error to parent window or redirect
            html_content = """
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Authentication Error</title>
                    <script>
                        window.onload = function() {
                            // Check if this window was opened by another window
                            if (window.opener && !window.opener.closed) {
                                // Pass the error to the parent window
                                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'no_auth_code' }, '*');
                                // Close this window
                                window.close();
                            } else {
                                // Fallback to redirect if this is not a popup
                                window.location.href = '/dashboard?error=no_auth_code';
                            }
                        };
                    </script>
                </head>
                <body>
                    <p>Authentication failed: No authorization code provided. You can close this window and return to the application.</p>
                </body>
            </html>
            """
            return HTMLResponse(content=html_content)

        print(f"Received authorization code: {code[:10]}...") # Only show first 10 chars for security

        # Store the code in a temporary session or cache
        # In a real application, you would store this securely and associate it with the user
        # For now, we'll communicate the code back to the parent window and close this window
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <title>Authentication Successful</title>
                <script>
                    window.onload = function() {{
                        // Check if this window was opened by another window
                        if (window.opener && !window.opener.closed) {{
                            // Pass the auth code to the parent window
                            window.opener.postMessage({{ type: 'GOOGLE_AUTH_SUCCESS', authCode: '{code}' }}, '*');
                            // Close this window
                            window.close();
                        }} else {{
                            // Fallback to redirect if this is not a popup
                            window.location.href = '/dashboard?auth_code={code}';
                        }}
                    }};
                </script>
            </head>
            <body>
                <p>Authentication successful. You can close this window and return to the application.</p>
            </body>
        </html>
        """
        return HTMLResponse(content=html_content)

    except Exception as e:
        print(f"Error handling Google auth callback (GET): {str(e)}")
        # Communicate error to parent window or redirect
        html_content = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <title>Authentication Error</title>
                <script>
                    window.onload = function() {{
                        // Check if this window was opened by another window
                        if (window.opener && !window.opener.closed) {{
                            // Pass the error to the parent window
                            window.opener.postMessage({{ type: 'GOOGLE_AUTH_ERROR', error: 'server_error' }}, '*');
                            // Close this window
                            window.close();
                        }} else {{
                            // Fallback to redirect if this is not a popup
                            window.location.href = '/dashboard?error=server_error';
                        }}
                    }};
                </script>
            </head>
            <body>
                <p>Authentication failed: Server error. You can close this window and return to the application.</p>
            </body>
        </html>
        """
        return HTMLResponse(content=html_content)


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
