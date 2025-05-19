# Standard library imports
from typing import Optional, Dict

# Google API imports
from googleapiclient.discovery import build

# Local imports
from app.services.google.base_google_service import BaseGoogleService

class GoogleSlidesService(BaseGoogleService):
    """
    Service for interacting with Google Slides.
    Extends BaseGoogleService with presentation-specific methods.
    """

    def create_presentation(self, assignment_data: dict) -> Optional[Dict]:
        """
        Creates a simple Google Slides presentation for the assignment.

        Args:
            assignment_data (dict): Assignment data including name and course

        Returns:
            Optional[Dict]: Presentation information or None if an error occurs
        """
        try:
            # Make sure slides service is initialized
            if not self.slides_service:
                if not self.credentials:
                    return None
                self.slides_service = build('slides', 'v1', credentials=self.credentials)

            # Create presentation with assignment name
            presentation = self.slides_service.presentations().create(
                body={'title': assignment_data['name']}
            ).execute()

            presentation_id = presentation.get('presentationId')

            # Move presentation to correct class folder
            folder_id = self._get_folder_id(assignment_data.get('course_name', ''))
            if folder_id:
                self.move_to_folder(presentation_id, folder_id)

            return {
                'document_id': presentation_id,
                'assignment_name': assignment_data['name'],
                'course_name': assignment_data.get('course_name', ''),
                'url': f'https://docs.google.com/presentation/d/{presentation_id}/edit'
            }

        except Exception as e:
            print(f"Error creating presentation: {e}")
            return None

    def _get_folder_id(self, class_name: str) -> Optional[str]:
        """
        Get folder ID from Firebase for given class

        Args:
            class_name (str): Name of the class

        Returns:
            Optional[str]: Folder ID or None if not found
        """
        # This is a duplicate of the method in GoogleDriveService
        # In a real implementation, you might want to use dependency injection
        # or create a common utility class for these shared methods
        from app.services.google.google_drive_service import GoogleDriveService
        drive_service = GoogleDriveService(self.user_id)
        return drive_service._get_folder_id(class_name)

    def move_to_folder(self, file_id: str, folder_id: str) -> bool:
        """
        Moves a file to specified folder in Google Drive.

        Args:
            file_id (str): The ID of the file to move
            folder_id (str): The ID of the destination folder

        Returns:
            bool: True if successful, False otherwise
        """
        # This is a duplicate of the method in GoogleDriveService
        from app.services.google.google_drive_service import GoogleDriveService
        drive_service = GoogleDriveService(self.user_id)
        return drive_service.move_to_folder(file_id, folder_id)
