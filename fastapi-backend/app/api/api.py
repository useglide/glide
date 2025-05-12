from fastapi import APIRouter
from app.api.endpoints import canvas, auth

# Create API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(canvas.router, prefix="/canvas", tags=["canvas"])
