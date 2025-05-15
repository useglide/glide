from pydantic import BaseModel, Field
from typing import List, Optional


class ChatMessage(BaseModel):
    """A single chat message."""
    role: str = Field(..., description="The role of the message sender (user or assistant)")
    content: str = Field(..., description="The content of the message")


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str = Field(..., description="The user's message")
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID for context")
    history: Optional[List[ChatMessage]] = Field(None, description="Optional conversation history")


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str = Field(..., description="The AI's response to the user's message")
    conversation_id: str = Field(..., description="The conversation ID for future reference")
