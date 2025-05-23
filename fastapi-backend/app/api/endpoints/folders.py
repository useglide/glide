from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List

from app.models.folder import CreateClassFoldersRequest, CreateClassFoldersResponse
from app.services.google.google_service import DocsService
from app.core.security import get_current_user

router = APIRouter()


@router.post("/create-class-folders", response_model=CreateClassFoldersResponse, status_code=status.HTTP_200_OK)
async def create_class_folders(
    request: CreateClassFoldersRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> CreateClassFoldersResponse:
    """
    Create folders for a user's enrolled classes.

    This endpoint creates a semester folder and class folders for each class name provided.
    Each class folder will have a Notes subfolder.

    Args:
        request: Request containing user ID and class names
        user: Authenticated user information

    Returns:
        CreateClassFoldersResponse indicating success or failure
    """
    try:
        # Verify that the user ID in the request matches the authenticated user
        if user.get("uid") != request.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID in request does not match authenticated user"
            )

        # Initialize Google Service
        google_service = DocsService(user_id=request.user_id)

        # Check if user has valid Google credentials
        if not google_service.has_valid_credentials():
            # If user is authenticated with Google through Firebase
            if request.is_google_user and request.google_token:
                print(f"User {request.user_id} is authenticated with Google through Firebase")

                try:
                    # Try to use the Firebase token for Google authentication
                    auth_service = google_service.auth_service
                    auth_result = auth_service.initialize_auth_for_registration(
                        request.user_id,
                        google_token=request.google_token
                    )

                    # If successful, continue with folder creation
                    if auth_result.get("status") == "authenticated" and auth_result.get("success", False):
                        print("Successfully authenticated with Firebase Google token")
                    else:
                        # If not successful, we'll fall through to the standard OAuth flow
                        print("Failed to authenticate with Firebase Google token")
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={
                                "message": "Google authentication required",
                                "error_type": "google_auth_required"
                            }
                        )
                except HTTPException as http_error:
                    # If the auth service raised an HTTPException, pass it through
                    raise http_error
                except Exception as e:
                    print(f"Error authenticating with Firebase Google token: {str(e)}")
                    # Fall through to standard OAuth flow
                    auth_service = google_service.auth_service
                    auth_result = auth_service.initialize_auth_for_registration(request.user_id)

                    if auth_result.get("status") == "url_generated" and auth_result.get("auth_url"):
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={
                                "message": "Google authentication required",
                                "auth_url": auth_result["auth_url"],
                                "error_type": "google_auth_required"
                            }
                        )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to generate Google authentication URL"
                        )
            else:
                # Standard OAuth flow for users not authenticated with Google
                auth_service = google_service.auth_service
                auth_result = auth_service.initialize_auth_for_registration(request.user_id)

                if auth_result.get("status") == "url_generated" and auth_result.get("auth_url"):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail={
                            "message": "Google authentication required",
                            "auth_url": auth_result["auth_url"],
                            "error_type": "google_auth_required"
                        }
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to generate Google authentication URL"
                    )

        # Create semester folders for the classes
        result = google_service.create_semester_folders(
            class_names=request.class_names,
            parent_folder_id=request.parent_folder_id
        )

        if result:
            # Get the current semester name
            from datetime import datetime
            current_date = datetime.now()
            semester = 'Spring' if current_date.month < 7 else 'Fall'
            semester_name = f"{semester} {current_date.year}"

            return CreateClassFoldersResponse(
                success=True,
                folder_count=len(request.class_names),
                message=f"Successfully created folders for {len(request.class_names)} classes",
                semester_name=semester_name
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create class folders"
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error
        print(f"Error creating class folders: {str(e)}")

        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating class folders."
        )
