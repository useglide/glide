# Standard library imports
from datetime import datetime
from typing import Optional, Dict, List

# Third-party imports
from firebase_admin import db
from googleapiclient.discovery import build

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
            print(f"Creating semester folders for user {self.user_id} with {len(class_names)} classes")

            if not self.user_id:
                print("Error: No user ID provided")
                return False

            if not class_names or len(class_names) == 0:
                print("Error: No class names provided")
                return False

            if not self.drive_service:
                print("Error: Google Drive service not initialized")
                if not self.credentials:
                    print("Error: No Google credentials available")
                    return False
                try:
                    self.drive_service = build('drive', 'v3', credentials=self.credentials)
                    print("Successfully initialized Google Drive service")
                except Exception as drive_error:
                    print(f"Error initializing Google Drive service: {str(drive_error)}")
                    return False

            # If no parent folder provided, get the user's root folder from Firebase
            if not parent_folder_id:
                print("No parent folder ID provided, looking up from Firebase")
                try:
                    user_ref = db.reference(f'users/{self.user_id}')
                    user_data = user_ref.get()

                    if not user_data:
                        print(f"No user data found in Firebase for user {self.user_id}")
                        # Create a root folder in Google Drive
                        print("Creating root folder in Google Drive")
                        root_folder = self.drive_service.files().create(
                            body={
                                'name': 'Glide Folders',
                                'mimeType': 'application/vnd.google-apps.folder'
                            },
                            fields='id'
                        ).execute()

                        parent_folder_id = root_folder.get('id')

                        # Save the root folder ID to Firebase
                        if user_ref:
                            user_ref.update({'google_parent_folder': parent_folder_id})
                            print(f"Saved root folder ID {parent_folder_id} to Firebase")
                    elif 'google_parent_folder' not in user_data:
                        print("No google_parent_folder found in user data")
                        # Create a root folder in Google Drive
                        print("Creating root folder in Google Drive")
                        root_folder = self.drive_service.files().create(
                            body={
                                'name': 'Glide Folders',
                                'mimeType': 'application/vnd.google-apps.folder'
                            },
                            fields='id'
                        ).execute()

                        parent_folder_id = root_folder.get('id')

                        # Save the root folder ID to Firebase
                        user_ref.update({'google_parent_folder': parent_folder_id})
                        print(f"Saved root folder ID {parent_folder_id} to Firebase")
                    else:
                        parent_folder_id = user_data['google_parent_folder']
                        print(f"Found parent folder ID in Firebase: {parent_folder_id}")
                except Exception as firebase_error:
                    print(f"Error accessing Firebase: {str(firebase_error)}")
                    # Create a root folder in Google Drive as fallback
                    try:
                        print("Creating root folder in Google Drive as fallback")
                        root_folder = self.drive_service.files().create(
                            body={
                                'name': 'Glide Folders',
                                'mimeType': 'application/vnd.google-apps.folder'
                            },
                            fields='id'
                        ).execute()

                        parent_folder_id = root_folder.get('id')
                    except Exception as drive_error:
                        print(f"Error creating root folder: {str(drive_error)}")
                        return False

            if not parent_folder_id:
                print("Error: Could not determine parent folder ID")
                return False

            print(f"Using parent folder ID: {parent_folder_id}")

            # Create semester folder
            current_date = datetime.now()
            semester = 'Spring' if current_date.month < 7 else 'Fall'
            semester_name = f"{semester} {current_date.year}"
            print(f"Creating semester folder: {semester_name}")

            # Check if semester folder already exists
            try:
                query = f"name='{semester_name}' and mimeType='application/vnd.google-apps.folder' and '{parent_folder_id}' in parents and trashed=false"
                results = self.drive_service.files().list(
                    q=query,
                    spaces='drive',
                    fields='files(id, name)'
                ).execute()

                existing_folders = results.get('files', [])

                if existing_folders:
                    print(f"Found existing semester folder: {existing_folders[0]['name']} with ID: {existing_folders[0]['id']}")
                    semester_folder_id = existing_folders[0]['id']
                else:
                    # Create new semester folder
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
                    print(f"Created new semester folder with ID: {semester_folder_id}")
            except Exception as folder_error:
                print(f"Error checking/creating semester folder: {str(folder_error)}")
                # Try to create the folder anyway
                try:
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
                    print(f"Created new semester folder with ID: {semester_folder_id}")
                except Exception as create_error:
                    print(f"Error creating semester folder: {str(create_error)}")
                    return False

            if not semester_folder_id:
                print("Error: Failed to get or create semester folder")
                return False

            # Create folders for each class
            created_folders = []
            for class_name in class_names:
                try:
                    print(f"Creating folder for class: {class_name}")

                    # Check if class folder already exists
                    query = f"name='{class_name}' and mimeType='application/vnd.google-apps.folder' and '{semester_folder_id}' in parents and trashed=false"
                    results = self.drive_service.files().list(
                        q=query,
                        spaces='drive',
                        fields='files(id, name)'
                    ).execute()

                    existing_folders = results.get('files', [])

                    if existing_folders:
                        print(f"Found existing class folder: {existing_folders[0]['name']} with ID: {existing_folders[0]['id']}")
                        folder_id = existing_folders[0]['id']

                        # Check if Notes subfolder exists
                        query = f"name='Notes' and mimeType='application/vnd.google-apps.folder' and '{folder_id}' in parents and trashed=false"
                        results = self.drive_service.files().list(
                            q=query,
                            spaces='drive',
                            fields='files(id, name)'
                        ).execute()

                        existing_notes = results.get('files', [])

                        if existing_notes:
                            print(f"Found existing Notes folder with ID: {existing_notes[0]['id']}")
                            notes_folder_id = existing_notes[0]['id']
                        else:
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
                            print(f"Created new Notes folder with ID: {notes_folder_id}")
                    else:
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
                        print(f"Created new class folder with ID: {folder_id}")

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
                        print(f"Created new Notes folder with ID: {notes_folder_id}")

                    # Save folder info to Firebase with both IDs
                    saved = self._save_semester_folder_info(
                        semester_name=semester_name,
                        class_name=class_name,
                        folder_data={
                            'folder_id': folder_id,
                            'notes_folder_id': notes_folder_id
                        }
                    )

                    if saved:
                        print(f"Saved folder info to Firebase for class: {class_name}")
                    else:
                        print(f"Failed to save folder info to Firebase for class: {class_name}")

                    created_folders.append(folder_id)

                except Exception as e:
                    print(f'Error creating folder for {class_name}: {str(e)}')
                    continue

            success = len(created_folders) > 0
            print(f"Created {len(created_folders)} folders out of {len(class_names)} classes")
            return success

        except Exception as e:
            print(f"Error creating semester folders: {str(e)}")
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
                print("Error: No user ID provided")
                return False

            if not semester_name:
                print("Error: No semester name provided")
                return False

            if not class_name:
                print("Error: No class name provided")
                return False

            if not folder_data or 'folder_id' not in folder_data or 'notes_folder_id' not in folder_data:
                print("Error: Missing folder data")
                return False

            print(f"Saving folder info for class {class_name} in semester {semester_name}")

            try:
                # Create a reference to the semester folders
                semester_ref = db.reference(f'users/{self.user_id}/semesters/{semester_name}/folders')

                # Create a unique key for the folder
                folder_key = class_name.replace('.', '_').replace('/', '_').replace(' ', '_')

                # Store folder information with notes folder ID
                folder_info = {
                    'name': class_name,
                    'folder_id': folder_data['folder_id'],
                    'notes_folder_id': folder_data['notes_folder_id'],
                    'created_at': datetime.now().isoformat()
                }

                semester_ref.child(folder_key).set(folder_info)
                print(f"Successfully saved folder info to Firebase: {folder_info}")

                return True
            except Exception as db_error:
                print(f"Error accessing Firebase database: {str(db_error)}")
                print("Make sure FIREBASE_DATABASE_URL is set correctly in your environment variables")
                return False

        except Exception as e:
            print(f"Error saving semester folder info: {str(e)}")
            return False
