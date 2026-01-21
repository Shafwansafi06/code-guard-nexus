"""
User Profile Schemas
Schemas for onboarding and profile management
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProfileSetup(BaseModel):
    """Profile setup during onboarding"""
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    subject: str = Field(..., min_length=2, max_length=100, description="Subject or course they teach")
    student_count: int = Field(..., ge=1, le=10000, description="Number of students in their class")
    expected_submissions: int = Field(..., ge=1, le=1000, description="Expected volume of assignment submissions per week")
    institution: Optional[str] = Field(None, max_length=200, description="Institution or organization name")


class ProfileUpdate(BaseModel):
    """Update profile information"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    subject: Optional[str] = Field(None, min_length=2, max_length=100)
    student_count: Optional[int] = Field(None, ge=1, le=10000)
    expected_submissions: Optional[int] = Field(None, ge=1, le=1000)
    institution: Optional[str] = Field(None, max_length=200)


class ProfileResponse(BaseModel):
    """Profile information response"""
    user_id: str
    email: str
    username: str
    full_name: Optional[str] = None
    subject: Optional[str] = None
    student_count: Optional[int] = None
    expected_submissions: Optional[int] = None
    institution: Optional[str] = None
    onboarding_completed: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True
