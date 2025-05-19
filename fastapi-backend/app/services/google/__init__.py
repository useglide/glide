# Import services for easier access
from app.services.google.base_google_service import BaseGoogleService
from app.services.google.google_auth_service import GoogleAuthService
from app.services.google.google_docs_service import GoogleDocsService
from app.services.google.google_drive_service import GoogleDriveService
from app.services.google.google_sheets_service import GoogleSheetsService
from app.services.google.google_slides_service import GoogleSlidesService
from app.services.google.google_service import DocsService
from app.services.google.homework_service import HomeworkService
from app.services.google.semester_service import SemesterService

# For backward compatibility
# This allows existing code to continue using the DocsService class
# without having to update imports
__all__ = [
    'BaseGoogleService',
    'GoogleAuthService',
    'GoogleDocsService',
    'GoogleDriveService',
    'GoogleSheetsService',
    'GoogleSlidesService',
    'DocsService',
    'HomeworkService',
    'SemesterService'
]
