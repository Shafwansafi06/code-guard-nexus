"""
Google Classroom API Schemas
Pydantic models for Google Classroom integration
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class GoogleOAuthTokenCreate(BaseModel):
    """Schema for creating/storing OAuth tokens"""
    user_id: str
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: datetime
    token_type: str = "Bearer"
    scope: str


class GoogleOAuthTokenResponse(BaseModel):
    """Schema for OAuth token response"""
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: int
    token_type: str
    scope: str


class GoogleClassroomCourse(BaseModel):
    """Schema for Google Classroom Course"""
    id: str
    name: str
    section: Optional[str] = None
    description: Optional[str] = None
    descriptionHeading: Optional[str] = None
    room: Optional[str] = None
    ownerId: str
    creationTime: Optional[str] = None
    updateTime: Optional[str] = None
    enrollmentCode: Optional[str] = None
    courseState: str
    alternateLink: str
    teacherGroupEmail: Optional[str] = None
    courseGroupEmail: Optional[str] = None


class GoogleClassroomCourseWork(BaseModel):
    """Schema for Google Classroom Assignment (CourseWork)"""
    id: str
    courseId: str
    title: str
    description: Optional[str] = None
    materials: Optional[List[Dict[str, Any]]] = []
    state: str
    alternateLink: str
    creationTime: str
    updateTime: str
    dueDate: Optional[Dict[str, int]] = None
    dueTime: Optional[Dict[str, int]] = None
    maxPoints: Optional[float] = None
    workType: str
    assigneeMode: Optional[str] = None


class GoogleClassroomStudentSubmission(BaseModel):
    """Schema for Google Classroom Student Submission"""
    id: str
    courseId: str
    courseWorkId: str
    userId: str
    creationTime: str
    updateTime: str
    state: str
    late: Optional[bool] = False
    draftGrade: Optional[float] = None
    assignedGrade: Optional[float] = None
    alternateLink: str
    courseWorkType: str
    associatedWithDeveloper: Optional[bool] = False


class ImportCourseRequest(BaseModel):
    """Request to import a Google Classroom course"""
    google_classroom_id: str
    sync_enabled: bool = False


class ImportCourseResponse(BaseModel):
    """Response after importing a course"""
    success: bool
    course_id: str
    message: str
    google_classroom_id: str


class ImportAssignmentRequest(BaseModel):
    """Request to import a Google Classroom assignment"""
    course_id: str
    google_coursework_id: str


class ImportAssignmentResponse(BaseModel):
    """Response after importing an assignment"""
    success: bool
    assignment_id: str
    message: str
    google_coursework_id: str


class SyncStatusResponse(BaseModel):
    """Response for sync status"""
    last_synced_at: Optional[datetime] = None
    sync_enabled: bool
    courses_synced: int
    assignments_synced: int
    message: str


class GoogleClassroomAuthURL(BaseModel):
    """Authorization URL for OAuth flow"""
    auth_url: str
    state: str
