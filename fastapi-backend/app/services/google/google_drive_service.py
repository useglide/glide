# Standard library imports
from datetime import datetime
from typing import Optional, Dict, List

# Third-party imports
from firebase_admin import db

# Local imports
from app.services.google.base_google_service import BaseGoogleService

class GoogleDriveService(BaseGoogleService):
    """
    Service for interacting with Google Drive.
    Extends BaseGoogleService with file and folder management methods.
    """

    def move_to_folder(self, file_id: str, folder_id: str) -> bool:
        """
        Moves a file to specified folder in Google Drive.

        Args:
            file_id (str): The ID of the file to move
            folder_id (str): The ID of the destination folder

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            file = self.drive_service.files().get(
                fileId=file_id,
                fields='parents'
            ).execute()

            previous_parents = ",".join(file.get('parents', []))
            self.drive_service.files().update(
                fileId=file_id,
                addParents=folder_id,
                removeParents=previous_parents,
                fields='id, parents'
            ).execute()

            return True
        except Exception as e:
            print(f'Error moving file: {e}')
            return False

    def create_class_folders(self, parent_folder_id: str, class_names: list) -> list:
        """
        Creates folders for each class and a Notes subfolder within each.

        Args:
            parent_folder_id (str): The ID of the parent folder
            class_names (list): List of class names

        Returns:
            list: List of created folder IDs
        """
        created_folders = []
        for class_name in class_names:
            try:
                # Create main class folder
                folder_metadata = {
                    'name': class_name,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [parent_folder_id]
                }

                folder = self.drive_service.files().create(
                    body=folder_metadata,
                    fields='id'
                ).execute()

                folder_id = folder.get('id')

                # Create Notes subfolder
                notes_metadata = {
                    'name': 'Notes',
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [folder_id]
                }

                notes_folder = self.drive_service.files().create(
                    body=notes_metadata,
                    fields='id'
                ).execute()

                # Save both folders to Firebase
                self._save_folder_info(class_name, {
                    'main_folder_id': folder_id,
                    'notes_folder_id': notes_folder.get('id')
                })

                created_folders.append(folder_id)

            except Exception as e:
                print(f'Error creating folder for {class_name}: {e}')

        return created_folders

    def _save_folder_info(self, folder_name: str, folder_data: dict):
        """
        Saves folder information to Firebase

        Args:
            folder_name (str): Name of the folder
            folder_data (dict): Folder data including IDs

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.user_id:
                return False

            folders_ref = db.reference(f'users/{self.user_id}/folders')

            # Create a unique key for the folder
            folder_key = folder_name.replace('.', '_').replace('/', '_').replace(' ', '_')

            # Store folder information
            folders_ref.child(folder_key).set({
                'name': folder_name,
                'main_folder_id': folder_data['main_folder_id'],
                'notes_folder_id': folder_data['notes_folder_id'],
                'created_at': datetime.now().isoformat()
            })

            return True

        except Exception as e:
            print(f"Error saving folder info: {e}")
            return False

    def _get_folder_id(self, class_name: str) -> Optional[str]:
        """
        Get folder ID from Firebase for given class

        Args:
            class_name (str): Name of the class

        Returns:
            Optional[str]: Folder ID or None if not found
        """
        try:
            if not self.user_id:
                return None

            # Get current semester
            current_date = datetime.now()
            semester = 'Spring' if current_date.month < 7 else 'Fall'
            semester_name = f"{semester} {current_date.year}"

            # Look up folder in current semester
            semester_ref = db.reference(f'users/{self.user_id}/semesters/{semester_name}/folders')
            folders = semester_ref.get()

            if folders:
                for folder_data in folders.values():
                    if folder_data.get('name') == class_name:
                        return folder_data.get('folder_id')
            return None

        except Exception as e:
            print(f"Error: Could not find folder ID for {class_name}: {e}")
            return None

    def _get_folder_ids(self, class_name: str) -> List[str]:
        """
        Helper method to get folder IDs from Firebase

        Args:
            class_name (str): Name of the class

        Returns:
            List[str]: List of folder IDs
        """
        try:
            current_date = datetime.now()
            semester = 'Spring' if current_date.month < 7 else 'Fall'
            semester_name = f"{semester} {current_date.year}"

            semester_ref = db.reference(f'users/{self.user_id}/semesters/{semester_name}/folders')
            folders = semester_ref.get()

            folder_ids = []
            if folders:
                for folder_data in folders.values():
                    if folder_data.get('name') == class_name:
                        if folder_data.get('folder_id'):
                            folder_ids.append(folder_data.get('folder_id'))
                        if folder_data.get('notes_folder_id'):
                            folder_ids.append(folder_data.get('notes_folder_id'))
                        break

            return folder_ids
        except Exception as e:
            print(f"Error getting folder IDs: {str(e)}")
            return []

    def create_semester_folders(self, class_names: list, parent_folder_id: str = None) -> bool:
        """
        Creates new folders for a new semester's classes.

        Args:
            class_names (list): List of class names
            parent_folder_id (str, optional): Parent folder ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.user_id:
                return False

            # If no parent folder provided, get the user's root folder from Firebase
            if not parent_folder_id:
                user_ref = db.reference(f'users/{self.user_id}')
                user_data = user_ref.get()
                if not user_data or 'google_parent_folder' not in user_data:
                    return False
                parent_folder_id = user_data['google_parent_folder']

            # Create semester folder
            current_date = datetime.now()
            semester = 'Spring' if current_date.month < 7 else 'Fall'
            semester_name = f"{semester} {current_date.year}"

            semester_metadata = {
                'name': semester_name,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [parent_folder_id]
            }

            semester_folder = self.drive_service.files().create(
                body=semester_metadata,
                fields='id'
            ).execute()

            semester_folder_id = semester_folder.get('id')

            # Create folders for each class
            created_folders = []
            for class_name in class_names:
                try:
                    # Create main class folder
                    folder_metadata = {
                        'name': class_name,
                        'mimeType': 'application/vnd.google-apps.folder',
                        'parents': [semester_folder_id]
                    }

                    folder = self.drive_service.files().create(
                        body=folder_metadata,
                        fields='id'
                    ).execute()

                    folder_id = folder.get('id')

                    # Create Notes subfolder
                    notes_metadata = {
                        'name': 'Notes',
                        'mimeType': 'application/vnd.google-apps.folder',
                        'parents': [folder_id]
                    }

                    notes_folder = self.drive_service.files().create(
                        body=notes_metadata,
                        fields='id'
                    ).execute()

                    notes_folder_id = notes_folder.get('id')

                    # Save folder info to Firebase with both IDs
                    self._save_semester_folder_info(
                        semester_name=semester_name,
                        class_name=class_name,
                        folder_data={
                            'folder_id': folder_id,
                            'notes_folder_id': notes_folder_id
                        }
                    )

                    created_folders.append(folder_id)

                except Exception as e:
                    print(f'Error creating folder for {class_name}: {e}')
                    continue

            return len(created_folders) > 0

        except Exception as e:
            print(f"Error creating semester folders: {e}")
            return False

    def _save_semester_folder_info(self, semester_name: str, class_name: str, folder_data: dict):
        """
        Saves semester folder information to Firebase with notes subfolder

        Args:
            semester_name (str): Name of the semester
            class_name (str): Name of the class
            folder_data (dict): Folder data including IDs

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.user_id:
                return False

            # Create a reference to the semester folders
            semester_ref = db.reference(f'users/{self.user_id}/semesters/{semester_name}/folders')

            # Create a unique key for the folder
            folder_key = class_name.replace('.', '_').replace('/', '_').replace(' ', '_')

            # Store folder information with notes folder ID
            semester_ref.child(folder_key).set({
                'name': class_name,
                'folder_id': folder_data['folder_id'],
                'notes_folder_id': folder_data['notes_folder_id'],
                'created_at': datetime.now().isoformat()
            })

            return True

        except Exception as e:
            print(f"Error saving semester folder info: {e}")
            return False
