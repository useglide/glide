from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional

from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.core.security import optional_auth

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    request: ChatRequest,
    user: Optional[Dict[str, Any]] = Depends(optional_auth)
) -> ChatResponse:
    """
    Process a chat message and return the AI response.
    
    Args:
        request: The chat request containing the user's message
        user: Optional authenticated user information
        
    Returns:
        ChatResponse containing the AI's response
    """
    try:
        # Initialize chat service
        chat_service = ChatService()
        
        # Process the message
        result = chat_service.process_message(
            message=request.message,
            conversation_id=request.conversation_id,
            history=request.history
        )
        
        # Return the response
        return ChatResponse(
            response=result["response"],
            conversation_id=result["conversation_id"]
        )
    except Exception as e:
        # Log the error
        print(f"Error processing chat message: {str(e)}")
        
        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your message. Please try again."
        )
