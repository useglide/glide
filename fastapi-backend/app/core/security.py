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
            print("Initializing Firebase Admin SDK...")

            # If service account key is provided, use it
            if settings.FIREBASE_SERVICE_ACCOUNT_KEY:
                print("Using Firebase service account key from environment")
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_KEY)

                # Include database URL if available
                if settings.FIREBASE_DATABASE_URL:
                    print(f"Including database URL: {settings.FIREBASE_DATABASE_URL}")
                    initialize_app(cred, {'databaseURL': settings.FIREBASE_DATABASE_URL})
                else:
                    print("No database URL provided")
                    initialize_app(cred)

                print("Firebase initialized with service account credentials")
            # Otherwise use project ID only (for environments with default credentials)
            elif settings.FIREBASE_PROJECT_ID:
                print(f"Using project ID only: {settings.FIREBASE_PROJECT_ID}")
                options = {"projectId": settings.FIREBASE_PROJECT_ID}

                # Include database URL if available
                if settings.FIREBASE_DATABASE_URL:
                    print(f"Including database URL: {settings.FIREBASE_DATABASE_URL}")
                    options["databaseURL"] = settings.FIREBASE_DATABASE_URL

                initialize_app(options=options)
                print("Firebase initialized with project ID")
            else:
                print("ERROR: No Firebase credentials provided. Authentication will not work.")
                print("Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID in environment variables")

            print("Firebase Admin SDK initialized successfully")
        except Exception as e:
            print(f"ERROR initializing Firebase: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            # Continue without Firebase if in debug mode
            if not settings.DEBUG:
                raise
    else:
        print("Firebase Admin SDK already initialized")


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
        print("WARNING: FIREBASE_AUTH_DISABLED is set to True. This will not work in production.")
        print("For personalized Canvas data, you must set FIREBASE_AUTH_DISABLED=False and use proper Firebase authentication.")
        print("The test user will not be able to access real Canvas data.")
        return {"uid": "test-user", "email": "test@example.com", "displayName": "Test User"}

    token = credentials.credentials
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        # Store the original token in the user object for use with external services
        decoded_token["token"] = token
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
    print("optional_auth called for endpoint")

    # Skip authentication if disabled
    if settings.FIREBASE_AUTH_DISABLED:
        print("WARNING: FIREBASE_AUTH_DISABLED is set to True. Using test user.")
        print("This will not work in production and should only be used for development.")
        print("For personalized Canvas data, you must set FIREBASE_AUTH_DISABLED=False and use proper Firebase authentication.")
        print("The test user will not be able to access real Canvas data.")
        test_user = {"uid": "test-user", "email": "test@example.com", "displayName": "Test User"}
        print(f"Returning test user: {test_user}")
        return test_user

    # Get authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        print("No Authorization header found in request")
        return None

    if not auth_header.startswith("Bearer "):
        print("Authorization header does not start with 'Bearer '")
        return None

    token = auth_header.replace("Bearer ", "")
    print(f"Found Bearer token: {token[:10]}...")

    try:
        # Verify the ID token
        print("Verifying Firebase ID token...")
        decoded_token = auth.verify_id_token(token)

        # Log user information (without sensitive data)
        user_id = decoded_token.get("uid")
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        print(f"Successfully authenticated user: ID={user_id}, Email={email}, Name={name}")

        # Store the original token in the user object for use with external services
        decoded_token["token"] = token
        return decoded_token
    except Exception as e:
        # Log the error but return None instead of raising an exception
        print(f"Error verifying Firebase token: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return None
