# Canvas LMS AI Agent

This FastAPI application integrates with Canvas LMS and provides an AI agent that can answer user questions by accessing their Canvas data on demand.

## Features

- **Canvas LMS Integration**: Access courses, assignments, syllabus, and more from Canvas LMS.
- **AI Agent**: Chat with an AI agent powered by Gemini LLM that can fetch Canvas data on demand to answer questions.
- **Data Privacy**: The AI agent does not store user Canvas data persistently. It fetches data only when needed for a specific query and discards it afterward.

## API Endpoints

### Canvas Data Endpoints

- **Courses**:
  - `GET /api/v1/courses/{course_id}/syllabus`: Get the syllabus for a course.
  - `GET /api/v1/courses/{course_id}/professor`: Get professor info for a course.
  - `GET /api/v1/courses/{course_id}`: Get detailed information for a course.

- **Canvas**:
  - `GET /api/v1/canvas/user`: Get current user information.
  - `GET /api/v1/canvas/courses`: Get all available courses.
  - `GET /api/v1/canvas/courses/current`: Get current courses.
  - `GET /api/v1/canvas/courses/{course_id}/assignments`: Get assignments for a specific course.
  - `GET /api/v1/canvas/two-stage-data`: Get current courses and their assignments in one call.

- **Assignments**:
  - `GET /api/v1/assignments/course/{course_id}`: Get all assignments for a specific course.
  - `GET /api/v1/assignments/{assignment_id}?course_id={course_id}`: Get detailed information for a specific assignment.
  - `GET /api/v1/assignments/upcoming/course/{course_id}?days={days}`: Get upcoming assignments for a specific course.

### AI Agent Endpoint

- **Agent**:
  - `POST /api/v1/agent/chat`: Chat with the AI agent. Send a JSON payload with `{"query": "your question here"}`.

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file based on the provided `.env.example` file
   - Required environment variables:
     - `CANVAS_BASE_URL`: The base URL of your Canvas LMS instance
     - `CANVAS_API_KEY`: Your Canvas API key
     - `GOOGLE_API_KEY`: Your Google API key for Gemini LLM

4. Run the application:

   There are multiple ways to run the application:

   **Option 1**: Use the run.py script (recommended)
   ```
   python run.py
   ```

   **Option 2**: Use uvicorn directly
   ```
   uvicorn app.main:app --reload
   ```

   **Option 3**: Run the main.py file directly
   ```
   python app/main.py
   ```

## Usage Examples

### Chatting with the AI Agent

Send a POST request to `/api/v1/agent/chat` with a JSON payload:

```json
{
  "query": "What assignments do I have due this week in my Math course?"
}
```

The AI agent will:
1. Identify that it needs to find the Math course ID
2. Use the appropriate tool to list all courses
3. Find the Math course ID
4. Use another tool to get upcoming assignments for that course
5. Format and return a natural language response

## Architecture

- **FastAPI**: Web framework for building the API
- **LangChain**: Framework for building the AI agent
- **Gemini LLM**: Large language model for natural language understanding and generation
- **Canvas LMS API**: External API for accessing Canvas data
