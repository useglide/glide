"""
Agent workflow for the Glide application.

This module defines the workflow for the hierarchical multi-agent system.
"""

from typing import Dict, Any, List, Tuple, Optional, TypedDict, Annotated, Literal
import asyncio
import uuid
import random
from pydantic import BaseModel, Field

# We're implementing our own version of the supervisor pattern
# without external dependencies to avoid conflicts
LANGGRAPH_AVAILABLE = False

# Placeholder classes for type hints
class StateGraph:
    pass
class END:
    pass

from app.agents.base import BaseAgent, AgentResponse, AgentInput, AgentOutput
from app.agents.supervisor import SupervisorAgent
# Removed Canvas Agent import as it's being consolidated with Canvas Data Agent
from app.agents.canvas_data_agent import CanvasDataAgent
from app.agents.welcome_agent import WelcomeAgent
from app.agents.memory_agent import MemoryAgent
from app.agents.google_drive_agent import GoogleDriveAgent
from app.agents.llm_agent import LLMAgent


class WorkflowState(TypedDict):
    """State for the workflow graph."""
    message: str
    context: Dict[str, Any]
    response: Optional[AgentResponse]
    agent_name: Optional[str]
    history: List[Dict[str, str]]


class GlideAgentWorkflow:
    """
    Workflow for the hierarchical multi-agent system.

    This class defines the workflow for routing messages between agents
    in a hierarchical structure with a supervisor agent coordinating
    specialized sub-agents.
    """

    def __init__(self, system_prompt: str):
        """
        Initialize the workflow.

        Args:
            system_prompt: The system prompt to use for the LLM agent
        """
        self.system_prompt = system_prompt

        # Initialize agents
        self.memory_agent = MemoryAgent(system_prompt)
        self.welcome_agent = WelcomeAgent()
        self.canvas_data_agent = CanvasDataAgent()
        self.google_drive_agent = GoogleDriveAgent()
        self.llm_agent = LLMAgent(system_prompt)

        # For backward compatibility with code that might still reference canvas_agent
        self.canvas_agent = self.canvas_data_agent

        # Create list of all agents
        self.agents = [
            self.memory_agent,
            self.welcome_agent,
            self.canvas_data_agent,  # Canvas Data Agent now handles all Canvas functionality
            self.google_drive_agent,
            self.llm_agent
        ]

        # Initialize supervisor
        self.supervisor = SupervisorAgent(self.agents)

    def _create_workflow_graph(self) -> StateGraph:
        """
        Create the workflow graph using LangGraph.

        Returns:
            StateGraph for the agent workflow
        """
        # Create the graph
        graph = StateGraph(WorkflowState)

        # Define the nodes
        graph.add_node("supervisor", self._supervisor_node)
        graph.add_node("memory", self._memory_node)
        graph.add_node("welcome", self._welcome_node)
        # Removed Canvas Agent node as it's consolidated with Canvas Data Agent
        graph.add_node("canvas_data", self._canvas_data_node)
        graph.add_node("google_drive", self._google_drive_node)
        graph.add_node("llm", self._llm_node)

        # Define the edges
        # Start with the supervisor
        graph.set_entry_point("supervisor")

        # Supervisor routes to the appropriate agent
        graph.add_conditional_edges(
            "supervisor",
            self._route_to_agent,
            {
                "memory": "memory",
                "welcome": "welcome",
                # Removed Canvas Agent route as it's consolidated with Canvas Data Agent
                "canvas_data": "canvas_data",
                "google_drive": "google_drive",
                "llm": "llm",
                "end": END
            }
        )

        # All agents return to the supervisor for potential further routing
        graph.add_edge("memory", "supervisor")
        graph.add_edge("welcome", "supervisor")
        # Removed Canvas Agent edge as it's consolidated with Canvas Data Agent
        graph.add_edge("canvas_data", "supervisor")
        graph.add_edge("google_drive", "supervisor")
        graph.add_edge("llm", END)

        # Compile the graph
        return graph.compile()

    async def _supervisor_node(self, state: WorkflowState) -> WorkflowState:
        """
        Process a message through the supervisor agent.

        Args:
            state: The current workflow state

        Returns:
            Updated workflow state
        """
        # Get the message and context
        message = state["message"]
        context = state["context"]

        # Check if we already have a response
        if state.get("response") and state.get("response").get("handled", False):
            # We already have a handled response, so we're done
            return state

        # Process the message through the supervisor
        response = await self.supervisor.process(message, context)

        # Update the state
        state["response"] = response

        return state

    async def _memory_node(self, state: WorkflowState) -> WorkflowState:
        """
        Process a message through the memory agent.

        Args:
            state: The current workflow state

        Returns:
            Updated workflow state
        """
        # Get the message and context
        message = state["message"]
        context = state["context"]

        # Process the message through the memory agent
        response = await self.memory_agent.process(message, context)

        # Update the state
        state["response"] = response
        state["agent_name"] = "memory"

        return state

    async def _welcome_node(self, state: WorkflowState) -> WorkflowState:
        """
        Process a message through the welcome agent.

        Args:
            state: The current workflow state

        Returns:
            Updated workflow state
        """
        # Get the message and context
        message = state["message"]
        context = state["context"]

        # Process the message through the welcome agent
        response = await self.welcome_agent.process(message, context)

        # Update the state
        state["response"] = response
        state["agent_name"] = "welcome"

        return state

    # Canvas Agent node method removed as it's consolidated with Canvas Data Agent

    async def _canvas_data_node(self, state: WorkflowState) -> WorkflowState:
        """
        Process a message through the canvas data agent.

        Args:
            state: The current workflow state

        Returns:
            Updated workflow state
        """
        # Get the message and context
        message = state["message"]
        context = state["context"]

        # Process the message through the canvas data agent
        response = await self.canvas_data_agent.process(message, context)

        # Update the state
        state["response"] = response
        state["agent_name"] = "canvas_data"

        return state

    async def _google_drive_node(self, state: WorkflowState) -> WorkflowState:
        """
        Process a message through the Google Drive agent.

        Args:
            state: The current workflow state

        Returns:
            Updated workflow state
        """
        # Get the message and context
        message = state["message"]
        context = state["context"]

        # Process the message through the Google Drive agent
        response = await self.google_drive_agent.process(message, context)

        # Update the state
        state["response"] = response
        state["agent_name"] = "google_drive"

        return state

    async def _llm_node(self, state: WorkflowState) -> WorkflowState:
        """
        Process a message through the LLM agent.

        Args:
            state: The current workflow state

        Returns:
            Updated workflow state
        """
        # Get the message and context
        message = state["message"]
        context = state["context"]

        # Process the message through the LLM agent
        response = await self.llm_agent.process(message, context)

        # Update the state
        state["response"] = response
        state["agent_name"] = "llm"

        return state

    def _route_to_agent(self, state: WorkflowState) -> str:
        """
        Determine which agent to route to based on the supervisor's response.

        Args:
            state: The current workflow state

        Returns:
            The name of the agent to route to
        """
        # Check if we have a response
        if not state.get("response"):
            # No response yet, route to LLM as fallback
            return "llm"

        # Check if the response was handled
        if state["response"].get("handled", False):
            # Response was handled, we're done
            return "end"

        # Get the agent name from the response
        agent_name = state.get("agent_name")

        # If no agent name, use the supervisor's routing logic
        if not agent_name:
            # For simplicity, route to LLM as fallback
            return "llm"

        # Handle legacy "canvas" agent name by routing to canvas_data
        if agent_name == "canvas":
            return "canvas_data"

        # Route to the specified agent
        return agent_name

    async def process_message(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Process a message through the agent workflow.

        Args:
            message: The message to process
            conversation_id: Optional conversation ID
            history: Optional conversation history
            user: Optional user information

        Returns:
            Dict containing the response and conversation ID
        """
        try:
            # Get or create conversation history
            if conversation_id is None or history is None:
                try:
                    conversation_id, history = self.memory_agent.get_conversation(conversation_id)
                except Exception as mem_error:
                    print(f"Error getting conversation history: {str(mem_error)}")
                    # Create a new conversation if there's an error
                    conversation_id = str(uuid.uuid4())
                    history = [{"role": "system", "content": self.system_prompt}]

            # Create context
            context = {
                "conversation_id": conversation_id,
                "history": history,
                "user": user or {}
            }

            # Add the user message to history
            try:
                self.memory_agent.add_message(conversation_id, "user", message)
            except Exception as add_msg_error:
                print(f"Error adding user message to history: {str(add_msg_error)}")
                # Continue processing even if we can't add to history

            # Process the message using the supervisor
            print("Using supervisor for message processing")
            try:
                result = await self.supervisor.process(message, context)
                response = result["content"]
            except Exception as supervisor_error:
                print(f"Error in supervisor processing: {str(supervisor_error)}")
                # Use varied fallback response if supervisor fails
                fallback_responses = [
                    "I'm sorry, I encountered an error while processing your message. Please try again.",
                    "Something went wrong while processing your request. Could you try again?",
                    "I ran into a technical issue. Let's try that again, shall we?",
                    "I couldn't complete that task due to an error. Please try once more.",
                    "An unexpected problem occurred. Could we try that again?"
                ]
                response = random.choice(fallback_responses)

            # Add the assistant response to history
            try:
                self.memory_agent.add_message(conversation_id, "assistant", response)
            except Exception as add_resp_error:
                print(f"Error adding assistant response to history: {str(add_resp_error)}")
                # Continue even if we can't add to history

            # Return the result
            return {
                "response": response,
                "conversation_id": conversation_id
            }
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")

            # Return a varied fallback response in case of error
            if not conversation_id:
                conversation_id = str(uuid.uuid4())

            fallback_responses = [
                "I'm sorry, I encountered an error while processing your message. Please try again.",
                "Something went wrong while processing your request. Could you try again?",
                "I ran into a technical issue. Let's try that again, shall we?",
                "I couldn't complete that task due to an error. Please try once more.",
                "An unexpected problem occurred. Could we try that again?"
            ]

            return {
                "response": random.choice(fallback_responses),
                "conversation_id": conversation_id
            }
