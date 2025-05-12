import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"

    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://glide-v3.vercel.app",
        "https://glide-v3-git-main.vercel.app",
        "https://glide-v3-*.vercel.app",
        "https://glide-53ye.vercel.app",
        "https://glide-jet.vercel.app",
        "https://glide-b8by.vercel.app"
    ]

    # Firebase settings
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_DATABASE_URL: str = os.getenv("FIREBASE_DATABASE_URL", "")
    FIREBASE_SERVICE_ACCOUNT: str = os.getenv("FIREBASE_SERVICE_ACCOUNT", "")

    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Server settings
    PORT: int = int(os.getenv("PORT", "8000"))

    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    model_config = {
        "case_sensitive": True
    }

# Create settings instance
settings = Settings()
