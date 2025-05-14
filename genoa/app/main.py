import sys
from pathlib import Path

# Add the parent directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.core.config import settings

app = FastAPI(title="Canvas LMS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/test-canvas")
async def test_canvas():
    """Test the Canvas API connection."""
    try:
        # Create Canvas service
        from app.services.canvas_service import CanvasService
        canvas_service = CanvasService(
            base_url=settings.CANVAS_BASE_URL,
            access_token=settings.CANVAS_API_KEY
        )

        # Get courses
        courses = await canvas_service.get_courses()

        # Return the courses as JSON
        return {"courses": courses}
    except Exception as e:
        return {"error": str(e)}

# Import models for the endpoints
from app.models.chat import ChatRequest, ChatResponse
from app.models.academic import StudyPlanRequest, StudyPlanResponse

# Direct API endpoint for chat/simple to fix 404 errors
@app.post("/api/chat/simple", response_model=ChatResponse)
async def api_chat_simple(request: ChatRequest):
    """
    Direct endpoint for /api/chat/simple to fix 404 errors.
    This forwards to the correct endpoint in the chat router.
    """
    try:
        # Import the simple chat function from the endpoints module
        from app.api.endpoints.chat import simple_chat

        # Call the function directly
        return await simple_chat(request)
    except Exception as e:
        print(f"Error in /api/chat/simple endpoint: {e}")
        return ChatResponse(
            response=f"Error: {str(e)}",
            conversation_id=request.conversation_id or "new_conversation"
        )

@app.post("/simple-chat", response_model=ChatResponse)
async def simple_chat_redirect(request: ChatRequest):
    """
    Redirect endpoint for simple chat requests.
    This is a compatibility endpoint that forwards to the new API endpoint.
    """
    try:
        # Import the simple chat function from the endpoints module
        from app.api.endpoints.chat import simple_chat

        # Call the function directly
        return await simple_chat(request)
    except Exception as e:
        print(f"Error in simple chat redirect: {e}")
        return ChatResponse(
            response=f"Error: {str(e)}",
            conversation_id=request.conversation_id or "new_conversation"
        )

@app.post("/get-courses", response_model=ChatResponse)
async def get_courses(request: ChatRequest):
    """A simple endpoint that just returns the courses."""
    try:
        # Get Canvas service
        from app.services.canvas_service import CanvasService
        canvas_service = CanvasService(
            base_url=settings.CANVAS_BASE_URL,
            access_token=settings.CANVAS_API_KEY
        )

        # Get courses
        courses = await canvas_service.get_courses()

        if courses:
            response = "Here are the courses you're enrolled in:\n\n"
            for i, course in enumerate(courses, 1):
                response += f"{i}. {course.get('name', 'Unnamed course')} (ID: {course.get('id', 'N/A')})\n"
        else:
            response = "I couldn't find any courses you're enrolled in. Please check your Canvas account."

        return ChatResponse(
            response=response,
            conversation_id=request.conversation_id or "new_conversation"
        )
    except Exception as e:
        print(f"Error getting courses: {e}")
        return ChatResponse(
            response=f"Error: {str(e)}",
            conversation_id=request.conversation_id or "new_conversation"
        )

@app.post("/academic-improvement", response_model=StudyPlanResponse)
async def academic_improvement_redirect(request: StudyPlanRequest):
    """
    Redirect endpoint for academic improvement requests.
    This is a compatibility endpoint that forwards to the new API endpoint.
    """
    try:
        # Import the academic improvement function from the endpoints module
        from app.api.endpoints.academic import academic_improvement

        # Call the function directly
        return await academic_improvement(request)
    except Exception as e:
        print(f"Error in academic improvement redirect: {e}")
        return StudyPlanResponse(
            response=f"Error: {str(e)}",
            study_plan={},
            conversation_id=request.conversation_id or "new_conversation"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
