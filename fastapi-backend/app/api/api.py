from fastapi import APIRouter

from app.api.endpoints import chat, memory, canvas

api_router = APIRouter()

# Include chat endpoints
api_router.include_router(chat.router, tags=["chat"])

# Include memory endpoints
api_router.include_router(memory.router, prefix="/memory", tags=["memory"])

# Include Canvas endpoints
api_router.include_router(canvas.router, prefix="/canvas", tags=["canvas"])
