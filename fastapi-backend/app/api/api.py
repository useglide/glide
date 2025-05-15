from fastapi import APIRouter

from app.api.endpoints import chat

api_router = APIRouter()

# Include chat endpoints
api_router.include_router(chat.router, tags=["chat"])
