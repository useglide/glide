# Standard library imports
from datetime import datetime
from typing import Optional, Dict, List

# Local imports
from app.services.google.base_google_service import BaseGoogleService

class GoogleDocsService(BaseGoogleService):
    """
    Service for interacting with Google Docs.
    Extends BaseGoogleService with document-specific methods.
    """

    def create_document(self, title: str) -> Optional[Dict]:
        """
        Creates a new Google Doc with the given title.

        Args:
            title (str): The title of the document

        Returns:
            Optional[Dict]: Document information or None if an error occurs
        """
        try:
            document = self.docs_service.documents().create(
                body={'title': title}).execute()
            print(f'Created document with title: {title}')
            return document
        except Exception as e:
            print(f'Error creating document: {e}')
            return None

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
        try:
            # Create header
            header_requests = [{'createHeader': {'type': 'DEFAULT'}}]
            self.docs_service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': header_requests}
            ).execute()

            # Get header ID
            doc = self.docs_service.documents().get(
                documentId=document_id).execute()
            header_id = doc.get('headers', {}).popitem()[0]

            # Get current date
            current_date = datetime.now().strftime('%d %B %Y')
            last_name = name.split()[-1]

            # Calculate the end index for the main content
            main_content = f"{name}\n\n{professor}\n\n{class_name}\n\n{current_date}\n\n"
            main_content_end_index = len(main_content) + 1  # +1 for the initial index

            requests = [
                # Header content (Last Name and page number) - Right aligned
                {
                    'insertText': {
                        'location': {'segmentId': header_id, 'index': 0},
                        'text': f"{last_name} "
                    }
                },
                # Insert page number field
                {
                    'insertText': {
                        'location': {'segmentId': header_id, 'index': len(last_name) + 1},
                        'text': '1'  # This will be automatically updated by Google Docs
                    }
                },
                {
                    'insertText': {
                        'location': {'segmentId': header_id, 'index': len(last_name) + 2},
                        'text': "\n"
                    }
                },
                {
                    'updateParagraphStyle': {
                        'range': {'segmentId': header_id, 'startIndex': 0, 'endIndex': len(last_name) + 3},
                        'paragraphStyle': {'alignment': 'END'},
                        'fields': 'alignment'
                    }
                },
                # Main content - Left aligned
                {
                    'insertText': {
                        'location': {'index': 1},
                        'text': main_content
                    }
                },
                # Apply Times New Roman, 12pt to entire document
                {
                    'updateTextStyle': {
                        'range': {'startIndex': 1, 'endIndex': main_content_end_index},
                        'textStyle': {
                            'fontSize': {'magnitude': 12, 'unit': 'PT'},
                            'weightedFontFamily': {'fontFamily': 'Times New Roman'}
                        },
                        'fields': 'fontSize,weightedFontFamily'
                    }
                },
                # Apply Times New Roman, 12pt to header
                {
                    'updateTextStyle': {
                        'range': {
                            'segmentId': header_id,
                            'startIndex': 0,
                            'endIndex': len(last_name) + 3
                        },
                        'textStyle': {
                            'fontSize': {'magnitude': 12, 'unit': 'PT'},
                            'weightedFontFamily': {'fontFamily': 'Times New Roman'}
                        },
                        'fields': 'fontSize,weightedFontFamily'
                    }
                }
            ]

            # Execute the update
            result = self.docs_service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()

            return result
        except Exception as e:
            print(f"Error updating document: {e}")
            return None

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
        try:
            # First, set up 1-inch margins
            margin_requests = [{
                'updateDocumentStyle': {
                    'documentStyle': {
                        'marginTop': {'magnitude': 72, 'unit': 'PT'},
                        'marginBottom': {'magnitude': 72, 'unit': 'PT'},
                        'marginLeft': {'magnitude': 72, 'unit': 'PT'},
                        'marginRight': {'magnitude': 72, 'unit': 'PT'}
                    },
                    'fields': 'marginTop,marginBottom,marginLeft,marginRight'
                }
            }]

            self.docs_service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': margin_requests}
            ).execute()

            # Create header for page number
            header_requests = [{'createHeader': {'type': 'DEFAULT'}}]
            self.docs_service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': header_requests}
            ).execute()

            # Get header ID
            doc = self.docs_service.documents().get(documentId=document_id).execute()
            header_id = doc.get('headers', {}).popitem()[0]

            # Get current date
            current_date = datetime.now().strftime('%B %d, %Y')

            # Calculate content with proper spacing
            content = (
                f"{class_name}\n"  # Title at the top
                f"{name}\n"  # Author name
                f"{professor}\n"  # Professor
                f"{class_name}\n"  # Course name
                f"{current_date}"  # Date
            )

            requests = [
                # Add page number to header (right-aligned)
                {
                    'insertText': {
                        'location': {'segmentId': header_id, 'index': 0},
                        'text': "1"
                    }
                },
                # Right align page number
                {
                    'updateParagraphStyle': {
                        'range': {'segmentId': header_id, 'startIndex': 0, 'endIndex': 1},
                        'paragraphStyle': {'alignment': 'END'},
                        'fields': 'alignment'
                    }
                },
                # Main content
                {
                    'insertText': {
                        'location': {'index': 1},
                        'text': content
                    }
                },
                # Center align all content
                {
                    'updateParagraphStyle': {
                        'range': {'startIndex': 1, 'endIndex': len(content) + 1},
                        'paragraphStyle': {
                            'alignment': 'CENTER',
                            'lineSpacing': 240,  # Double spacing
                            'spaceAbove': {'magnitude': 0, 'unit': 'PT'},  # Remove extra space above paragraphs
                            'spaceBelow': {'magnitude': 0, 'unit': 'PT'}   # Remove extra space below paragraphs
                        },
                        'fields': 'alignment,lineSpacing,spaceAbove,spaceBelow'
                    }
                },
                # Apply Times New Roman, 12pt to entire document
                {
                    'updateTextStyle': {
                        'range': {'startIndex': 1, 'endIndex': len(content) + 1},
                        'textStyle': {
                            'fontSize': {'magnitude': 12, 'unit': 'PT'},
                            'weightedFontFamily': {'fontFamily': 'Times New Roman'}
                        },
                        'fields': 'fontSize,weightedFontFamily'
                    }
                },
                # Apply Times New Roman, 12pt to header
                {
                    'updateTextStyle': {
                        'range': {
                            'segmentId': header_id,
                            'startIndex': 0,
                            'endIndex': 1
                        },
                        'textStyle': {
                            'fontSize': {'magnitude': 12, 'unit': 'PT'},
                            'weightedFontFamily': {'fontFamily': 'Times New Roman'}
                        },
                        'fields': 'fontSize,weightedFontFamily'
                    }
                }
            ]

            # Execute the update
            result = self.docs_service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()

            return result
        except Exception as e:
            print(f"Error updating document: {e}")
            return None

    def export_as_pdf(self, document_id: str) -> Optional[bytes]:
        """
        Export a Google Doc as PDF.

        Args:
            document_id (str): The ID of the document to export

        Returns:
            Optional[bytes]: PDF content or None if an error occurs
        """
        try:
            # Get the PDF export
            response = self.drive_service.files().export(
                fileId=document_id,
                mimeType='application/pdf'
            ).execute()

            return response

        except Exception as e:
            print(f"Error exporting document as PDF: {str(e)}")
            return None
