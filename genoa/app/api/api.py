from fastapi import APIRouter

from app.api.endpoints import courses, canvas, assignments, memory, lectures, academic, express_agent

api_router = APIRouter()

# Include all routers
api_router.include_router(courses.router, prefix="/courses")
api_router.include_router(canvas.router, prefix="/canvas")
api_router.include_router(assignments.router, prefix="/assignments")
api_router.include_router(memory.router, prefix="/memory")
api_router.include_router(lectures.router, prefix="/lectures")
api_router.include_router(academic.router, prefix="/academic")
api_router.include_router(express_agent.router, prefix="/express-agent")
