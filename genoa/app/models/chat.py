"""
Chat models for the API.

This module defines the request and response models for chat endpoints.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class ChatRequest(BaseModel):
    """Request model for chat endpoints."""
    query: str
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoints."""
    response: str
    conversation_id: str
    metadata: Optional[Dict[str, Any]] = None


class ChatHistoryItem(BaseModel):
    """Model for a single chat history item."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    """Response model for chat history endpoints."""
    conversation_id: str
    messages: List[ChatHistoryItem]
