from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional

from app.models.chat import MemoryResponse, ClearMemoryResponse
from app.services.chat_service import ChatService
from app.agents.memory_agent import MemoryAgent
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
        # Initialize chat service to get system prompt
        chat_service = ChatService()

        # Initialize memory agent
        memory_agent = MemoryAgent(chat_service.system_prompt)

        # Get the conversation messages
        try:
            chat_messages = memory_agent.get_messages_as_chat_messages(conversation_id)

            # If no messages found, raise 404
            if not chat_messages:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Conversation with ID {conversation_id} not found"
                )

            # Return the response
            return MemoryResponse(
                conversation_id=conversation_id,
                messages=chat_messages
            )
        except KeyError:
            # Conversation not found
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation with ID {conversation_id} not found"
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

        # Initialize memory agent
        memory_agent = MemoryAgent(chat_service.system_prompt)

        # Clear the conversation
        success = memory_agent.clear_conversation(conversation_id)

        # Return success (always true, as this is an idempotent operation)
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
