# Standard library imports
from datetime import datetime
from typing import Optional, Dict, List

# Third-party imports
from firebase_admin import db

# Local imports
from app.services.google.google_service import DocsService

class HomeworkService(DocsService):
    """
    Service for creating and managing homework documents.
    Extends DocsService with homework-specific methods.
    """

    def create_homework_document(self, canvas_service, selected_assignment_index=None, student_name=None, professor=None) -> Dict:
        """
        Create a homework document based on Canvas assignment data

        Args:
            canvas_service: Canvas service instance with assignment data
            selected_assignment_index: Optional index of selected assignment
            student_name: Optional student name (will be fetched from Canvas if not provided)
            professor: Optional professor name (will be fetched from Canvas if not provided)

        Returns:
            Dict: Document information or error message
        """
        try:
            # Get student name from Canvas if not provided
            if student_name is None:
                student_name = canvas_service.get_user_name()
                if not student_name:
                    return {"error": "Could not get student name from Canvas"}

            # If we have specific assignment details from the request
            if hasattr(canvas_service, 'current_assignment'):
                assignment = canvas_service.current_assignment
                course = canvas_service.current_course

                # Get folder ID for the class
                folder_id = self._get_folder_id(course['name'])
                if not folder_id:
                    return {"error": "Could not find folder ID for class"}

                # Create assignment info structure
                assignment_info = {
                    'course_name': course['name'],
                    'name': assignment['name'],
                    'course_id': course['id'],
                    'assignment_data': assignment
                }

                # Create and setup document
                doc_info = self._create_and_setup_document(
                    assignment=assignment_info,
                    student_name=student_name,
                    professor=professor or canvas_service.get_course_professor(course['id']),
                    folder_id=folder_id
                )

                if doc_info:
                    # Store document info in database
                    self.store_document_info(course['id'], assignment['id'], doc_info)
                    return {
                        "status": "document_created",
                        "doc_info": doc_info
                    }
                else:
                    return {"error": "Failed to create document"}

            # Legacy code for selection-based creation
            else:
                # Get all assignments from Canvas
                assignments = []
                courses = canvas_service.get_classes()

                # Collect assignments in a list
                for course in courses:
                    course_assignments = canvas_service.get_current_assignments(course['id'])
                    professor = canvas_service.get_course_professor(course['id'])  # Get professor for each course

                    for assignment in course_assignments:
                        due_date = assignment.get("due_at")
                        if due_date:
                            due_date = datetime.strptime(due_date, "%Y-%m-%dT%H:%M:%SZ")
                            due_date = due_date.strftime("%B %d, %Y at %I:%M %p")

                        assignment_info = {
                            'index': len(assignments),
                            'course_name': course['name'],
                            'name': assignment.get('name'),
                            'due_date': due_date or 'No due date',
                            'course_id': course['id'],
                            'assignment_data': assignment
                        }
                        assignments.append(assignment_info)

                # If no assignment is selected, return the list of assignments
                if selected_assignment_index is None:
                    return {
                        "assignments": assignments,
                        "status": "pending_selection"
                    }

                # If an assignment is selected, create the document
                selected_assignment = assignments[selected_assignment_index]

                # Get folder ID for the class
                folder_id = self._get_folder_id(selected_assignment['course_name'])
                if not folder_id:
                    return {"error": "Could not find folder ID for class"}

                # Create and setup document
                doc_info = self._create_and_setup_document(
                    assignment=selected_assignment,
                    student_name=student_name,
                    professor=professor,
                    folder_id=folder_id
                )

                if doc_info:
                    return {
                        "status": "document_created",
                        "doc_info": doc_info
                    }
                else:
                    return {"error": "Failed to create document"}

        except Exception as e:
            print(f"Error in create_homework_document: {str(e)}")  # Add debug logging
            return {"error": f"Error in create_homework_document: {str(e)}"}

    def _create_and_setup_document(self,
                                 assignment: Dict,
                                 student_name: str,
                                 professor: str,
                                 folder_id: str) -> Optional[Dict]:
        """
        Create and setup the document with initial content

        Args:
            assignment (Dict): Assignment information
            student_name (str): Student name
            professor (str): Professor name
            folder_id (str): Folder ID

        Returns:
            Optional[Dict]: Document information or None if an error occurs
        """
        try:
            # Create document
            doc = self.create_document(assignment['name'])
            if not doc:
                return None

            document_id = doc.get('documentId')

            # Update document content
            self.update_document(
                document_id=document_id,
                name=student_name,
                professor=professor,
                class_name=assignment['course_name']
            )

            # Move to appropriate folder
            self.move_to_folder(document_id, folder_id)

            # Create return info
            doc_info = {
                'document_id': document_id,
                'assignment_name': assignment['name'],
                'course_name': assignment['course_name'],
                'url': f'https://docs.google.com/document/d/{document_id}/edit'
            }

            print("\nDocument created and set up successfully!")
            print(f"You can view your document at: {doc_info['url']}")

            return doc_info

        except Exception as e:
            print(f"Error setting up document: {e}")
            return None

    def get_existing_document(self, course_id, assignment_id):
        """
        Check if a document already exists for this assignment in Firebase

        Args:
            course_id: Course ID
            assignment_id: Assignment ID

        Returns:
            Optional[Dict]: Document information or None if not found
        """
        try:
            if not self.user_id:
                return None

            key = f"{course_id}_{assignment_id}"
            docs_ref = db.reference(f'users/{self.user_id}/documents/{key}')
            return docs_ref.get()
        except Exception as e:
            print(f"Error getting document from Firebase: {e}")
            return None

    def store_document_info(self, course_id, assignment_id, doc_info):
        """
        Store document information in Firebase

        Args:
            course_id: Course ID
            assignment_id: Assignment ID
            doc_info: Document information

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.user_id:
                return False

            key = f"{course_id}_{assignment_id}"
            docs_ref = db.reference(f'users/{self.user_id}/documents')
            docs_ref.child(key).set(doc_info)
            return True
        except Exception as e:
            print(f"Error storing document in Firebase: {e}")
            return False

    def create_notes_doc(self, doc_name: str, folder_id: str) -> Optional[Dict]:
        """
        Create a new Google Doc formatted for notes and move it to notes subfolder

        Args:
            doc_name (str): Name of the document
            folder_id (str): Folder ID

        Returns:
            Optional[Dict]: Document information or None if an error occurs
        """
        try:
            # Create an empty document
            doc_body = {
                'title': doc_name
            }
            doc = self.docs_service.documents().create(body=doc_body).execute()
            document_id = doc.get('documentId')

            # Get the notes folder ID from Firebase
            current_date = datetime.now()
            semester = 'Spring' if current_date.month < 7 else 'Fall'
            semester_name = f"{semester} {current_date.year}"

            # Look up the notes folder ID
            semester_ref = db.reference(f'users/{self.user_id}/semesters/{semester_name}/folders')
            folders = semester_ref.get()

            notes_folder_id = None
            if folders:
                for folder_data in folders.values():
                    if folder_data.get('folder_id') == folder_id:
                        notes_folder_id = folder_data.get('notes_folder_id')
                        break

            if not notes_folder_id:
                print(f"Warning: Notes folder not found, using main folder")
                notes_folder_id = folder_id

            # Move document to notes folder
            if not self.move_to_folder(document_id, notes_folder_id):
                print(f"Warning: Failed to move document to notes folder")

            return {
                'document_id': document_id,
                'title': doc_name,
                'url': f'https://docs.google.com/document/d/{document_id}/edit'
            }

        except Exception as e:
            print(f"Error creating notes document: {e}")
            return None

    def get_folder_documents_content(self, class_name: str) -> Optional[List[str]]:
        """
        Get the content of all documents in folders for a specific class

        Args:
            class_name (str): Name of the class to get documents for

        Returns:
            Optional[List[str]]: List of document contents or None if an error occurs
        """
        try:
            if not self.user_id:
                return None

            # Make sure we have valid credentials and services
            if not self.credentials:
                self.credentials = self._get_credentials()
                if not self.credentials:
                    return None

            # Initialize services if needed
            if not self.drive_service or not self.docs_service:
                self._initialize_services()

            # Get folder IDs
            folder_ids = self._get_folder_ids(class_name)
            if not folder_ids:
                return None


            contents = []
            for folder_id in folder_ids:
                try:
                    # First, verify we can access the folder
                    try:
                        # Check if folder exists and is accessible
                        self.drive_service.files().get(
                            fileId=folder_id,
                            fields="name, mimeType, permissions"
                        ).execute()
                    except Exception as e:
                        print(f"Cannot access folder {folder_id}: {str(e)}")
                        continue

                    # List all files the user has access to
                    page_token = None
                    while True:
                        # Get all files with detailed information
                        response = self.drive_service.files().list(
                            q=f"mimeType='application/vnd.google-apps.document'",
                            spaces='drive',
                            fields='nextPageToken, files(id, name, mimeType, parents)',
                            pageToken=page_token,
                            pageSize=1000,
                            orderBy='modifiedTime desc'
                        ).execute()

                        files = response.get('files', [])
                        print(f"Retrieved {len(files)} files in this batch")

                        # Filter files that belong to our folder
                        matching_files = [
                            f for f in files
                            if 'parents' in f and folder_id in f['parents']
                        ]


                        # Process matching files
                        for file in matching_files:
                            try:
                                document = self.docs_service.documents().get(
                                    documentId=file['id']
                                ).execute()

                                content = ''
                                for element in document.get('body', {}).get('content', []):
                                    if 'paragraph' in element:
                                        for para_element in element['paragraph']['elements']:
                                            if 'textRun' in para_element:
                                                content += para_element['textRun'].get('content', '')

                                if content.strip():
                                    contents.append(content)

                            except Exception as e:
                                print(f"Error processing document {file.get('name')}: {str(e)}")
                                continue

                        page_token = response.get('nextPageToken')
                        if not page_token:
                            break

                except Exception as e:
                    continue

            if contents:
                return contents

            return None

        except Exception as e:
            return None
