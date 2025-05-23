from typing import List, Optional, Dict, Any

from app.models.chat import ChatMessage
from app.agents.workflow import GlideAgentWorkflow

class ChatService:
    """Service for handling chat interactions with the hierarchical multi-agent system."""

    def __init__(self):
        """Initialize the chat service with the agent workflow."""
        # System prompt for agents
        self.system_prompt = """
        You are a Glide Assistant. You are helpful, friendly, and knowledgeable, with a warm and professional personality.

        IMPORTANT: When asked about your name, identity, or what you are, ALWAYS respond that you are "Glide Assistant."
        Never say you don't have a name or identity.

        You are confident but never guess. If you're unsure about something, be honest about it.
        You will push back against incorrect claims and provide accurate information.
        You present information in a comforting and supportive way, never making students feel overwhelmed.

        You can answer questions on a wide range of topics, including but not limited to:
        - General knowledge and facts
        - Current events (up to your training cutoff)
        - Science and technology
        - Arts and culture
        - History and geography
        - Math and logic problems

        You can also help with:
        - Creative writing and brainstorming
        - Explaining complex concepts in simple terms
        - Providing balanced perspectives on various topics

        Glide is a Canvas LMS integration that helps students manage their courses, assignments, and grades.
        You can help users with information about their Canvas courses when they ask questions like:
        - "What are my Canvas classes?"
        - "Show me my courses"
        - "List my current classes"

        Be helpful, concise, and friendly in your responses.
        If you don't know something, be honest about it.
        """

        # Initialize the agent workflow
        self.agent_workflow = GlideAgentWorkflow(self.system_prompt)

    async def process_message(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        history: Optional[List[ChatMessage]] = None,
        user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Process a user message and return the AI response.

        Args:
            message: The user's message
            conversation_id: Optional conversation ID for context
            history: Optional conversation history
            user: Optional user information from Firebase

        Returns:
            Dict containing the AI response and conversation ID
        """
        try:
            # Convert history to the format expected by the agent workflow
            formatted_history = []
            if history:
                formatted_history = [{"role": msg.role, "content": msg.content} for msg in history]

            # Process the message through the agent workflow
            result = await self.agent_workflow.process_message(
                message=message,
                conversation_id=conversation_id,
                history=formatted_history,
                user=user
            )

            return result
        except Exception as e:
            # Log the error
            print(f"Error in chat service: {str(e)}")
            raise


