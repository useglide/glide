"""
Agent module for the Glide application.

This module contains the implementation of a hierarchical multi-agent system
using the langgraph-supervisor-py library.
"""

from app.agents.base import BaseAgent, AgentResponse
from app.agents.supervisor import SupervisorAgent
from app.agents.canvas_data_agent import CanvasDataAgent

__all__ = ["BaseAgent", "AgentResponse", "SupervisorAgent", "CanvasDataAgent"]
