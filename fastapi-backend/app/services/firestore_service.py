from typing import Dict, Any, Optional, List
import firebase_admin
from firebase_admin import firestore


class FirestoreService:
    """Service for interacting with Firestore database."""

    def __init__(self):
        """Initialize the Firestore service."""
        self.db = None
        self._initialize_firestore()

    def _initialize_firestore(self):
        """Initialize Firestore client."""
        try:
            print("Initializing Firestore client...")

            # Check if Firebase Admin SDK is initialized
            if firebase_admin._apps:
                print(f"Firebase Admin SDK is initialized with {len(firebase_admin._apps)} app(s)")

                # Get Firestore instance
                try:
                    self.db = firestore.client()
                    print("Firestore client initialized successfully")

                    # Test Firestore connection
                    try:
                        # Try to access a collection to verify connection
                        test_ref = self.db.collection('users').limit(1).get()
                        print(f"Firestore connection test successful - found {len(list(test_ref))} user documents")
                    except Exception as conn_e:
                        print(f"WARNING: Firestore client initialized but connection test failed: {str(conn_e)}")
                        print("This may indicate network issues or permission problems")
                except Exception as client_e:
                    print(f"ERROR: Failed to create Firestore client: {str(client_e)}")
                    self.db = None
            else:
                print("ERROR: Firebase Admin SDK not initialized. Cannot create Firestore client.")
                print("Make sure Firebase Admin SDK is initialized before creating FirestoreService")
                self.db = None
        except Exception as e:
            print(f"ERROR initializing Firestore client: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
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
            print(f"Attempting to get Canvas credentials for user_id: {user_id}")

            if not self.db:
                print("ERROR: Firestore client not initialized - cannot retrieve Canvas credentials")
                print("Check if Firebase Admin SDK is properly initialized")
                return {}

            # We no longer use mock credentials for test user to ensure proper authentication
            # is required for accessing Canvas data
            if user_id == "test-user":
                print("WARNING: Test user detected. Real authentication is required for Canvas access.")
                print("Please use a real Firebase authenticated user to access Canvas data.")
                return {}

            # Get user document from Firestore
            print(f"Querying Firestore for user document with ID: {user_id}")
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()

            if not user_doc.exists:
                print(f"ERROR: User {user_id} not found in Firestore")
                print("Check if the user has been properly registered and the user ID is correct")
                return {}

            print(f"User document found in Firestore for ID: {user_id}")

            # Get Canvas credentials from user document
            user_data = user_doc.to_dict()

            if not user_data:
                print(f"ERROR: User document exists but contains no data for user {user_id}")
                return {}

            print(f"User document keys: {list(user_data.keys())}")

            # Check for Canvas credentials in different possible locations
            canvas_credentials = None
            canvas_url = None
            api_key = None

            # Check standard location
            if user_data.get('canvasCredentials'):
                canvas_credentials = user_data['canvasCredentials']
                print("Found canvasCredentials in standard location")
            # Check alternative locations that might be used
            elif user_data.get('canvas'):
                canvas_credentials = user_data['canvas']
                print("Found canvas credentials in 'canvas' field")
            elif user_data.get('canvas_credentials'):
                canvas_credentials = user_data['canvas_credentials']
                print("Found canvas credentials in 'canvas_credentials' field")

            # If we found credentials in any location, extract URL and API key
            if canvas_credentials:
                # Try different possible key names for URL
                for url_key in ['url', 'canvasUrl', 'canvas_url', 'instance_url', 'instanceUrl']:
                    if canvas_credentials.get(url_key):
                        canvas_url = canvas_credentials.get(url_key)
                        print(f"Found Canvas URL in field: {url_key}")
                        break

                # Try different possible key names for API key
                for key_key in ['apiKey', 'api_key', 'token', 'access_token', 'key']:
                    if canvas_credentials.get(key_key):
                        api_key = canvas_credentials.get(key_key)
                        print(f"Found Canvas API key in field: {key_key}")
                        break

            if not canvas_url or not api_key:
                print(f"ERROR: Canvas credentials not found or incomplete for user {user_id}")
                print(f"Canvas credentials structure: {canvas_credentials}")
                print(f"Canvas URL present: {bool(canvas_url)}")
                print(f"API Key present: {bool(api_key)}")
                print("Check if the user has completed Canvas authentication")
                return {}

            # Basic validation of URL and API key
            if not canvas_url.startswith(('http://', 'https://')):
                print(f"ERROR: Invalid Canvas URL format: {canvas_url}")
                print("Canvas URL must start with http:// or https://")
                return {}

            if len(api_key) < 20:  # Most Canvas API tokens are longer
                print(f"WARNING: Canvas API key seems too short ({len(api_key)} chars)")
                print("This may not be a valid Canvas API token")

            print(f"Successfully retrieved Canvas credentials for user {user_id}")
            print(f"Canvas URL: {canvas_url}")
            print(f"API Key: {api_key[:5]}...{api_key[-5:] if len(api_key) > 10 else ''}")
            print(f"API Key length: {len(api_key)}")

            # Return Canvas credentials
            return {
                "canvas_url": canvas_url,
                "api_key": api_key
            }
        except Exception as e:
            print(f"ERROR getting Canvas credentials from Firestore: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
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
            print(f"get_user_courses called for user_id: {user_id} with status filter: {status}")

            # We no longer use mock courses for test user to ensure proper authentication
            # is required for accessing course data
            if user_id == "test-user":
                print("WARNING: Test user detected. Real authentication is required for course access.")
                print("Please use a real Firebase authenticated user to access course data.")
                return []

            if not self.db:
                print("ERROR: Firestore client not initialized")
                print("Check if Firebase Admin SDK is properly initialized")
                return []

            # Create query for user's courses
            courses_ref = self.db.collection('users').document(user_id).collection('courses')

            # Apply status filter if provided
            if status:
                query = courses_ref.where('status', '==', status)
            else:
                query = courses_ref

            # Execute query
            print(f"Executing Firestore query for courses with user_id={user_id}, status={status}")
            courses_snapshot = query.get()

            if not courses_snapshot:
                print(f"No courses found for user {user_id}")
                print("Check if the user has enrolled in any courses or if courses have been properly synced")
                return []

            # Convert to list of dictionaries
            courses = [doc.to_dict() for doc in courses_snapshot]
            print(f"Retrieved {len(courses)} courses from Firestore")

            # Log course names for debugging
            course_names = [course.get('name', 'Unknown') for course in courses]
            print(f"Course names: {course_names}")

            return courses
        except Exception as e:
            print(f"Error getting courses from Firestore: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return []
