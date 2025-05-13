from fastapi import APIRouter
from app.api.endpoints import canvas, auth, course, assignment

# Create API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(canvas.router, prefix="/canvas", tags=["canvas"])
api_router.include_router(course.router, prefix="/course", tags=["course"])
api_router.include_router(assignment.router, prefix="/assignment", tags=["assignment"])
