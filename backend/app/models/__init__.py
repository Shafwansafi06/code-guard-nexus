from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class AssignmentStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"


class SubmissionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComparisonStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


# Base Models
class OrganizationBase(BaseModel):
    name: str
    subscription_tier: Optional[SubscriptionTier] = SubscriptionTier.FREE
    features: Optional[Dict[str, Any]] = {}


class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: UserRole
    organization_id: Optional[UUID4] = None


class CourseBase(BaseModel):
    name: str
    code: str
    semester: str
    instructor_id: Optional[UUID4] = None


class AssignmentBase(BaseModel):
    name: str
    course_id: UUID4
    due_date: Optional[datetime] = None
    settings: Optional[Dict[str, Any]] = {}
    status: AssignmentStatus = AssignmentStatus.DRAFT


class SubmissionBase(BaseModel):
    assignment_id: UUID4
    student_identifier: str
    file_count: int = 0
    status: SubmissionStatus = SubmissionStatus.PENDING


class FileBase(BaseModel):
    submission_id: UUID4
    filename: str
    language: Optional[str] = None
    file_hash: str


class AnalysisResultBase(BaseModel):
    submission_id: UUID4
    overall_similarity: Optional[float] = None
    ai_detection_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    detailed_results: Optional[Dict[str, Any]] = {}


class ComparisonPairBase(BaseModel):
    assignment_id: UUID4
    submission_a_id: UUID4
    submission_b_id: UUID4
    similarity_score: Optional[float] = None
    status: Optional[ComparisonStatus] = ComparisonStatus.PENDING


# Response Models (with ID and timestamps)
class Organization(OrganizationBase):
    id: UUID4

    class Config:
        from_attributes = True


class User(UserBase):
    id: UUID4
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Course(CourseBase):
    id: UUID4

    class Config:
        from_attributes = True


class Assignment(AssignmentBase):
    id: UUID4

    class Config:
        from_attributes = True


class Submission(SubmissionBase):
    id: UUID4
    submission_time: datetime

    class Config:
        from_attributes = True


class File(FileBase):
    id: UUID4

    class Config:
        from_attributes = True


class AnalysisResult(AnalysisResultBase):
    id: UUID4

    class Config:
        from_attributes = True


class ComparisonPair(ComparisonPairBase):
    id: UUID4

    class Config:
        from_attributes = True
