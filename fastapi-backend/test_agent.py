"""
Test script for the Canvas agent.
Run this script to test if the agent is working correctly.
"""
import asyncio
import os
import traceback
from dotenv import load_dotenv
from app.services.agent_service import canvas_agent_service

# Load environment variables
load_dotenv()

async def test_agent():
    """Test the Canvas agent with a simple query."""
    # Sample credentials (replace with test credentials if needed)
    credentials = {
        "canvasUrl": "https://canvas.instructure.com",
        "canvasApiKey": "test_api_key"
    }

    # Simple test query
    query = "Hello, can you help me with my Canvas courses?"

    print(f"Testing agent with query: {query}")
    print("Using Google API Key:", os.getenv("GOOGLE_API_KEY", "Not found"))
    print("LangChain Environment:", os.getenv("LANGCHAIN_TRACING_V2", "Not enabled"))

    try:
        # First test creating the agent directly
        print("\nTesting agent creation...")
        try:
            agent_executor = await canvas_agent_service.create_agent(credentials)
            print("✅ Agent created successfully!")
        except Exception as agent_error:
            print("❌ Agent creation failed!")
            print(f"Error: {agent_error}")
            print("\nTraceback:")
            traceback.print_exc()
            return

        # Now test the full query processing
        print("\nTesting query processing...")
        result = await canvas_agent_service.process_query(query, credentials)

        # Print result
        print("\nAgent Response:")
        print(f"Success: {result['success']}")
        print(f"Response: {result['response']}")
        if not result['success']:
            print(f"Error: {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"Error testing agent: {e}")
        print("\nTraceback:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
