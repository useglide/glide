# Standard library imports
import os
import json
from typing import Dict, Optional

# Google API imports
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

# Local imports
from app.services.google.base_google_service import BaseGoogleService

class GoogleAuthService(BaseGoogleService):
    """
    Service for handling Google authentication.
    Extends BaseGoogleService with authentication-specific methods.
    """

    def initialize_auth_for_registration(self, user_id, auth_code=None, google_token=None):
        """
        Initialize Google authentication during user registration

        Args:
            user_id (str): Firebase user ID
            auth_code (str, optional): Authorization code from Google OAuth. If not provided,
                                      will return an authorization URL for the user to visit.
            google_token (str, optional): Google OAuth token from Firebase Authentication.
                                         If provided, will use this token instead of auth_code.

        Returns:
            dict: Result containing either:
                - {'status': 'url_generated', 'auth_url': url} if auth_code is None and google_token is None
                - {'status': 'authenticated', 'success': True/False} if auth_code or google_token is provided
        """
        self.user_id = user_id

        # If Firebase Google token is provided, use it
        if google_token:
            print(f"Using Firebase Google token for user {user_id}")
            success = self.handle_firebase_google_token(google_token)
            return {
                'status': 'authenticated',
                'success': success
            }
        # If auth_code is not provided, generate authorization URL
        elif not auth_code:
            # Generate authorization URL for the user to visit
            auth_url = self.get_authorization_url()
            if auth_url:
                return {
                    'status': 'url_generated',
                    'auth_url': auth_url
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Failed to generate authorization URL'
                }
        # Otherwise, process the authorization code
        else:
            # Process the authorization code
            success = self.handle_auth_callback(auth_code)
            return {
                'status': 'authenticated',
                'success': success
            }

    def get_authorization_url(self):
        """
        Get the URL for Google OAuth consent screen

        Returns:
            str: Authorization URL or None if an error occurs
        """
        try:
            flow = self._create_auth_flow()
            if not flow:
                return None

            # Always use 'consent' prompt to ensure we get a refresh token
            # Also include 'access_type=offline' to get a refresh token
            auth_url, _ = flow.authorization_url(
                prompt='consent',
                access_type='offline',
                include_granted_scopes='true'
            )
            print(f"Generated authorization URL with prompt=consent and access_type=offline")
            return auth_url
        except Exception as e:
            print(f"Error getting authorization URL: {str(e)}")
            return None

    def handle_auth_callback(self, code):
        """
        Handle the OAuth callback and save credentials

        Args:
            code (str): Authorization code from Google OAuth

        Returns:
            bool: True if authentication was successful, False otherwise
        """
        try:
            if not code:
                print("Error: No authorization code provided")
                return False

            print(f"Starting auth callback with code: {code[:10]}...") # Only show first 10 chars for security

            # Create OAuth flow
            flow = self._create_auth_flow()
            if not flow:
                print("Failed to create OAuth flow")
                return False

            print(f"Created flow with redirect URI: {flow._redirect_uri}")

            # Exchange authorization code for access token
            try:
                flow.fetch_token(code=code)
                print("Successfully fetched token")
            except Exception as token_error:
                print(f"Error fetching token: {str(token_error)}")
                print("This could be due to an invalid or expired authorization code, or a redirect URI mismatch")
                return False

            # Get credentials from flow
            credentials = flow.credentials

            # Verify that we have all required fields
            required_attrs = ['token', 'refresh_token', 'token_uri', 'client_id', 'client_secret', 'scopes']
            missing_attrs = [attr for attr in required_attrs if not hasattr(credentials, attr) or getattr(credentials, attr) is None]

            if missing_attrs:
                print(f"Error: Missing required credential attributes: {missing_attrs}")
                if 'refresh_token' in missing_attrs:
                    print("Missing refresh_token. Make sure you're using 'consent' prompt in the authorization URL")
                return False

            # Save credentials and reinitialize services
            saved = self._save_credentials_to_firebase(credentials)
            print(f"Saved credentials to Firebase: {saved}")

            if not saved:
                print("Failed to save credentials to Firebase")
                return False

            self.credentials = credentials
            self._initialize_services()
            print("Successfully initialized services")

            return True
        except Exception as e:
            print(f"Error handling auth callback: {str(e)}")
            return False

    def handle_firebase_google_token(self, token):
        """
        Handle Firebase Google OAuth token and save credentials

        Args:
            token (str): Firebase ID token for a user authenticated with Google

        Returns:
            bool: True if authentication was successful, False otherwise
        """
        try:
            if not token:
                print("Error: No Firebase token provided")
                return False

            print("Processing Firebase token for Google-authenticated user")

            # For Firebase-authenticated users, we need to use the standard OAuth flow
            # because Firebase doesn't directly expose Google OAuth tokens

            # First, check if we already have valid credentials for this user
            existing_creds = self._get_credentials_from_firebase()
            if existing_creds and hasattr(existing_creds, 'valid') and existing_creds.valid:
                print(f"User {self.user_id} already has valid Google credentials")
                self.credentials = existing_creds
                self._initialize_services()
                return True

            # If we don't have valid credentials, we need to start the OAuth flow
            # Generate an authorization URL for the user
            auth_url = self.get_authorization_url()
            if not auth_url:
                print("Failed to generate authorization URL")
                return False

            # Since we can't automatically complete the OAuth flow with just the Firebase token,
            # we need to inform the caller that the user needs to go through the OAuth flow
            print(f"User {self.user_id} needs to complete Google OAuth flow")

            # This will be caught by the caller and returned as an error
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "message": "Google authentication required",
                    "auth_url": auth_url,
                    "error_type": "google_auth_required"
                }
            )

        except Exception as e:
            print(f"Error handling Firebase token for Google authentication: {str(e)}")
            return False

    def _create_auth_flow(self):
        """
        Create a new OAuth flow with proper scopes

        Returns:
            Flow: Google OAuth flow object or None if an error occurs
        """
        try:
            # Use credentials from environment variable
            google_creds = os.getenv('GOOGLE_CREDENTIALS_JSON')
            if not google_creds:
                print("Error: GOOGLE_CREDENTIALS_JSON not found in environment variables")
                return None

            # Parse the JSON string into a dictionary
            creds_dict = json.loads(google_creds)

            # Get redirect URI from environment or use default
            redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/google-auth-callback')
            print(f"Redirect URI from environment: {redirect_uri}")

            # Check if we're in development mode (DEBUG=True)
            from app.core.config import settings
            if settings.DEBUG:
                # Use localhost redirect URI for development
                redirect_uri = 'http://localhost:8000/api/v1/google/callback'
                print(f"DEBUG mode detected, using development redirect URI: {redirect_uri}")

            # Print the authorized redirect URIs from the credentials
            if 'web' in creds_dict and 'redirect_uris' in creds_dict['web']:
                print(f"Authorized redirect URIs in credentials: {creds_dict['web']['redirect_uris']}")
            elif 'installed' in creds_dict and 'redirect_uris' in creds_dict['installed']:
                print(f"Authorized redirect URIs in credentials: {creds_dict['installed']['redirect_uris']}")

            # Determine if we have web or installed application credentials
            if 'web' in creds_dict:
                client_type = 'web'
            elif 'installed' in creds_dict:
                client_type = 'installed'
            else:
                print("Error: Invalid GOOGLE_CREDENTIALS_JSON format - missing web or installed section")
                return None

            print(f"Creating OAuth flow with {client_type} credentials and redirect URI: {redirect_uri}")

            # Create flow with proper client configuration and redirect URI
            return Flow.from_client_config(
                creds_dict,
                scopes=self.SCOPES,
                redirect_uri=redirect_uri
            )

        except Exception as e:
            print(f"Error creating auth flow: {str(e)}")
            return None
