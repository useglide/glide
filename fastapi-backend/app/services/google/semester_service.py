# Standard library imports
from datetime import datetime

# Third-party imports
from firebase_admin import db

# Local imports
from app.services.google.google_service import DocsService

class SemesterService(DocsService):
    """
    Service for managing semester-related functionality.
    Extends DocsService with semester-specific methods.
    """

    def check_new_semester(self, canvas_service) -> bool:
        """
        Checks if a new semester has started and creates folders if needed.

        Args:
            canvas_service: Instance of CanvasService to get current classes

        Returns:
            bool: True if new semester was detected and folders were created
        """
        try:
            if not self.user_id:
                return False

            # Get current semester
            current_date = datetime.now()
            current_semester = 'Spring' if current_date.month < 7 else 'Fall'
            current_semester_name = f"{current_semester} {current_date.year}"

            # Check if we already have folders for this semester
            semester_ref = db.reference(f'users/{self.user_id}/semesters/{current_semester_name}')
            existing_semester = semester_ref.get()

            if existing_semester:
                return False  # Semester folders already exist

            # Get current classes from Canvas
            current_classes = canvas_service.get_classes()
            if not current_classes:
                return False

            class_names = [course['name'] for course in current_classes]

            # Create new folders for the semester
            return self.create_semester_folders(class_names)

        except Exception as e:
            print(f"Error checking for new semester: {e}")
            return False
