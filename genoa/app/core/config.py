import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Canvas LMS settings
    CANVAS_BASE_URL: str = os.getenv("CANVAS_BASE_URL", "https://canvas.instructure.com")
    CANVAS_API_KEY: Optional[str] = os.getenv("CANVAS_API_KEY")

    # Gemini LLM settings
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY"))

    # Express.js backend settings
    EXPRESS_BACKEND_URL: str = os.getenv("EXPRESS_BACKEND_URL", "https://glide-jet.vercel.app/api")

    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Canvas LMS API"

    class Config:
        env_file = ".env"
        case_sensitive = True

# Create a global settings object
settings = Settings()
