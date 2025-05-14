"""
Common utility functions for the application.
"""

from fastapi import HTTPException
from app.services.canvas_service import CanvasService
from app.core.config import settings

async def get_canvas_service() -> CanvasService:
    """
    Create and return a Canvas service instance.
    
    This is a utility function to avoid duplicating the Canvas service
    initialization code across multiple endpoints.
    
    Returns:
        CanvasService: An initialized Canvas service instance
        
    Raises:
        HTTPException: If the Canvas API key is not set
    """
    if not settings.CANVAS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Canvas API key not found. Please set the CANVAS_API_KEY environment variable."
        )
    
    return CanvasService(
        base_url=settings.CANVAS_BASE_URL,
        access_token=settings.CANVAS_API_KEY
    )

def handle_api_error(e: Exception, message: str = "Error processing request") -> HTTPException:
    """
    Handle API errors consistently across endpoints.
    
    Args:
        e: The exception that was raised
        message: A custom message to include in the error response
        
    Returns:
        HTTPException: A FastAPI HTTPException with appropriate status code and detail
    """
    # Log the error for debugging
    print(f"API Error: {str(e)}")
    
    # Return a consistent error response
    return HTTPException(
        status_code=500,
        detail=f"{message}: {str(e)}"
    )
