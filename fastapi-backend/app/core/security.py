from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth, credentials, initialize_app
import firebase_admin
from typing import Optional, Dict, Any

from app.core.config import settings

# Firebase security scheme
security = HTTPBearer()

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with credentials."""
    if not firebase_admin._apps:
        try:
            # If service account key is provided, use it
            if settings.FIREBASE_SERVICE_ACCOUNT_KEY:
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_KEY)
                initialize_app(cred)
            # Otherwise use project ID only (for environments with default credentials)
            elif settings.FIREBASE_PROJECT_ID:
                initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            else:
                print("Warning: No Firebase credentials provided. Authentication will not work.")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            # Continue without Firebase if in debug mode
            if not settings.DEBUG:
                raise


# Initialize Firebase when module is imported
initialize_firebase()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Validate Firebase ID token and return user information.
    
    Args:
        credentials: HTTP Authorization credentials
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If token is invalid or authentication is disabled
    """
    # Skip authentication if disabled (for development/testing)
    if settings.FIREBASE_AUTH_DISABLED:
        return {"uid": "test-user", "email": "test@example.com"}
    
    token = credentials.credentials
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Simplified authentication for chat endpoint
async def optional_auth(request: Request) -> Optional[Dict[str, Any]]:
    """
    Optional authentication that doesn't fail if no token is provided.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Dict containing user information or None if no valid token
    """
    # Skip authentication if disabled
    if settings.FIREBASE_AUTH_DISABLED:
        return {"uid": "test-user", "email": "test@example.com"}
    
    # Get authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        # Return None instead of raising an exception
        return None
