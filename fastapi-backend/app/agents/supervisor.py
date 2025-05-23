"""
Supervisor agent for the Glide application.

This agent coordinates and delegates tasks to specialized sub-agents.
"""

from typing import Dict, Any, List, Optional, Tuple
import asyncio
import random

from app.agents.base import BaseAgent, AgentResponse


class SupervisorAgent:
    """
    Supervisor agent that coordinates and delegates tasks to specialized sub-agents.

    The supervisor agent is responsible for:
    1. Routing messages to the appropriate sub-agent
    2. Handling fallbacks when no sub-agent can process a message
    3. Coordinating complex tasks that require multiple sub-agents
    """

    def __init__(self, agents: List[BaseAgent]):
        """
        Initialize the supervisor agent with a list of sub-agents.

        Args:
            agents: List of sub-agents to coordinate
        """
        self.agents = agents
        self.name = "supervisor"

        # Varied responses for when no agent can handle a request
        self.unknown_request_responses = [
            "I'm sorry, I don't know how to handle that request.",
            "I'm not sure how to help with that specific request.",
            "That's not something I'm currently set up to handle.",
            "I don't have the capability to process that request at the moment.",
            "I'm afraid I can't assist with that particular query right now."
        ]

        # Varied responses for error handling
        self.error_responses = [
            "I'm sorry, I encountered an error while processing your message. Please try again.",
            "Something went wrong while I was working on your request. Could you try again?",
            "I ran into a technical issue while processing that. Let's try again.",
            "I couldn't complete that task due to an error. Please try once more.",
            "An unexpected problem occurred. Could we try that again?"
        ]

    async def _get_capable_agents(self, message: str, context: Dict[str, Any]) -> List[BaseAgent]:
        """
        Get a list of agents that can handle the given message.

        Args:
            message: The message to check
            context: Additional context for checking

        Returns:
            List of agents that can handle the message
        """
        capable_agents = []
        for agent in self.agents:
            if agent.can_handle(message, context):
                capable_agents.append(agent)
        return capable_agents

    async def process(self, message: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Process a message by delegating to the appropriate sub-agent.

        Args:
            message: The message to process
            context: Additional context for processing

        Returns:
            AgentResponse containing the response from the sub-agent
        """
        try:
            if context is None:
                context = {}

            # Get agents that can handle this message
            capable_agents = await self._get_capable_agents(message, context)

            # If no agents can handle this message, use a fallback
            if not capable_agents:
                # Try to find a general-purpose agent (like LLM agent)
                for agent in self.agents:
                    if agent.name.lower() == "llm":
                        return await agent.process(message, context)

                # If no LLM agent, return a varied default response
                return {
                    "content": random.choice(self.unknown_request_responses),
                    "metadata": {},
                    "handled": False
                }

            # If only one agent can handle this message, use it
            if len(capable_agents) == 1:
                try:
                    return await capable_agents[0].process(message, context)
                except Exception as e:
                    print(f"Error in agent {capable_agents[0].name}: {str(e)}")
                    # If the agent fails, try the LLM agent as fallback
                    for agent in self.agents:
                        if agent.name.lower() == "llm":
                            return await agent.process(message, context)

            # If multiple agents can handle this message, try them in sequence
            # until one successfully handles it
            for agent in capable_agents:
                try:
                    response = await agent.process(message, context)
                    if response["handled"]:
                        return response
                except Exception as e:
                    print(f"Error in agent {agent.name}: {str(e)}")
                    # Continue to the next agent

            # If no agent successfully handled the message, use a fallback
            for agent in self.agents:
                if agent.name.lower() == "llm":
                    try:
                        return await agent.process(message, context)
                    except Exception as e:
                        print(f"Error in LLM agent: {str(e)}")
                        break

            # If all else fails, return a varied error response
            return {
                "content": random.choice(self.error_responses),
                "metadata": {},
                "handled": False
            }
        except Exception as e:
            print(f"Error in supervisor agent: {str(e)}")
            return {
                "content": random.choice(self.error_responses),
                "metadata": {},
                "handled": False
            }
