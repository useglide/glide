"""
Agent service for Canvas data retrieval using LangChain and Gemini.
"""
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor
from app.services.agent_tools import CanvasAgentTools
from app.core.config import settings

class CanvasAgentService:
    """Service for Canvas data agent using LangChain and Gemini."""

    def __init__(self):
        """Initialize the agent service."""
        # Check if GOOGLE_API_KEY is set
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set in environment variables")

    async def create_agent(self, credentials: Dict[str, str]) -> AgentExecutor:
        """
        Create a LangChain agent with Gemini as the LLM.

        Args:
            credentials: Dict with canvasUrl and canvasApiKey

        Returns:
            AgentExecutor instance
        """
        # Initialize tools with user credentials
        tools_instance = CanvasAgentTools(credentials)

        # Get all tool methods
        tools = [
            tools_instance.get_user_info,
            tools_instance.get_all_courses,
            tools_instance.get_current_courses,
            tools_instance.get_course_details,
            tools_instance.get_course_syllabus,
            tools_instance.get_course_assignments,
            tools_instance.get_assignment_details,
            tools_instance.get_upcoming_assignments
        ]

        # Initialize Gemini model with appropriate settings for structured tools
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            temperature=0.2,
            convert_system_message_to_human=True,  # This is needed for Gemini
            google_api_key=settings.GOOGLE_API_KEY,
            max_output_tokens=2048,  # Ensure we have enough tokens for responses
            system_prompt="""
            You are a helpful Canvas LMS assistant that can access a user's Canvas data to answer questions.

            You have access to various tools that can retrieve information from Canvas, such as courses, assignments, and user details.

            Important guidelines:
            1. You must NOT store any user data persistently. Only fetch data when needed for a specific query.
            2. Always use the most appropriate tool for the task.
            3. If you need to get information about multiple courses or assignments, make multiple tool calls.
            4. Be concise and helpful in your responses.
            5. If you don't have enough information to answer a question, ask for clarification.
            6. If a user asks about a specific course or assignment but doesn't provide an ID, ask them to specify which one they're referring to.
            7. When presenting dates, format them in a human-readable way.

            Remember: You are accessing real-time Canvas data. The information you provide should be accurate and up-to-date.
            """
        )

        # Create the agent using a simpler approach with initialize_agent
        from langchain.agents import initialize_agent, AgentType

        # Create and return the agent executor directly
        return initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            handle_parsing_errors=True
        )

    async def process_query(self, query: str, credentials: Dict[str, str]) -> Dict[str, Any]:
        """
        Process a user query using the agent.

        Args:
            query: User's natural language query
            credentials: Dict with canvasUrl and canvasApiKey

        Returns:
            Dict with the agent's response
        """
        try:
            # Create agent
            agent_executor = await self.create_agent(credentials)

            # Run agent with a simpler approach
            result = await agent_executor.arun(
                query,
                callbacks=None  # No callbacks to avoid errors
            )

            return {
                "response": result,  # arun returns a string directly
                "success": True
            }
        except TimeoutError:
            return {
                "response": "I'm sorry, but your request took too long to process. Please try a simpler query or try again later.",
                "success": False,
                "error": "Request timed out"
            }
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Agent error: {error_trace}")

            # Provide a more user-friendly error message
            if "429" in str(e) or "quota" in str(e).lower():
                return {
                    "response": "I'm sorry, but I've reached my usage limit. Please try again later.",
                    "success": False,
                    "error": "API quota exceeded"
                }
            elif "authentication" in str(e).lower() or "credential" in str(e).lower():
                return {
                    "response": "I'm having trouble accessing your Canvas data. Please check your Canvas credentials.",
                    "success": False,
                    "error": "Authentication error"
                }
            else:
                return {
                    "response": "I encountered an error while processing your request. Please try again with a different question.",
                    "success": False,
                    "error": str(e)
                }

# Create service instance
canvas_agent_service = CanvasAgentService()
