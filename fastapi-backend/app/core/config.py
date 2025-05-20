from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings
import json
import os


class Settings(BaseSettings):
    """Application settings."""

    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Glide AI Chat API"
    DEBUG: bool = False

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Express.js backend URL
    EXPRESS_BACKEND_URL: str = "http://localhost:3001"

    # Firebase settings
    FIREBASE_PROJECT_ID: str = "glide-c7ef6"
    FIREBASE_AUTH_DISABLED: bool = False
    FIREBASE_SERVICE_ACCOUNT_KEY: Optional[Dict[str, Any]] = None

    # Gemini API settings
    GEMINI_API_KEY: Optional[str] = None

    # Google OAuth settings
    GOOGLE_REDIRECT_URI: Optional[str] = None
    GOOGLE_CREDENTIALS_JSON: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **data: Any):
        super().__init__(**data)

        # Parse Firebase service account key from environment variable if available
        firebase_key_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
        if firebase_key_env:
            try:
                self.FIREBASE_SERVICE_ACCOUNT_KEY = json.loads(firebase_key_env)
            except json.JSONDecodeError:
                print("Warning: Could not parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON")


# Create global settings object
settings = Settings()
