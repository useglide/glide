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
            service_account = json.loads(settings.FIREBASE_SERVICE_ACCOUNT)
            cred = credentials.Certificate(service_account)
            firebase_admin.initialize_app(cred, {
                'databaseURL': settings.FIREBASE_DATABASE_URL
            })
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK with service account: {e}")
            # Initialize with application default credentials
            firebase_admin.initialize_app(options={
                'projectId': settings.FIREBASE_PROJECT_ID,
                'databaseURL': settings.FIREBASE_DATABASE_URL
            })
    else:
        # Initialize with application default credentials
        firebase_admin.initialize_app(options={
            'projectId': settings.FIREBASE_PROJECT_ID,
            'databaseURL': settings.FIREBASE_DATABASE_URL
        })
    
    print('Firebase Admin SDK initialized successfully')

# Get Firestore instance
db = firestore.client()

# Export Firebase services
__all__ = ['db', 'auth']
