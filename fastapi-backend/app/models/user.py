from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    """Base user model"""
    email: Optional[EmailStr] = None
    
class UserCreate(UserBase):
    """User creation model"""
    email: EmailStr
    password: str
    canvasUrl: str
    canvasApiKey: str
    
class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str
    
class UserInDB(UserBase):
    """User in database model"""
    uid: str
    
class User(UserBase):
    """User model"""
    uid: str
    
    class Config:
        orm_mode = True
        
class Token(BaseModel):
    """Token model"""
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    """Token data model"""
    uid: Optional[str] = None
    email: Optional[EmailStr] = None
