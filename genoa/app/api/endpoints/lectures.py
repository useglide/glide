"""
Lecture Notes API Endpoints

This module provides API endpoints for processing lecture audio and generating notes.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import datetime
import uuid

from app.services.lecture_service import LectureService
from app.core.config import settings
from app.models.lectures import LectureNotesResponse

router = APIRouter(prefix="/lectures", tags=["lectures"])

@router.post("/generate-notes", response_model=LectureNotesResponse)
async def generate_lecture_notes(
    audio_file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    context: Optional[str] = Form(None)
):
    """
    Generate notes from lecture audio using Gemini multimodal model.

    - **audio_file**: The lecture audio file (mp3, wav, etc.)
    - **title**: Optional title of the lecture
    - **context**: Optional context about the lecture (subject, course, etc.)

    Returns structured notes generated from the lecture audio.
    """
    try:
        # Check if Google API key is available using a more consistent approach
        from app.utils.common import handle_api_error
        if not settings.GOOGLE_API_KEY:
            raise handle_api_error(
                Exception("Google API key not found"),
                "Failed to initialize Lecture Service"
            )

        # Check file type
        file_extension = audio_file.filename.split('.')[-1].lower()
        allowed_extensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a']

        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Supported formats: {', '.join(allowed_extensions)}"
            )

        # Initialize the lecture service
        lecture_service = LectureService(api_key=settings.GOOGLE_API_KEY)

        # Process the audio file
        result = await lecture_service.process_audio(
            audio_file=audio_file,
            title=title,
            context=context
        )

        # Add timestamp and generate a unique ID
        lecture_id = str(uuid.uuid4())
        result["metadata"]["timestamp"] = datetime.datetime.now().isoformat()

        # Return the response
        return LectureNotesResponse(
            notes=result["notes"],
            lecture_id=lecture_id,
            metadata=result["metadata"]
        )

    except Exception as e:
        # Handle errors
        error_detail = str(e)
        print(f"ERROR in generate_lecture_notes: {error_detail}")

        if "quota" in error_detail.lower():
            error_detail = "API quota exceeded. Please try again later."
        elif "permission" in error_detail.lower():
            error_detail = "API permission denied. Please check your API key."
        elif "mime_type" in error_detail.lower() or "format" in error_detail.lower():
            error_detail = "Unsupported audio format. Please try a different file format."
        elif "content" in error_detail.lower() and "generate" in error_detail.lower():
            error_detail = "Error generating content. The audio file may be too large or in an unsupported format."

        # Log the full error for debugging
        import traceback
        print(f"Full error traceback: {traceback.format_exc()}")

        raise HTTPException(
            status_code=500,
            detail=f"Error processing lecture audio: {error_detail}"
        )
