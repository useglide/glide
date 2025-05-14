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

    # Firebase settings
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Optional[str] = None
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: Optional[str] = None
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: Optional[str] = None
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Optional[str] = None
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: Optional[str] = None
    NEXT_PUBLIC_FIREBASE_APP_ID: Optional[str] = None
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in the environment

# Create a global settings object
settings = Settings()
