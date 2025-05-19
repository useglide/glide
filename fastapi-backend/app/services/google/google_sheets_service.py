# Standard library imports
from typing import Optional, Dict

# Google API imports
from googleapiclient.discovery import build

# Local imports
from app.services.google.base_google_service import BaseGoogleService

class GoogleSheetsService(BaseGoogleService):
    """
    Service for interacting with Google Sheets.
    Extends BaseGoogleService with spreadsheet-specific methods.
    """

    def create_spreadsheet(self, assignment_data: dict) -> Optional[Dict]:
        """
        Creates a simple Google Sheets document for the assignment.

        Args:
            assignment_data (dict): Assignment data including name and course

        Returns:
            Optional[Dict]: Spreadsheet information or None if an error occurs
        """
        try:
            # Make sure sheets service is initialized
            if not self.sheets_service:
                if not self.credentials:
                    return None
                self.sheets_service = build('sheets', 'v4', credentials=self.credentials)

            # Create spreadsheet with assignment name
            spreadsheet_body = {
                'properties': {
                    'title': assignment_data['name']
                }
            }

            # Create the spreadsheet
            spreadsheet = self.sheets_service.spreadsheets().create(
                body=spreadsheet_body
            ).execute()

            spreadsheet_id = spreadsheet.get('spreadsheetId')

            # Move spreadsheet to correct class folder
            folder_id = self._get_folder_id(assignment_data.get('course_name', ''))
            if folder_id:
                self.move_to_folder(spreadsheet_id, folder_id)

            return {
                'document_id': spreadsheet_id,
                'assignment_name': assignment_data['name'],
                'course_name': assignment_data.get('course_name', ''),
                'url': f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit'
            }

        except Exception as e:
            print(f"Error creating spreadsheet: {e}")
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
