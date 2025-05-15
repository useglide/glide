from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional, List

from app.models.chat import MemoryRequest, MemoryResponse, ClearMemoryResponse, ChatMessage
from app.services.chat_service import ChatService, conversation_history
from app.core.security import optional_auth

router = APIRouter()


@router.get("/{conversation_id}", response_model=MemoryResponse, status_code=status.HTTP_200_OK)
async def get_memory(
    conversation_id: str,
    user: Optional[Dict[str, Any]] = Depends(optional_auth)
) -> MemoryResponse:
    """
    Retrieve the conversation history for a specific conversation ID.
    
    Args:
        conversation_id: The conversation ID to retrieve history for
        user: Optional authenticated user information
        
    Returns:
        MemoryResponse containing the conversation history
    """
    try:
        # Check if the conversation exists
        if conversation_id not in conversation_history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with ID {conversation_id} not found"
            )
        
        # Get the conversation history
        messages = conversation_history[conversation_id]
        
        # Convert to ChatMessage format (skip system message)
        chat_messages = [
            ChatMessage(role=msg["role"], content=msg["content"])
            for msg in messages
            if msg["role"] != "system"
        ]
        
        # Return the response
        return MemoryResponse(
            conversation_id=conversation_id,
            messages=chat_messages
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error
        print(f"Error retrieving memory: {str(e)}")
        
        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the conversation history."
        )


@router.post("/{conversation_id}/clear", response_model=ClearMemoryResponse, status_code=status.HTTP_200_OK)
async def clear_memory(
    conversation_id: str,
    user: Optional[Dict[str, Any]] = Depends(optional_auth)
) -> ClearMemoryResponse:
    """
    Clear the conversation history for a specific conversation ID.
    
    Args:
        conversation_id: The conversation ID to clear history for
        user: Optional authenticated user information
        
    Returns:
        ClearMemoryResponse indicating success
    """
    try:
        # Initialize chat service to access system prompt
        chat_service = ChatService()
        
        # Check if the conversation exists
        if conversation_id not in conversation_history:
            # Return success even if not found (idempotent operation)
            return ClearMemoryResponse(
                conversation_id=conversation_id,
                success=True
            )
        
        # Reset the conversation to just the system prompt
        conversation_history[conversation_id] = [
            {"role": "system", "content": chat_service.system_prompt}
        ]
        
        # Return success
        return ClearMemoryResponse(
            conversation_id=conversation_id,
            success=True
        )
    except Exception as e:
        # Log the error
        print(f"Error clearing memory: {str(e)}")
        
        # Return a user-friendly error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while clearing the conversation history."
        )
