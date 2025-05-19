# Standard library imports
from datetime import datetime
from typing import Optional, Dict, List

# Third-party imports
from firebase_admin import db

# Local imports
from app.services.google.base_google_service import BaseGoogleService
from app.services.google.google_auth_service import GoogleAuthService
from app.services.google.google_docs_service import GoogleDocsService
from app.services.google.google_drive_service import GoogleDriveService
from app.services.google.google_sheets_service import GoogleSheetsService
from app.services.google.google_slides_service import GoogleSlidesService

class DocsService(BaseGoogleService):
    """
    Combined service for interacting with Google APIs.
    This is a facade that delegates to specialized services.
    """

    def __init__(self, user_id=None):
        """
        Initialize the DocsService with user credentials

        Args:
            user_id (str, optional): Firebase user ID. If provided, will attempt to load credentials.
        """
        super().__init__(user_id)

        # Initialize specialized services
        self.auth_service = GoogleAuthService(user_id)
        self.docs_service_impl = GoogleDocsService(user_id)
        self.drive_service_impl = GoogleDriveService(user_id)
        self.sheets_service_impl = GoogleSheetsService(user_id)
        self.slides_service_impl = GoogleSlidesService(user_id)

    # ===== Authentication Methods =====

    def initialize_auth_for_registration(self, user_id, auth_code=None):
        """
        Initialize Google authentication during user registration

        Args:
            user_id (str): Firebase user ID
            auth_code (str, optional): Authorization code from Google OAuth

        Returns:
            dict: Authentication result
        """
        return self.auth_service.initialize_auth_for_registration(user_id, auth_code)

    def get_authorization_url(self):
        """
        Get the URL for Google OAuth consent screen

        Returns:
            str: Authorization URL or None if an error occurs
        """
        return self.auth_service.get_authorization_url()

    def handle_auth_callback(self, code):
        """
        Handle the OAuth callback and save credentials

        Args:
            code (str): Authorization code from Google OAuth

        Returns:
            bool: True if authentication was successful, False otherwise
        """
        return self.auth_service.handle_auth_callback(code)

    def has_valid_credentials(self):
        """
        Check if the user has valid Google credentials

        Returns:
            bool: True if the user has valid credentials, False otherwise
        """
        return self.auth_service.has_valid_credentials()

    def delete_token(self):
        """
        Delete the user's Google token from Firebase

        Returns:
            bool: True if token was deleted successfully, False otherwise
        """
        return self.auth_service.delete_token()

    # ===== Document Creation and Management Methods =====

    def create_document(self, title: str) -> Optional[Dict]:
        """
        Creates a new Google Doc with the given title.

        Args:
            title (str): The title of the document

        Returns:
            Optional[Dict]: Document information or None if an error occurs
        """
        return self.docs_service_impl.create_document(title)

    def update_document(self, document_id: str, name: str, professor: str, class_name: str) -> Optional[Dict]:
        """
        Updates a Google Doc with MLA formatting.

        Args:
            document_id (str): The ID of the document to update
            name (str): Student name
            professor (str): Professor name
            class_name (str): Class name

        Returns:
            Optional[Dict]: Result of the update or None if an error occurs
        """
        return self.docs_service_impl.update_document(document_id, name, professor, class_name)

    def update_document_apa(self, document_id: str, name: str, professor: str, class_name: str) -> Optional[Dict]:
        """
        Updates a Google Doc with APA formatting.

        Args:
            document_id (str): The ID of the document to update
            name (str): Student name
            professor (str): Professor name
            class_name (str): Class name

        Returns:
            Optional[Dict]: Result of the update or None if an error occurs
        """
        return self.docs_service_impl.update_document_apa(document_id, name, professor, class_name)

    def export_as_pdf(self, document_id: str) -> Optional[bytes]:
        """
        Export a Google Doc as PDF.

        Args:
            document_id (str): The ID of the document to export

        Returns:
            Optional[bytes]: PDF content or None if an error occurs
        """
        return self.docs_service_impl.export_as_pdf(document_id)

    # ===== File and Folder Management Methods =====

    def move_to_folder(self, file_id: str, folder_id: str) -> bool:
        """
        Moves a file to specified folder in Google Drive.

        Args:
            file_id (str): The ID of the file to move
            folder_id (str): The ID of the destination folder

        Returns:
            bool: True if successful, False otherwise
        """
        return self.drive_service_impl.move_to_folder(file_id, folder_id)

    def create_class_folders(self, parent_folder_id: str, class_names: list) -> list:
        """
        Creates folders for each class and a Notes subfolder within each.

        Args:
            parent_folder_id (str): The ID of the parent folder
            class_names (list): List of class names

        Returns:
            list: List of created folder IDs
        """
        return self.drive_service_impl.create_class_folders(parent_folder_id, class_names)

    def create_semester_folders(self, class_names: list, parent_folder_id: str = None) -> bool:
        """
        Creates new folders for a new semester's classes.

        Args:
            class_names (list): List of class names
            parent_folder_id (str, optional): Parent folder ID

        Returns:
            bool: True if successful, False otherwise
        """
        return self.drive_service_impl.create_semester_folders(class_names, parent_folder_id)

    # ===== Spreadsheet Methods =====

    def create_spreadsheet(self, assignment_data: dict) -> Optional[Dict]:
        """
        Creates a simple Google Sheets document for the assignment.

        Args:
            assignment_data (dict): Assignment data including name and course

        Returns:
            Optional[Dict]: Spreadsheet information or None if an error occurs
        """
        return self.sheets_service_impl.create_spreadsheet(assignment_data)

    # ===== Presentation Methods =====

    def create_presentation(self, assignment_data: dict) -> Optional[Dict]:
        """
        Creates a simple Google Slides presentation for the assignment.

        Args:
            assignment_data (dict): Assignment data including name and course

        Returns:
            Optional[Dict]: Presentation information or None if an error occurs
        """
        return self.slides_service_impl.create_presentation(assignment_data)

    # ===== Helper Methods =====

    def _get_folder_id(self, class_name: str) -> Optional[str]:
        """
        Get folder ID from Firebase for given class

        Args:
            class_name (str): Name of the class

        Returns:
            Optional[str]: Folder ID or None if not found
        """
        return self.drive_service_impl._get_folder_id(class_name)

    def _get_folder_ids(self, class_name: str) -> List[str]:
        """
        Helper method to get folder IDs from Firebase

        Args:
            class_name (str): Name of the class

        Returns:
            List[str]: List of folder IDs
        """
        return self.drive_service_impl._get_folder_ids(class_name)

    # ===== Document Format Methods =====

    def create_mla_document(self, assignment_data: dict) -> Optional[Dict]:
        """
        Creates an MLA formatted document for the assignment.

        Args:
            assignment_data (dict): Assignment data

        Returns:
            Optional[Dict]: Document information or None if an error occurs
        """
        try:
            # Create base document
            doc = self.create_document(assignment_data['name'])
            if not doc:
                return None

            document_id = doc.get('documentId')

            # Get user info from assignment data
            student_name = assignment_data.get('student_name', '')
            professor = assignment_data.get('professor', '')
            class_name = assignment_data.get('course_name', '')

            # Apply MLA formatting using existing update_document method
            result = self.update_document(
                document_id=document_id,
                name=student_name,
                professor=professor,
                class_name=class_name
            )

            if not result:
                return None

            # Move document to correct class folder
            folder_id = self._get_folder_id(class_name)
            if folder_id:
                self.move_to_folder(document_id, folder_id)

            return {
                'id': document_id,
                'url': f'https://docs.google.com/document/d/{document_id}/edit'
            }

        except Exception as e:
            print(f"Error creating MLA document: {e}")
            return None

    def create_apa_document(self, assignment_data: dict) -> Optional[Dict]:
        """
        Creates an APA formatted document for the assignment.

        Args:
            assignment_data (dict): Assignment data

        Returns:
            Optional[Dict]: Document information or None if an error occurs
        """
        try:
            # Create base document
            doc = self.create_document(assignment_data['name'])
            if not doc:
                return None

            document_id = doc.get('documentId')

            # Get user info from assignment data
            student_name = assignment_data.get('student_name', '')
            professor = assignment_data.get('professor', '')
            class_name = assignment_data.get('course_name', '')

            # Apply APA formatting using existing update_document_apa method
            result = self.update_document_apa(
                document_id=document_id,
                name=student_name,
                professor=professor,
                class_name=class_name
            )

            if not result:
                return None

            # Move document to correct class folder
            folder_id = self._get_folder_id(class_name)
            if folder_id:
                self.move_to_folder(document_id, folder_id)

            # Create document info
            doc_info = {
                'document_id': document_id,
                'assignment_name': assignment_data['name'],
                'course_name': class_name,
                'url': f'https://docs.google.com/document/d/{document_id}/edit',
                'format': 'APA'
            }

            # Store in Firebase if course_id and assignment_id are provided
            if 'course_id' in assignment_data and 'assignment_id' in assignment_data:
                self.store_document_info(
                    assignment_data['course_id'],
                    assignment_data['assignment_id'],
                    doc_info
                )

            return doc_info

        except Exception as e:
            print(f"Error creating APA document: {e}")
            return None
