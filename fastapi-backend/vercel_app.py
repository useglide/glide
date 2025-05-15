from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import importlib.util
import sys

# Create FastAPI app
app = FastAPI(
    title="Glide AI Chat",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://glide-v3.vercel.app",
        "https://glide-v3-git-main.vercel.app",
        "https://glide-v3-*.vercel.app",
        "https://glide-53ye.vercel.app",
        "https://glide-jet.vercel.app",
        "https://glide-b8by.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "api_version": "v1",
        "service": "glide-ai-chat"
    }

# Lazy load the chat endpoint to reduce initial memory usage
@app.on_event("startup")
async def startup_event():
    # Import the chat router
    from app.api.endpoints import chat
    
    # Include the chat router
    app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
