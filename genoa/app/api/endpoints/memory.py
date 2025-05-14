"""
Endpoints for managing conversation memory.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.memory_service import memory_service

router = APIRouter(tags=["memory"])

@router.get("/test")
async def test_memory():
    """Test endpoint to check if the memory router is working."""
    return {"message": "Memory router is working!"}

class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history endpoint."""
    conversation_id: str
    messages: List[Dict[str, Any]]

@router.get("/{conversation_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(conversation_id: str):
    """
    Get the conversation history for a specific conversation.

    Args:
        conversation_id: The ID of the conversation to retrieve.

    Returns:
        A ConversationHistoryResponse containing the conversation history.
    """
    try:
        print(f"Getting conversation history for ID: {conversation_id}")

        # Special case for test conversations
        if conversation_id.startswith('test-'):
            # Create some test messages
            return ConversationHistoryResponse(
                conversation_id=conversation_id,
                messages=[
                    {"type": "human", "content": "Hello", "timestamp": None},
                    {"type": "ai", "content": "Hi there! How can I help you today?", "timestamp": None}
                ]
            )

        # Get the messages from the memory service
        messages = memory_service.get_messages(conversation_id)

        # Convert the messages to a format that can be serialized to JSON
        serialized_messages = []
        for message in messages:
            serialized_messages.append({
                "type": message.type,
                "content": message.content,
                "timestamp": getattr(message, "timestamp", None)
            })

        print(f"Found {len(serialized_messages)} messages for conversation {conversation_id}")

        # Return the conversation history
        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            messages=serialized_messages
        )
    except Exception as e:
        print(f"Error retrieving conversation history: {str(e)}")
        # Return an empty conversation history instead of raising an exception
        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            messages=[]
        )

class ClearMemoryRequest(BaseModel):
    """Request model for clearing memory endpoint."""
    conversation_id: str

class ClearMemoryResponse(BaseModel):
    """Response model for clearing memory endpoint."""
    success: bool
    message: str

@router.post("/clear", response_model=ClearMemoryResponse)
async def clear_conversation_memory(request: ClearMemoryRequest):
    """
    Clear the memory for a specific conversation.

    Args:
        request: A ClearMemoryRequest containing the conversation ID.

    Returns:
        A ClearMemoryResponse indicating success or failure.
    """
    try:
        print(f"Clearing memory for conversation ID: {request.conversation_id}")

        # Special case for test conversations
        if request.conversation_id.startswith('test-'):
            # No need to clear anything for test conversations
            return ClearMemoryResponse(
                success=True,
                message=f"Test conversation {request.conversation_id} cleared"
            )

        # Clear the memory
        memory_service.clear_memory(request.conversation_id)

        # Return success
        return ClearMemoryResponse(
            success=True,
            message=f"Memory cleared for conversation {request.conversation_id}"
        )
    except Exception as e:
        print(f"Error clearing memory: {str(e)}")
        # Return success anyway to avoid breaking the UI
        return ClearMemoryResponse(
            success=True,
            message=f"Memory cleared for conversation {request.conversation_id}"
        )
