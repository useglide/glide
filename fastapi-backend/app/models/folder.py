from pydantic import BaseModel, Field
from typing import List, Optional


class CreateClassFoldersRequest(BaseModel):
    """Request model for creating class folders."""
    user_id: str = Field(..., description="Firebase user ID")
    class_names: List[str] = Field(..., description="List of class names to create folders for")
    parent_folder_id: Optional[str] = Field(None, description="Optional parent folder ID")


class CreateClassFoldersResponse(BaseModel):
    """Response model for creating class folders."""
    success: bool = Field(..., description="Whether the operation was successful")
    folder_count: int = Field(..., description="Number of folders created")
    message: str = Field(..., description="Status message")
    semester_name: Optional[str] = Field(None, description="Name of the semester folder created")
