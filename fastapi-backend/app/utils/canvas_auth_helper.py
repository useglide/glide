"""
Utility functions for helping users diagnose and fix Canvas API authentication issues.
"""

from typing import Dict, Any
import requests
from canvasapi import Canvas

from app.services.firestore_service import FirestoreService
from app.core.config import settings
from firebase_admin import firestore


async def update_canvas_credentials(user_id: str, canvas_url: str, api_key: str) -> Dict[str, Any]:
    """
    Update Canvas credentials for a user in Firestore.

    Args:
        user_id: The Firebase user ID
        canvas_url: The Canvas URL
        api_key: The Canvas API key

    Returns:
        Dict containing status and message
    """
    try:
        # Validate the credentials first
        is_valid = False
        validation_error = None

        try:
            # Basic validation
            if not canvas_url or not api_key:
                return {
                    "success": False,
                    "message": "Canvas URL and API key are required"
                }

            if not canvas_url.startswith(('http://', 'https://')):
                return {
                    "success": False,
                    "message": "Canvas URL must start with http:// or https://"
                }

            # Create a temporary Canvas client to validate the credentials
            temp_canvas = Canvas(canvas_url, api_key)

            # Try to get current user
            try:
                user = temp_canvas.get_current_user()
                is_valid = True
            except Exception as e:
                validation_error = str(e)
                is_valid = False
        except Exception as e:
            validation_error = str(e)
            is_valid = False

        # If credentials are not valid, return error
        if not is_valid:
            return {
                "success": False,
                "message": f"Canvas credentials validation failed: {validation_error}",
                "details": {
                    "error": validation_error
                }
            }

        # Get Firestore instance
        db = firestore.client()

        # Update credentials in Firestore
        user_ref = db.collection('users').document(user_id)

        # Get current user document
        user_doc = user_ref.get()
        if not user_doc.exists:
            return {
                "success": False,
                "message": f"User {user_id} not found in Firestore"
            }

        # Update credentials
        user_ref.update({
            'canvasCredentials': {
                'url': canvas_url,
                'apiKey': api_key
            }
        })

        return {
            "success": True,
            "message": "Canvas credentials updated successfully",
            "details": {
                "user_name": user.name,
                "user_id": user.id
            }
        }
    except Exception as e:
        print(f"Error updating Canvas credentials: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "message": f"Error updating Canvas credentials: {str(e)}"
        }


async def diagnose_canvas_auth_issues(user_id: str) -> Dict[str, Any]:
    """
    Diagnose Canvas API authentication issues for a user.

    Args:
        user_id: The Firebase user ID

    Returns:
        Dict containing diagnostic information and suggestions
    """
    result = {
        "status": "unknown",
        "message": "",
        "details": {},
        "suggestions": []
    }

    # Get Canvas credentials from Firestore
    firestore_service = FirestoreService()
    credentials = await firestore_service.get_canvas_credentials(user_id)

    if not credentials:
        result["status"] = "missing_credentials"
        result["message"] = "Canvas credentials not found in Firestore."
        result["suggestions"] = [
            "Make sure you have completed Canvas authentication in the Glide app.",
            "Try re-authenticating with Canvas in the Glide app settings.",
            "Check if your Canvas instance is correctly configured in your profile."
        ]
        return result

    canvas_url = credentials.get("canvas_url")
    api_key = credentials.get("api_key")

    # Check if credentials are complete
    if not canvas_url or not api_key:
        result["status"] = "incomplete_credentials"
        result["message"] = "Canvas credentials are incomplete."
        result["details"] = {
            "canvas_url_present": bool(canvas_url),
            "api_key_present": bool(api_key)
        }
        result["suggestions"] = [
            "Try re-authenticating with Canvas in the Glide app settings.",
            "Make sure you have generated a valid API key in your Canvas account.",
            "Check if your Canvas URL is correct."
        ]
        return result

    # Validate URL format
    if not canvas_url.startswith(('http://', 'https://')):
        result["status"] = "invalid_url_format"
        result["message"] = "Canvas URL format is invalid."
        result["details"] = {
            "canvas_url": canvas_url
        }
        result["suggestions"] = [
            "Canvas URL must start with http:// or https://",
            "Try re-authenticating with Canvas in the Glide app settings.",
            "Check if your Canvas URL is correct."
        ]
        return result

    # Validate API key format
    if len(api_key) < 20:  # Most Canvas API tokens are longer
        result["status"] = "suspicious_api_key"
        result["message"] = "Canvas API key seems too short."
        result["details"] = {
            "api_key_length": len(api_key)
        }
        result["suggestions"] = [
            "Your Canvas API key seems unusually short. Most Canvas API keys are longer than 20 characters.",
            "Try regenerating your Canvas API key in your Canvas account settings.",
            "Make sure you're copying the entire API key when generating it."
        ]
        # Continue with validation anyway

    # Test the Canvas API connection
    try:
        # Create a Canvas client
        canvas = Canvas(canvas_url, api_key)

        # Try to get current user
        try:
            user = canvas.get_current_user()
            result["status"] = "success"
            result["message"] = "Canvas API authentication successful."
            result["details"] = {
                "user_name": user.name,
                "user_id": user.id
            }
            return result
        except Exception as user_e:
            result["status"] = "auth_failed"
            result["message"] = "Canvas API authentication failed."
            result["details"] = {
                "error": str(user_e)
            }

            # Check for specific error messages
            error_str = str(user_e).lower()
            if "invalid access token" in error_str:
                result["suggestions"] = [
                    "Your Canvas API token is invalid or has expired.",
                    "Try regenerating your Canvas API key in your Canvas account settings.",
                    "Make sure you're granting the correct permissions when generating the API key.",
                    "Check if your Canvas instance requires special scopes for API access."
                ]
            elif "unauthorized" in error_str:
                result["suggestions"] = [
                    "Your Canvas API token doesn't have sufficient permissions.",
                    "Make sure you're granting the correct permissions when generating the API key.",
                    "Check with your Canvas administrator if your account has API access."
                ]
            else:
                result["suggestions"] = [
                    "Try regenerating your Canvas API key in your Canvas account settings.",
                    "Check if your Canvas URL is correct.",
                    "Make sure your Canvas instance is accessible and not down for maintenance.",
                    "Check with your Canvas administrator if your account has API access."
                ]

            return result
    except Exception as e:
        result["status"] = "connection_failed"
        result["message"] = "Failed to connect to Canvas API."
        result["details"] = {
            "error": str(e)
        }
        result["suggestions"] = [
            "Check if your Canvas URL is correct.",
            "Make sure your Canvas instance is accessible and not down for maintenance.",
            "Check if your network allows connections to the Canvas API.",
            "Try accessing your Canvas instance in a web browser to verify it's available."
        ]
        return result
