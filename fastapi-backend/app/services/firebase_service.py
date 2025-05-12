from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.firebase import db

class FirebaseService:
    """Service for Firebase operations"""
    
    @staticmethod
    async def get_canvas_credentials(uid: str) -> Dict[str, str]:
        """
        Get Canvas credentials for a user
        
        Args:
            uid: User ID
            
        Returns:
            Dict with Canvas URL and API key
        """
        try:
            user_doc = db.collection('users').document(uid).get()
            
            if not user_doc.exists:
                raise ValueError('User not found')
            
            user_data = user_doc.to_dict()
            
            if not user_data.get('canvasCredentials'):
                raise ValueError('Canvas credentials not found')
            
            return {
                "canvasUrl": user_data['canvasCredentials']['url'],
                "canvasApiKey": user_data['canvasCredentials']['apiKey']
            }
        except Exception as error:
            print(f'Error getting Canvas credentials: {error}')
            raise
    
    @staticmethod
    async def store_canvas_credentials(uid: str, credentials: Dict[str, str]) -> Dict[str, Any]:
        """
        Store Canvas credentials for a user
        
        Args:
            uid: User ID
            credentials: Canvas credentials (canvasUrl, canvasApiKey)
            
        Returns:
            Dict with operation result
        """
        try:
            canvas_url = credentials.get('canvasUrl')
            canvas_api_key = credentials.get('canvasApiKey')
            
            if not canvas_url or not canvas_api_key:
                raise ValueError('Canvas URL and API key are required')
            
            # Store credentials in Firestore
            db.collection('users').document(uid).set({
                'canvasCredentials': {
                    'url': canvas_url,
                    'apiKey': canvas_api_key,
                    'updatedAt': datetime.now()
                }
            }, merge=True)
            
            return {"success": True}
        except Exception as error:
            print(f'Error storing Canvas credentials: {error}')
            raise
    
    @staticmethod
    async def get_current_courses(uid: str) -> List[int]:
        """
        Get current course IDs from Firestore
        
        Args:
            uid: User ID
            
        Returns:
            List of current course IDs
        """
        try:
            courses_snapshot = db.collection('users').document(uid).collection('courses')\
                .where('status', '==', 'current').get()
            
            if not courses_snapshot:
                return []
            
            return [int(doc.id) for doc in courses_snapshot]
        except Exception as error:
            print(f'Error getting current courses: {error}')
            raise
    
    @staticmethod
    async def get_all_courses(uid: str) -> List[int]:
        """
        Get all course IDs from Firestore
        
        Args:
            uid: User ID
            
        Returns:
            List of all course IDs
        """
        try:
            courses_snapshot = db.collection('users').document(uid).collection('courses').get()
            
            if not courses_snapshot:
                return []
            
            return [int(doc.id) for doc in courses_snapshot]
        except Exception as error:
            print(f'Error getting all courses: {error}')
            raise

# Create service instance
firebase_service = FirebaseService()
