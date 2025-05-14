"""
Memory service for storing and retrieving conversation history.
This service provides a way to persist conversation memory between sessions.
"""
from typing import Dict, Optional, List
from langchain_core.memory import ConversationBufferMemory
from langchain_core.messages import BaseMessage
import uuid
import time

class MemoryService:
    """
    Service for managing conversation memory.

    This service stores conversation history in memory and provides methods
    to retrieve and update it. Each conversation is identified by a unique ID.
    """

    def __init__(self):
        """Initialize the memory service with an empty dictionary of conversations."""
        # Dictionary to store conversations by ID
        self._conversations: Dict[str, ConversationBufferMemory] = {}
        # Dictionary to store last access time for each conversation
        self._last_accessed: Dict[str, float] = {}
        # Maximum number of conversations to store
        self._max_conversations = 100
        # Time in seconds after which a conversation is considered expired
        self._expiry_time = 24 * 60 * 60  # 24 hours

    def get_memory(self, conversation_id: Optional[str] = None) -> ConversationBufferMemory:
        """
        Get the memory for a specific conversation.

        Args:
            conversation_id: The ID of the conversation. If None, a new ID is generated.

        Returns:
            A ConversationBufferMemory instance for the specified conversation.
        """
        # Clean up expired conversations
        self._cleanup_expired()

        # If no conversation ID is provided, generate a new one
        if not conversation_id or conversation_id == "new_conversation":
            conversation_id = str(uuid.uuid4())

        # If the conversation doesn't exist, create it
        if conversation_id not in self._conversations:
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
            self._conversations[conversation_id] = memory

        # Update the last access time
        self._last_accessed[conversation_id] = time.time()

        return self._conversations[conversation_id]

    def add_user_message(self, conversation_id: str, message: str) -> None:
        """
        Add a user message to the conversation history.

        Args:
            conversation_id: The ID of the conversation.
            message: The message from the user.
        """
        memory = self.get_memory(conversation_id)
        memory.chat_memory.add_user_message(message)

    def add_ai_message(self, conversation_id: str, message: str) -> None:
        """
        Add an AI message to the conversation history.

        Args:
            conversation_id: The ID of the conversation.
            message: The message from the AI.
        """
        memory = self.get_memory(conversation_id)
        memory.chat_memory.add_ai_message(message)

    def get_messages(self, conversation_id: str) -> List[BaseMessage]:
        """
        Get all messages for a specific conversation.

        Args:
            conversation_id: The ID of the conversation.

        Returns:
            A list of messages in the conversation.
        """
        # Check if the conversation exists
        if conversation_id in self._conversations:
            memory = self.get_memory(conversation_id)
            return memory.chat_memory.messages
        else:
            # If the conversation doesn't exist, create it and return an empty list
            self.get_memory(conversation_id)
            return []

    def get_last_user_message(self, conversation_id: str) -> Optional[str]:
        """
        Get the last message from the user in a specific conversation.

        Args:
            conversation_id: The ID of the conversation.

        Returns:
            The content of the last user message, or None if there are no user messages.
        """
        messages = self.get_messages(conversation_id)

        # Iterate through messages in reverse to find the last user message
        for message in reversed(messages):
            if message.type == "human":
                return message.content

        return None

    def clear_memory(self, conversation_id: str) -> None:
        """
        Clear the memory for a specific conversation.

        Args:
            conversation_id: The ID of the conversation.
        """
        if conversation_id in self._conversations:
            # Clear the existing memory
            self._conversations[conversation_id].clear()
        else:
            # If the conversation doesn't exist, create a new empty one
            self.get_memory(conversation_id)

    def delete_conversation(self, conversation_id: str) -> None:
        """
        Delete a conversation from memory.

        Args:
            conversation_id: The ID of the conversation to delete.
        """
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]

        if conversation_id in self._last_accessed:
            del self._last_accessed[conversation_id]

    def get_conversation_id(self, memory: ConversationBufferMemory) -> str:
        """
        Get the conversation ID for a memory instance.

        Args:
            memory: The memory instance to find the ID for.

        Returns:
            The conversation ID, or a new ID if the memory instance is not found.
        """
        # Find the conversation ID for this memory instance
        for conversation_id, mem in self._conversations.items():
            if mem is memory:
                return conversation_id

        # If not found, generate a new ID
        new_id = str(uuid.uuid4())
        self._conversations[new_id] = memory
        self._last_accessed[new_id] = time.time()
        return new_id

    def _cleanup_expired(self) -> None:
        """
        Clean up expired conversations to prevent memory leaks.
        This method removes conversations that haven't been accessed
        for a specified period of time.
        """
        current_time = time.time()
        expired_ids = []

        # Find expired conversations
        for conversation_id, last_accessed in self._last_accessed.items():
            if current_time - last_accessed > self._expiry_time:
                expired_ids.append(conversation_id)

        # Delete expired conversations
        for conversation_id in expired_ids:
            self.delete_conversation(conversation_id)

        # If we have too many conversations, delete the oldest ones
        if len(self._conversations) > self._max_conversations:
            # Sort conversations by last access time
            sorted_conversations = sorted(
                self._last_accessed.items(),
                key=lambda x: x[1]
            )

            # Delete the oldest conversations
            for conversation_id, _ in sorted_conversations[:len(self._conversations) - self._max_conversations]:
                self.delete_conversation(conversation_id)

# Create a singleton instance of the memory service
memory_service = MemoryService()
