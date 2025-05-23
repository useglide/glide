"""
Memory agent for the Glide application.

This agent manages conversation history and context.
"""

from typing import Dict, Any, Optional, List
import uuid

from app.agents.base import BaseAgent, AgentResponse
from app.models.chat import ChatMessage


# In-memory conversation storage (for simplicity)
# In a production environment, this should be replaced with a database
conversation_history: Dict[str, List[Dict[str, str]]] = {}


class MemoryAgent(BaseAgent):
    """
    Agent responsible for managing conversation history and context.

    This agent can:
    1. Store and retrieve conversation history
    2. Clear conversation history
    3. Provide context for other agents
    """

    def __init__(self, system_prompt: str):
        """
        Initialize the Memory agent.

        Args:
            system_prompt: The system prompt to use for new conversations
        """
        super().__init__(name="memory")
        self.system_prompt = system_prompt

        # Keywords that indicate a memory-related query
        self.memory_keywords = [
            "forget", "clear", "start over", "new conversation",
            "reset", "clear history", "clear context", "clear memory"
        ]

    def can_handle(self, message: str, context: Dict[str, Any]) -> bool:
        """
        Determine if this agent can handle the given message.

        Args:
            message: The message to check
            context: Additional context for checking

        Returns:
            True if the agent can handle the message, False otherwise
        """
        # Check if this is a memory-related query
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in self.memory_keywords)

    async def process(self, message: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process a memory-related message.

        Args:
            message: The message to process
            context: Additional context for processing

        Returns:
            AgentResponse containing the memory operation result
        """
        # Get conversation ID
        conversation_id = context.get("conversation_id")

        # Check if this is a request to clear memory
        message_lower = message.lower()
        if any(keyword in message_lower for keyword in self.memory_keywords):
            # Clear the conversation history
            if conversation_id and conversation_id in conversation_history:
                # Reinitialize with system prompt
                conversation_history[conversation_id] = [
                    {"role": "system", "content": self.system_prompt}
                ]

                return {
                    "content": "I've cleared our conversation history. How can I help you now?",
                    "metadata": {"conversation_id": conversation_id},
                    "handled": True
                }
            else:
                # No conversation to clear
                new_id = self.create_conversation()
                return {
                    "content": "I've started a new conversation. How can I help you?",
                    "metadata": {"conversation_id": new_id},
                    "handled": True
                }

        # If not a memory operation, indicate that we didn't handle it
        return {
            "content": "",
            "metadata": {},
            "handled": False
        }

    def create_conversation(self) -> str:
        """
        Create a new conversation.

        Returns:
            The new conversation ID
        """
        conversation_id = str(uuid.uuid4())

        # Initialize with system prompt
        conversation_history[conversation_id] = [
            {"role": "system", "content": self.system_prompt}
        ]

        return conversation_id

    def get_conversation(self, conversation_id: Optional[str] = None) -> tuple[str, List[Dict[str, str]]]:
        """
        Get or create a conversation history.

        Args:
            conversation_id: Optional conversation ID

        Returns:
            Tuple of (conversation_id, messages)
        """
        if not conversation_id or conversation_id not in conversation_history:
            conversation_id = self.create_conversation()

        return conversation_id, conversation_history[conversation_id]

    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        """
        Add a message to the conversation history.

        Args:
            conversation_id: The conversation ID
            role: The role of the message sender (user or assistant)
            content: The content of the message
        """
        if conversation_id not in conversation_history:
            conversation_id = self.create_conversation()

        conversation_history[conversation_id].append({
            "role": role,
            "content": content
        })

    def clear_conversation(self, conversation_id: str) -> bool:
        """
        Clear a conversation history.

        Args:
            conversation_id: The conversation ID to clear

        Returns:
            True if the conversation was cleared, False otherwise
        """
        if conversation_id in conversation_history:
            # Reinitialize with system prompt
            conversation_history[conversation_id] = [
                {"role": "system", "content": self.system_prompt}
            ]
            return True

        return False

    def get_messages_as_chat_messages(self, conversation_id: str) -> List[ChatMessage]:
        """
        Get conversation history as ChatMessage objects.

        Args:
            conversation_id: The conversation ID

        Returns:
            List of ChatMessage objects
        """
        if conversation_id not in conversation_history:
            return []

        # Skip the system prompt
        messages = conversation_history[conversation_id][1:]

        return [
            ChatMessage(role=msg["role"], content=msg["content"])
            for msg in messages
        ]
