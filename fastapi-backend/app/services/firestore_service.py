from typing import Dict, Any, Optional, List
import firebase_admin
from firebase_admin import firestore
from app.core.config import settings


class FirestoreService:
    """Service for interacting with Firestore database."""

    def __init__(self):
        """Initialize the Firestore service."""
        self.db = None
        self._initialize_firestore()

    def _initialize_firestore(self):
        """Initialize Firestore client."""
        try:
            # Get Firestore instance
            if firebase_admin._apps:
                self.db = firestore.client()
                print("Firestore client initialized successfully")
            else:
                print("Firebase Admin SDK not initialized. Cannot create Firestore client.")
        except Exception as e:
            print(f"Error initializing Firestore client: {str(e)}")
            self.db = None

    async def get_canvas_credentials(self, user_id: str) -> Dict[str, str]:
        """
        Get Canvas credentials for a user from Firestore.

        Args:
            user_id: The Firebase user ID

        Returns:
            Dict containing Canvas URL and API key
        """
        try:
            if not self.db:
                print("Firestore client not initialized")
                return {}

            # Skip for test user when auth is disabled
            if settings.FIREBASE_AUTH_DISABLED and user_id == "test-user":
                print("Using mock Canvas credentials for test user")
                return {
                    "canvas_url": "https://canvas.instructure.com",
                    "api_key": "test_api_key"
                }

            # Get user document from Firestore
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()

            if not user_doc.exists:
                print(f"User {user_id} not found in Firestore")
                return {}

            # Get Canvas credentials from user document
            user_data = user_doc.to_dict()
            if not user_data.get('canvasCredentials'):
                print(f"Canvas credentials not found for user {user_id}")
                return {}

            # Return Canvas credentials
            return {
                "canvas_url": user_data['canvasCredentials'].get('url'),
                "api_key": user_data['canvasCredentials'].get('apiKey')
            }
        except Exception as e:
            print(f"Error getting Canvas credentials from Firestore: {str(e)}")
            return {}

    async def get_user_courses(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get user's courses from Firestore.

        Args:
            user_id: The Firebase user ID
            status: Optional status filter ('current' or 'past')

        Returns:
            List of courses
        """
        try:
            if not self.db:
                print("Firestore client not initialized")
                return []

            # Create query for user's courses
            courses_ref = self.db.collection('users').document(user_id).collection('courses')
            
            # Apply status filter if provided
            if status:
                query = courses_ref.where('status', '==', status)
            else:
                query = courses_ref
                
            # Execute query
            courses_snapshot = query.get()
            
            if not courses_snapshot:
                print(f"No courses found for user {user_id}")
                return []
                
            # Convert to list of dictionaries
            return [doc.to_dict() for doc in courses_snapshot]
        except Exception as e:
            print(f"Error getting courses from Firestore: {str(e)}")
            return []
