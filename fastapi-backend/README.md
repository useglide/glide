# Glide AI Chat Backend

This is the FastAPI backend for the Glide AI Chat feature. It uses Google's Gemini AI model to provide intelligent responses to user queries about the Glide application.

## Features

- FastAPI-based REST API
- Google Gemini AI integration
- Conversation memory
- Vercel deployment ready

## Getting Started

### Prerequisites

- Python 3.9+
- Gemini API key
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
# Create a .env file with the following variables
EXPRESS_BACKEND_URL=http://localhost:3001
HOST=0.0.0.0
PORT=8000
DEBUG=True
FIREBASE_PROJECT_ID=glide-c7ef6
FIREBASE_DATABASE_URL=https://glide-c7ef6-default-rtdb.firebaseio.com  # Your Firebase Realtime Database URL
FIREBASE_AUTH_DISABLED=True  # Set to False in production
GEMINI_API_KEY=your-gemini-api-key
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # Your Firebase service account JSON
GOOGLE_CREDENTIALS_JSON={"installed":{"client_id":"...","client_secret":"...",...}}  # Your Google OAuth credentials
GOOGLE_REDIRECT_URI=http://localhost:3000/google-auth-callback  # Your OAuth redirect URI
```

### Running the Application

```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000.

## API Endpoints

- `GET /api/v1/health` - Health check endpoint
- `POST /api/v1/chat` - Chat endpoint
- `GET /api/v1/memory/{conversation_id}` - Get conversation history
- `POST /api/v1/memory/{conversation_id}/clear` - Clear conversation history

## Deployment to Vercel

This application is configured for deployment on Vercel. Follow these steps to deploy:

1. Install the Vercel CLI:

```bash
npm install -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy the application:

```bash
vercel
```

4. Set up environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" section
   - Add the following variables:
     - `EXPRESS_BACKEND_URL`: URL of your Express.js backend (e.g., https://glide-jet.vercel.app)
     - `HOST`: 0.0.0.0
     - `PORT`: 8000
     - `DEBUG`: False
     - `FIREBASE_PROJECT_ID`: glide-c7ef6
     - `FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL (e.g., https://glide-c7ef6-default-rtdb.firebaseio.com)
     - `FIREBASE_AUTH_DISABLED`: True
     - `GEMINI_API_KEY`: Your Gemini API key
     - `GOOGLE_CREDENTIALS_JSON`: Your Google OAuth credentials JSON
     - `GOOGLE_REDIRECT_URI`: Your OAuth redirect URI
     - `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON

5. Configure the frontend to use your deployed FastAPI backend:
   - Update the `NEXT_PUBLIC_GENOA_API_URL` environment variable in your frontend project to point to your deployed FastAPI backend URL.

## API Usage

### Chat Endpoint

**Endpoint**: `POST /api/v1/chat`

**Request Body**:
```json
{
  "message": "Hello, how can you help me with Glide?",
  "conversation_id": "optional-conversation-id"
}
```

**Response**:
```json
{
  "response": "Hello! I'm Glide Assistant. I can help you with information about your courses, assignments, and grades in Canvas. How can I assist you today?",
  "conversation_id": "conversation-id"
}
```

The `conversation_id` is used to maintain context between messages. If not provided, a new conversation will be created.

### Memory Endpoints

#### Get Conversation History

**Endpoint**: `GET /api/v1/memory/{conversation_id}`

**Response**:
```json
{
  "conversation_id": "conversation-id",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how can you help me with Glide?"
    },
    {
      "role": "assistant",
      "content": "Hello! I'm Glide Assistant. I can help you with information about your courses, assignments, and grades in Canvas. How can I assist you today?"
    }
  ]
}
```

#### Clear Conversation History

**Endpoint**: `POST /api/v1/memory/{conversation_id}/clear`

**Response**:
```json
{
  "conversation_id": "conversation-id",
  "success": true
}
```
