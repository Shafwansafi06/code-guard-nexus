from pydantic import BaseModel, EmailStr, UUID4, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


# Authentication Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = "instructor"
    organization_id: Optional[UUID4] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


# Organization Schemas
class OrganizationCreate(BaseModel):
    name: str
    subscription_tier: Optional[str] = "free"
    features: Optional[Dict[str, Any]] = Field(default_factory=dict)


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    subscription_tier: Optional[str] = None
    features: Optional[Dict[str, Any]] = None


class OrganizationResponse(BaseModel):
    id: str
    name: str
    subscription_tier: Optional[str]
    features: Dict[str, Any]


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = "instructor"
    organization_id: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    organization_id: Optional[str]
    is_active: bool
    created_at: str


# Course Schemas
class CourseCreate(BaseModel):
    name: str
    code: str
    semester: str
    instructor_id: Optional[str] = None


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    semester: Optional[str] = None


class CourseResponse(BaseModel):
    id: str
    name: str
    code: str
    semester: str
    instructor_id: Optional[str]


class CourseWithStats(CourseResponse):
    assignment_count: int = 0
    student_count: int = 0


# Assignment Schemas
class AssignmentCreate(BaseModel):
    name: str
    course_id: str
    due_date: Optional[datetime] = None
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict)
    status: str = "draft"


class AssignmentUpdate(BaseModel):
    name: Optional[str] = None
    due_date: Optional[datetime] = None
    settings: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: str
    name: str
    course_id: str
    due_date: Optional[str]
    settings: Dict[str, Any]
    status: str


class AssignmentWithStats(AssignmentResponse):
    submission_count: int = 0
    pending_analyses: int = 0
    average_similarity: Optional[float] = None


# Submission Schemas
class SubmissionCreate(BaseModel):
    assignment_id: str
    student_identifier: str
    file_count: int = 0
    status: str = "pending"


class SubmissionUpdate(BaseModel):
    status: Optional[str] = None
    file_count: Optional[int] = None


class SubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    student_identifier: str
    file_count: int
    status: str
    submission_time: str


class SubmissionWithFiles(SubmissionResponse):
    files: List[Dict[str, Any]] = []


# File Schemas
class FileCreate(BaseModel):
    submission_id: str
    filename: str
    language: Optional[str] = None
    file_hash: str


class FileResponse(BaseModel):
    id: str
    submission_id: str
    filename: str
    language: Optional[str]
    file_hash: str


# Analysis Result Schemas
class AnalysisResultCreate(BaseModel):
    submission_id: str
    overall_similarity: Optional[float] = None
    ai_detection_score: Optional[float] = None
    risk_level: Optional[str] = None
    detailed_results: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AnalysisResultUpdate(BaseModel):
    overall_similarity: Optional[float] = None
    ai_detection_score: Optional[float] = None
    risk_level: Optional[str] = None
    detailed_results: Optional[Dict[str, Any]] = None


class AnalysisResultResponse(BaseModel):
    id: str
    submission_id: str
    overall_similarity: Optional[float]
    ai_detection_score: Optional[float]
    risk_level: Optional[str]
    detailed_results: Dict[str, Any]


# Comparison Pair Schemas
class ComparisonPairCreate(BaseModel):
    assignment_id: str
    submission_a_id: str
    submission_b_id: str
    similarity_score: Optional[float] = None
    status: str = "pending"


class ComparisonPairUpdate(BaseModel):
    similarity_score: Optional[float] = None
    status: Optional[str] = None


class ComparisonPairResponse(BaseModel):
    id: str
    assignment_id: str
    submission_a_id: str
    submission_b_id: str
    similarity_score: Optional[float]
    status: Optional[str]


class ComparisonPairDetailed(ComparisonPairResponse):
    submission_a: Optional[SubmissionResponse] = None
    submission_b: Optional[SubmissionResponse] = None


# Bulk Upload Schema
class BulkUploadResponse(BaseModel):
    submission_id: str
    files_uploaded: int
    files: List[FileResponse]


# Dashboard Stats Schema
class DashboardStats(BaseModel):
    total_assignments: int
    total_submissions: int
    pending_reviews: int
    high_risk_cases: int
    recent_activity: List[Dict[str, Any]]
