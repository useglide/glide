# Standard library imports
import os
import json
from datetime import datetime
from typing import Optional, Dict, List, Any

# Third-party imports
from dotenv import load_dotenv
from firebase_admin import db

# Google API imports
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

# Load environment variables
load_dotenv()

class BaseGoogleService:
    """
    Base service for interacting with Google APIs.
    Handles common functionality like authentication and service initialization.
    """

    # Google API scopes required for all operations
    SCOPES = [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/presentations'
    ]

    def __init__(self, user_id=None):
        """
        Initialize the BaseGoogleService with user credentials

        Args:
            user_id (str, optional): Firebase user ID. If provided, will attempt to load credentials.
        """
        self.user_id = user_id
        self.credentials = None
        self.docs_service = None
        self.drive_service = None
        self.sheets_service = None
        self.slides_service = None

        try:
            if user_id:
                self.credentials = self._get_credentials()
                if self.credentials:
                    self._initialize_services()
        except Exception as e:
            print(f"Error initializing BaseGoogleService: {str(e)}")

    def _initialize_services(self):
        """Initialize all Google API services with the current credentials"""
        if self.credentials:
            self.docs_service = build('docs', 'v1', credentials=self.credentials)
            self.drive_service = build('drive', 'v3', credentials=self.credentials)
            self.sheets_service = build('sheets', 'v4', credentials=self.credentials)
            self.slides_service = build('slides', 'v1', credentials=self.credentials)

    def has_valid_credentials(self):
        """
        Check if the user has valid Google credentials

        Returns:
            bool: True if the user has valid credentials, False otherwise
        """
        try:
            if not self.user_id:
                return False

            # Try to get credentials
            creds = self._get_credentials_from_firebase()

            # Check if credentials exist and are valid
            if creds and creds.valid:
                return True

            return False
        except Exception as e:
            print(f"Error checking credentials validity: {str(e)}")
            return False

    def _get_credentials(self):
        """
        Gets valid credentials for the current user from Firebase.

        Returns:
            Credentials: Google OAuth credentials or None if not available
        """
        if not self.user_id:
            return None

        try:
            # First try to get credentials from Firebase
            creds = self._get_credentials_from_firebase()
            if creds:
                return creds

            # If not in Firebase, try to get from environment (for development/testing)
            google_creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
            if not google_creds_json:
                print("Error: GOOGLE_CREDENTIALS_JSON environment variable not set")
                return None

            try:
                creds_dict = json.loads(google_creds_json)

                # Check if this is a web application or installed application credentials
                if 'web' in creds_dict:
                    # Web application credentials - we can't directly create user credentials
                    # from these, but we can use them for the OAuth flow
                    print("Web application credentials found. User needs to go through OAuth flow.")
                    return None
                elif 'installed' in creds_dict:
                    # Installed application credentials
                    client_config = creds_dict['installed']
                    # We still need a refresh token, which comes from the OAuth flow
                    print("Installed application credentials found. User needs to go through OAuth flow.")
                    return None
                else:
                    # Try to use as authorized user credentials
                    creds = Credentials.from_authorized_user_info(creds_dict)

                    # Save credentials to Firebase for future use
                    self._save_credentials_to_firebase(creds)
                    return creds
            except Exception as format_error:
                print(f"Error parsing GOOGLE_CREDENTIALS_JSON: {str(format_error)}")
                return None

        except Exception as e:
            print(f"Error getting credentials: {str(e)}")
            return None

    def _get_credentials_from_firebase(self):
        """
        Gets valid credentials for the current user from Firebase.

        Returns:
            Credentials: Google OAuth credentials or None if not available
        """
        if not self.user_id:
            return None

        try:
            # Load credentials from settings string
            google_creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
            if not google_creds_json:
                print("Error: GOOGLE_CREDENTIALS_JSON environment variable not set")
                return None

            credentials_dict = json.loads(google_creds_json)

            # Determine if we have web or installed application credentials
            client_type = None
            client_config = None

            if 'web' in credentials_dict:
                client_type = 'web'
                client_config = credentials_dict['web']
            elif 'installed' in credentials_dict:
                client_type = 'installed'
                client_config = credentials_dict['installed']

            if not client_type or not client_config:
                print("Error: Invalid GOOGLE_CREDENTIALS_JSON format - missing web or installed section")
                return None

            # Get token data from Firebase
            try:
                user_ref = db.reference(f'users/{self.user_id}/google_credentials')
                token_data = user_ref.get()
            except Exception as db_error:
                print(f"Error accessing Firebase database: {str(db_error)}")
                print("Make sure FIREBASE_DATABASE_URL is set correctly in your environment variables")
                return None

            if not token_data:
                print(f"No Google credentials found for user {self.user_id}")
                return None

            print("\nStored scopes in Firebase:", token_data.get('scopes'))

            # Check if we have all required scopes
            required_scopes = set(self.SCOPES)
            stored_scopes = set(token_data.get('scopes', []))
            missing_scopes = required_scopes - stored_scopes

            if missing_scopes:
                print(f"Missing required scopes: {missing_scopes}")
                # Return None to trigger new auth flow
                return None

            # Check for required fields
            required_fields = ['token', 'refresh_token', 'token_uri']
            missing_fields = [field for field in required_fields if not token_data.get(field)]

            if missing_fields:
                print(f"Missing required credential fields: {missing_fields}")
                return None

            # Convert stored token data back to Credentials object
            try:
                creds = Credentials(
                    token=token_data.get('token'),
                    refresh_token=token_data.get('refresh_token'),
                    token_uri=token_data.get('token_uri', 'https://oauth2.googleapis.com/token'),
                    client_id=client_config['client_id'],     # Use from settings
                    client_secret=client_config['client_secret'],  # Use from settings
                    scopes=token_data.get('scopes')
                )
            except Exception as cred_error:
                print(f"Error creating credentials object: {str(cred_error)}")
                return None

            # If credentials are expired but we have a refresh token, try to refresh
            if hasattr(creds, 'expired') and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    # Save refreshed credentials
                    self._save_credentials_to_firebase(creds)
                except Exception as e:
                    print(f"Error refreshing credentials: {str(e)}")
                    return None

            # Return valid credentials
            return creds if hasattr(creds, 'valid') and creds.valid else None

        except Exception as e:
            print(f"Error getting credentials from Firebase: {str(e)}")
            return None

    def _save_credentials_to_firebase(self, creds):
        """
        Saves Google credentials to Firebase for the current user.

        Args:
            creds (Credentials): Google OAuth credentials object

        Returns:
            bool: True if credentials were saved successfully, False otherwise
        """
        try:
            if not self.user_id:
                print("Cannot save credentials: No user ID provided")
                return False

            # Check if credentials object has all required attributes
            required_attrs = ['token', 'refresh_token', 'token_uri', 'client_id', 'client_secret', 'scopes']
            missing_attrs = [attr for attr in required_attrs if not hasattr(creds, attr) or getattr(creds, attr) is None]

            if missing_attrs:
                print(f"Cannot save credentials: Missing required attributes: {missing_attrs}")
                return False

            # Convert credentials to dictionary format
            token_data = {
                'token': creds.token,
                'refresh_token': creds.refresh_token,
                'token_uri': creds.token_uri,
                'client_id': creds.client_id,
                'client_secret': creds.client_secret,
                'scopes': creds.scopes,
                'expiry': creds.expiry.isoformat() if hasattr(creds, 'expiry') and creds.expiry else None,
                'updated_at': datetime.now().isoformat()
            }

            # Save to Firebase
            try:
                user_ref = db.reference(f'users/{self.user_id}/google_credentials')
                user_ref.set(token_data)
                print(f"Successfully saved credentials to Firebase for user {self.user_id}")
                return True
            except Exception as db_error:
                print(f"Error accessing Firebase database: {str(db_error)}")
                print("Make sure FIREBASE_DATABASE_URL is set correctly in your environment variables")
                return False

        except Exception as e:
            print(f"Error saving credentials to Firebase: {str(e)}")
            return False

    def delete_token(self):
        """
        Delete the user's Google token from Firebase

        Returns:
            bool: True if token was deleted successfully, False otherwise
        """
        try:
            if not self.user_id:
                return False

            user_ref = db.reference(f'users/{self.user_id}/google_credentials')
            user_ref.delete()
            return True
        except Exception as e:
            print(f"Error deleting token from Firebase: {str(e)}")
            return False
