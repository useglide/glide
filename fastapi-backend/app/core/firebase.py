import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.core.config import settings

# Initialize Firebase Admin SDK
try:
    # Check if Firebase Admin SDK is already initialized
    firebase_admin.get_app()
except ValueError:
    # Initialize with service account if provided
    if settings.FIREBASE_SERVICE_ACCOUNT:
        try:
            # Handle potential string escaping issues in the service account JSON
            service_account_str = settings.FIREBASE_SERVICE_ACCOUNT
            # Try to parse the JSON string
            try:
                service_account = json.loads(service_account_str)
            except json.JSONDecodeError:
                # If it fails, try to clean up the string (remove extra escapes)
                service_account_str = service_account_str.replace('\\"', '"').replace('\\\\n', '\\n')
                service_account = json.loads(service_account_str)

            cred = credentials.Certificate(service_account)
            firebase_admin.initialize_app(cred, {
                'databaseURL': settings.FIREBASE_DATABASE_URL
            })
            print('Firebase Admin SDK initialized with service account')
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK with service account: {e}")
            # Initialize with application default credentials as fallback
            firebase_admin.initialize_app(options={
                'projectId': settings.FIREBASE_PROJECT_ID,
                'databaseURL': settings.FIREBASE_DATABASE_URL
            })
            print('Firebase Admin SDK initialized with default credentials (fallback)')
    else:
        # Initialize with application default credentials
        firebase_admin.initialize_app(options={
            'projectId': settings.FIREBASE_PROJECT_ID,
            'databaseURL': settings.FIREBASE_DATABASE_URL
        })
        print('Firebase Admin SDK initialized with default credentials')

    print('Firebase Admin SDK initialized successfully')

# Get Firestore instance
db = firestore.client()

# Export Firebase services
__all__ = ['db', 'auth']
