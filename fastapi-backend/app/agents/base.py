"""
Base agent classes and interfaces for the Glide application.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, TypedDict
from pydantic import BaseModel, Field


class AgentResponse(TypedDict):
    """Response from an agent."""
    content: str
    metadata: Dict[str, Any]
    handled: bool


class BaseAgent(ABC):
    """Base agent class that all agents will inherit from."""

    def __init__(self, name: str):
        """
        Initialize the base agent.

        Args:
            name: The name of the agent
        """
        self.name = name

    @abstractmethod
    async def process(self, message: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process a message and return a response.

        Args:
            message: The message to process
            context: Additional context for processing

        Returns:
            AgentResponse containing the agent's response
        """
        pass

    def can_handle(self, message: str, context: Dict[str, Any]) -> bool:
        """
        Determine if this agent can handle the given message.

        Args:
            message: The message to check
            context: Additional context for checking

        Returns:
            True if the agent can handle the message, False otherwise
        """
        return False


class AgentInput(BaseModel):
    """Input to an agent."""
    message: str = Field(..., description="The message to process")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context for processing")


class AgentOutput(BaseModel):
    """Output from an agent."""
    content: str = Field(..., description="The content of the response")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    handled: bool = Field(default=False, description="Whether the agent handled the message")
    agent_name: str = Field(..., description="The name of the agent that generated the response")
