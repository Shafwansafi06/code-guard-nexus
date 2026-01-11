# CodeGuard Nexus - FastAPI Backend Specification

## Overview
This document provides comprehensive API specifications for the CodeGuard Nexus plagiarism detection system backend. The backend is designed using FastAPI with a microservices-oriented architecture to handle code similarity analysis, AI-generated code detection, and collaboration network analysis.

## Technology Stack

### Core Framework
- **FastAPI** (v0.104+): Main web framework
- **Python** (v3.11+): Programming language
- **Pydantic** (v2.0+): Data validation and serialization
- **SQLAlchemy** (v2.0+): ORM for database operations
- **Alembic**: Database migrations

### Databases
- **PostgreSQL** (v15+): Primary relational database
- **Redis** (v7+): Caching and session management
- **MongoDB** (v6+): Document storage for analysis results
- **Neo4j** (v5+): Graph database for collaboration networks

### Analysis Engines
- **NLTK**: Natural language processing
- **spaCy**: Advanced NLP operations
- **scikit-learn**: ML algorithms for similarity detection
- **transformers**: Hugging Face models for AI detection
- **CodeBERT**: Pre-trained model for code understanding
- **tree-sitter**: Abstract syntax tree parsing
- **radon**: Code complexity metrics

### Task Queue
- **Celery**: Distributed task queue
- **RabbitMQ**: Message broker

### Monitoring & Logging
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **ELK Stack**: Centralized logging
- **Sentry**: Error tracking

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (Kong)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼──────┐
│  Auth Service  │   │  Core API       │   │  WebSocket  │
│  (JWT/OAuth2)  │   │  (FastAPI)      │   │  Service    │
└────────────────┘   └─────────────────┘   └─────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼──────┐
│  Analysis      │   │  Detection      │   │  Network    │
│  Engine        │   │  Service        │   │  Analysis   │
└────────────────┘   └─────────────────┘   └─────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Task Queue       │
                    │  (Celery/RabbitMQ)│
                    └───────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼──────┐
│  PostgreSQL    │   │  MongoDB        │   │  Neo4j      │
│  (Users/Orgs)  │   │  (Analysis)     │   │  (Graph)    │
└────────────────┘   └─────────────────┘   └─────────────┘
```

---

## Database Schema

### PostgreSQL Schema

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'instructor', -- instructor, admin, ta
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
    max_users INTEGER DEFAULT 5,
    features JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    instructor_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    semester VARCHAR(50),
    academic_year VARCHAR(10),
    description TEXT,
    student_count INTEGER DEFAULT 0,
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    description TEXT,
    due_date TIMESTAMP,
    max_file_size INTEGER DEFAULT 5242880, -- 5MB in bytes
    allowed_languages TEXT[],
    settings JSONB, -- sensitivity, ai_detection_enabled, etc.
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed, archived
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Submissions Table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_identifier VARCHAR(255) NOT NULL, -- email or student ID
    student_name VARCHAR(255),
    file_count INTEGER DEFAULT 0,
    total_size INTEGER,
    status VARCHAR(50) DEFAULT 'pending', -- pending, analyzing, completed, failed
    submission_time TIMESTAMP DEFAULT NOW(),
    analysis_started_at TIMESTAMP,
    analysis_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Files Table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    language VARCHAR(50),
    line_count INTEGER,
    file_hash VARCHAR(64), -- SHA256 hash
    content_preview TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis Results Table
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id),
    submission_id UUID REFERENCES submissions(id),
    file_id UUID REFERENCES files(id),
    overall_similarity_score NUMERIC(5,2),
    lexical_similarity NUMERIC(5,2),
    syntactic_similarity NUMERIC(5,2),
    semantic_similarity NUMERIC(5,2),
    ai_detection_score NUMERIC(5,2),
    ai_confidence NUMERIC(5,2),
    risk_level VARCHAR(50), -- low, medium, high, critical
    matched_files JSONB, -- Array of matched file references
    detailed_results JSONB, -- Stored in MongoDB
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comparison Pairs Table
CREATE TABLE comparison_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id),
    submission_a_id UUID REFERENCES submissions(id),
    submission_b_id UUID REFERENCES submissions(id),
    file_a_id UUID REFERENCES files(id),
    file_b_id UUID REFERENCES files(id),
    similarity_score NUMERIC(5,2),
    match_type VARCHAR(50), -- exact, high_similarity, structural
    status VARCHAR(50) DEFAULT 'detected', -- detected, reviewed, confirmed, dismissed
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id),
    report_type VARCHAR(50), -- full, summary, csv, pdf
    generated_by UUID REFERENCES users(id),
    file_path TEXT,
    file_size INTEGER,
    parameters JSONB,
    status VARCHAR(50) DEFAULT 'generating', -- generating, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_files_submission ON files(submission_id);
CREATE INDEX idx_analysis_assignment ON analysis_results(assignment_id);
CREATE INDEX idx_comparison_assignment ON comparison_pairs(assignment_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

---

## API Endpoints

### Base URL
```
https://api.codeguard-nexus.com/v1
```

### Authentication Endpoints

#### POST /auth/register
Register a new user account

**Request Body:**
```json
{
  "email": "professor@university.edu",
  "username": "john_doe",
  "password": "SecurePass123!",
  "full_name": "Dr. John Doe",
  "organization_code": "UNI-CS-001"
}
```

**Response: 201 Created**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "professor@university.edu",
  "username": "john_doe",
  "full_name": "Dr. John Doe",
  "role": "instructor",
  "created_at": "2024-01-11T10:30:00Z"
}
```

#### POST /auth/login
Authenticate user and get access token

**Request Body:**
```json
{
  "email": "professor@university.edu",
  "password": "SecurePass123!"
}
```

**Response: 200 OK**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "professor@university.edu",
    "username": "john_doe",
    "role": "instructor"
  }
}
```

#### POST /auth/refresh
Refresh access token

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response: 200 OK**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### POST /auth/logout
Logout and invalidate tokens

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response: 200 OK**
```json
{
  "message": "Successfully logged out"
}
```

---

### Course Management Endpoints

#### GET /courses
Get all courses for the authenticated user

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (int, default: 1)
- `page_size` (int, default: 20)
- `search` (string, optional)
- `semester` (string, optional)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "c1234567-e89b-12d3-a456-426614174000",
      "name": "CS101: Data Structures and Algorithms",
      "code": "CS101",
      "semester": "Fall 2024",
      "student_count": 45,
      "assignment_count": 5,
      "plagiarism_cases": 12,
      "ai_generated_count": 8,
      "created_at": "2024-01-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 4,
    "total_pages": 1
  }
}
```

#### POST /courses
Create a new course

**Request Body:**
```json
{
  "name": "CS101: Data Structures and Algorithms",
  "code": "CS101",
  "semester": "Fall 2024",
  "academic_year": "2024",
  "description": "Introduction to fundamental data structures",
  "settings": {
    "allow_late_submissions": false,
    "default_sensitivity": 85
  }
}
```

**Response: 201 Created**
```json
{
  "id": "c1234567-e89b-12d3-a456-426614174000",
  "name": "CS101: Data Structures and Algorithms",
  "code": "CS101",
  "semester": "Fall 2024",
  "student_count": 0,
  "created_at": "2024-01-11T10:30:00Z"
}
```

#### GET /courses/{course_id}
Get detailed course information

**Response: 200 OK**
```json
{
  "id": "c1234567-e89b-12d3-a456-426614174000",
  "name": "CS101: Data Structures and Algorithms",
  "code": "CS101",
  "semester": "Fall 2024",
  "description": "Introduction to fundamental data structures",
  "student_count": 45,
  "assignments": [
    {
      "id": "a1234567-e89b-12d3-a456-426614174000",
      "name": "Assignment 3: Binary Search Tree",
      "due_date": "2024-10-15T23:59:59Z",
      "submission_count": 45,
      "status": "completed"
    }
  ],
  "statistics": {
    "total_submissions": 180,
    "plagiarism_cases": 12,
    "ai_generated": 8,
    "average_similarity": 23.5
  },
  "created_at": "2024-01-11T10:30:00Z"
}
```

#### PUT /courses/{course_id}
Update course information

#### DELETE /courses/{course_id}
Delete a course (soft delete)

---

### Assignment Management Endpoints

#### POST /assignments
Create a new assignment

**Request Body:**
```json
{
  "course_id": "c1234567-e89b-12d3-a456-426614174000",
  "name": "Assignment 3: Binary Search Tree Implementation",
  "description": "Implement a binary search tree with insert, delete, and search operations",
  "due_date": "2024-10-15T23:59:59Z",
  "allowed_languages": ["python", "java", "cpp"],
  "settings": {
    "sensitivity": 85,
    "ai_detection_enabled": true,
    "network_analysis_enabled": true,
    "min_code_lines": 10,
    "max_file_size": 5242880
  }
}
```

**Response: 201 Created**
```json
{
  "id": "a1234567-e89b-12d3-a456-426614174000",
  "name": "Assignment 3: Binary Search Tree Implementation",
  "course_id": "c1234567-e89b-12d3-a456-426614174000",
  "status": "active",
  "upload_url": "https://upload.codeguard-nexus.com/assignments/a1234567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-11T10:30:00Z"
}
```

#### GET /assignments/{assignment_id}
Get assignment details

**Response: 200 OK**
```json
{
  "id": "a1234567-e89b-12d3-a456-426614174000",
  "name": "Assignment 3: Binary Search Tree Implementation",
  "course": {
    "id": "c1234567-e89b-12d3-a456-426614174000",
    "name": "CS101: Data Structures",
    "code": "CS101"
  },
  "due_date": "2024-10-15T23:59:59Z",
  "submission_count": 45,
  "analyzed_count": 45,
  "status": "completed",
  "statistics": {
    "plagiarism_cases": 8,
    "ai_generated": 12,
    "average_similarity": 23.5,
    "clean_submissions": 25,
    "high_risk": 8,
    "medium_risk": 12,
    "low_risk": 25
  },
  "settings": {
    "sensitivity": 85,
    "ai_detection_enabled": true,
    "network_analysis_enabled": true
  },
  "created_at": "2024-01-11T10:30:00Z",
  "analyzed_at": "2024-01-11T12:30:00Z"
}
```

#### POST /assignments/{assignment_id}/analyze
Trigger plagiarism analysis for an assignment

**Request Body:**
```json
{
  "reanalyze": false,
  "comparison_mode": "all", // all, new_only
  "notification_email": "professor@university.edu"
}
```

**Response: 202 Accepted**
```json
{
  "task_id": "task_123456789",
  "status": "queued",
  "message": "Analysis has been queued. You will be notified when complete.",
  "estimated_time": 120
}
```

---

### Submission Management Endpoints

#### POST /submissions/upload
Upload student submissions (supports batch upload)

**Request: Multipart Form Data**
```
Content-Type: multipart/form-data

assignment_id: a1234567-e89b-12d3-a456-426614174000
student_identifier: student_a@university.edu
student_name: John Smith
files: [file1.py, file2.py]
```

**Response: 201 Created**
```json
{
  "submission_id": "s1234567-e89b-12d3-a456-426614174000",
  "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
  "student_identifier": "student_a@university.edu",
  "file_count": 2,
  "total_size": 12345,
  "status": "pending",
  "uploaded_files": [
    {
      "id": "f1234567-e89b-12d3-a456-426614174000",
      "filename": "main.py",
      "size": 5678,
      "language": "python"
    }
  ]
}
```

#### POST /submissions/batch-upload
Batch upload multiple student submissions (ZIP file)

**Request: Multipart Form Data**
```
Content-Type: multipart/form-data

assignment_id: a1234567-e89b-12d3-a456-426614174000
submissions_zip: submissions.zip
naming_pattern: {student_id}_{filename} // or {email}_{filename}
```

**Response: 202 Accepted**
```json
{
  "batch_id": "batch_123456789",
  "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
  "total_files": 90,
  "detected_submissions": 45,
  "status": "processing",
  "message": "Batch upload is being processed"
}
```

#### GET /submissions/{submission_id}
Get submission details

**Response: 200 OK**
```json
{
  "id": "s1234567-e89b-12d3-a456-426614174000",
  "assignment": {
    "id": "a1234567-e89b-12d3-a456-426614174000",
    "name": "Assignment 3: Binary Search Tree"
  },
  "student_identifier": "student_a@university.edu",
  "student_name": "John Smith",
  "file_count": 2,
  "files": [
    {
      "id": "f1234567-e89b-12d3-a456-426614174000",
      "filename": "main.py",
      "size": 5678,
      "language": "python",
      "line_count": 145
    }
  ],
  "analysis_result": {
    "overall_similarity": 92.5,
    "risk_level": "high",
    "ai_detection_score": 15.3,
    "matched_submissions": 3
  },
  "status": "completed",
  "submission_time": "2024-01-11T10:00:00Z",
  "analysis_completed_at": "2024-01-11T10:05:00Z"
}
```

---

### Analysis & Detection Endpoints

#### GET /analysis/results
Get analysis results for an assignment

**Query Parameters:**
- `assignment_id` (required)
- `risk_level` (optional: low, medium, high)
- `sort_by` (optional: similarity, ai_score, date)
- `page` (int, default: 1)
- `page_size` (int, default: 20)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "r1234567-e89b-12d3-a456-426614174000",
      "submission": {
        "id": "s1234567-e89b-12d3-a456-426614174000",
        "student_identifier": "student_a@university.edu",
        "student_name": "John Smith"
      },
      "overall_similarity": 92.5,
      "lexical_similarity": 95.0,
      "syntactic_similarity": 89.0,
      "semantic_similarity": 88.0,
      "ai_detection_score": 15.3,
      "risk_level": "high",
      "matched_count": 3,
      "top_matches": [
        {
          "submission_id": "s2234567-e89b-12d3-a456-426614174000",
          "student_identifier": "student_b@university.edu",
          "similarity": 92.5
        }
      ],
      "analyzed_at": "2024-01-11T10:05:00Z"
    }
  ],
  "statistics": {
    "total_analyzed": 45,
    "high_risk": 8,
    "medium_risk": 12,
    "low_risk": 25,
    "average_similarity": 23.5
  },
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 45
  }
}
```

#### GET /analysis/comparison/{pair_id}
Get detailed comparison between two submissions

**Response: 200 OK**
```json
{
  "id": "p1234567-e89b-12d3-a456-426614174000",
  "submission_a": {
    "id": "s1234567-e89b-12d3-a456-426614174000",
    "student_identifier": "student_a@university.edu",
    "file": {
      "id": "f1234567-e89b-12d3-a456-426614174000",
      "filename": "main.py",
      "language": "python"
    }
  },
  "submission_b": {
    "id": "s2234567-e89b-12d3-a456-426614174000",
    "student_identifier": "student_b@university.edu",
    "file": {
      "id": "f2234567-e89b-12d3-a456-426614174000",
      "filename": "solution.py",
      "language": "python"
    }
  },
  "similarity_score": 92.5,
  "lexical_similarity": 95.0,
  "syntactic_similarity": 89.0,
  "semantic_similarity": 88.0,
  "match_details": {
    "identical_lines": [1, 4, 5, 6, 7, 8, 9],
    "similar_lines": [3, 11, 12, 13],
    "code_blocks": [
      {
        "type": "identical",
        "start_line_a": 4,
        "end_line_a": 9,
        "start_line_b": 4,
        "end_line_b": 9,
        "content_preview": "def bubble_sort(arr):\n    n = len(arr)..."
      }
    ]
  },
  "ast_similarity": {
    "structure_match": 94.0,
    "function_similarity": 98.0,
    "variable_renaming_detected": true
  },
  "status": "detected",
  "created_at": "2024-01-11T10:05:00Z"
}
```

#### POST /analysis/ai-detection
Detect AI-generated code in a submission

**Request Body:**
```json
{
  "submission_id": "s1234567-e89b-12d3-a456-426614174000",
  "file_id": "f1234567-e89b-12d3-a456-426614174000"
}
```

**Response: 200 OK**
```json
{
  "submission_id": "s1234567-e89b-12d3-a456-426614174000",
  "file_id": "f1234567-e89b-12d3-a456-426614174000",
  "ai_generated_probability": 85.3,
  "confidence": 92.1,
  "detected_patterns": [
    {
      "type": "chatgpt_style",
      "confidence": 88.0,
      "indicators": [
        "Verbose comments",
        "Consistent formatting",
        "Generic variable names"
      ]
    }
  ],
  "code_sections": [
    {
      "start_line": 1,
      "end_line": 15,
      "ai_probability": 90.2,
      "reason": "High similarity to ChatGPT-3.5 generated code patterns"
    }
  ],
  "model_predictions": {
    "gpt_detector": 85.3,
    "copilot_detector": 45.2,
    "generic_ai_detector": 78.9
  }
}
```

#### GET /analysis/network/{assignment_id}
Get collaboration network graph data

**Response: 200 OK**
```json
{
  "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
  "nodes": [
    {
      "id": "s1234567-e89b-12d3-a456-426614174000",
      "student_identifier": "student_a@university.edu",
      "type": "original",
      "risk_level": "low",
      "centrality": 0.8
    },
    {
      "id": "s2234567-e89b-12d3-a456-426614174000",
      "student_identifier": "student_b@university.edu",
      "type": "copied",
      "risk_level": "high",
      "centrality": 0.9
    }
  ],
  "edges": [
    {
      "source": "s1234567-e89b-12d3-a456-426614174000",
      "target": "s2234567-e89b-12d3-a456-426614174000",
      "weight": 92.5,
      "type": "high_similarity"
    }
  ],
  "clusters": [
    {
      "id": "cluster_1",
      "members": [
        "s1234567-e89b-12d3-a456-426614174000",
        "s2234567-e89b-12d3-a456-426614174000",
        "s3234567-e89b-12d3-a456-426614174000"
      ],
      "average_similarity": 88.5
    }
  ],
  "statistics": {
    "total_nodes": 45,
    "total_edges": 23,
    "clusters": 3,
    "isolated_nodes": 12
  }
}
```

---

### Report Generation Endpoints

#### POST /reports/generate
Generate a plagiarism report

**Request Body:**
```json
{
  "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
  "report_type": "pdf", // pdf, csv, json, html
  "include_sections": [
    "executive_summary",
    "detailed_results",
    "code_comparisons",
    "network_graph",
    "ai_detection"
  ],
  "filter": {
    "risk_level": ["high", "medium"],
    "min_similarity": 70.0
  },
  "email_delivery": true
}
```

**Response: 202 Accepted**
```json
{
  "report_id": "rep_123456789",
  "status": "generating",
  "estimated_time": 60,
  "message": "Report generation in progress"
}
```

#### GET /reports/{report_id}
Get report status and download link

**Response: 200 OK**
```json
{
  "id": "rep_123456789",
  "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
  "report_type": "pdf",
  "status": "completed",
  "file_size": 2457600,
  "download_url": "https://storage.codeguard-nexus.com/reports/rep_123456789.pdf",
  "expires_at": "2024-01-18T10:30:00Z",
  "generated_at": "2024-01-11T10:35:00Z"
}
```

#### GET /reports
List all generated reports

**Query Parameters:**
- `assignment_id` (optional)
- `status` (optional)
- `page` (int, default: 1)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "rep_123456789",
      "assignment": {
        "id": "a1234567-e89b-12d3-a456-426614174000",
        "name": "Assignment 3: Binary Search Tree"
      },
      "report_type": "pdf",
      "status": "completed",
      "file_size": 2457600,
      "generated_at": "2024-01-11T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 15
  }
}
```

---

### Statistics & Analytics Endpoints

#### GET /statistics/dashboard
Get dashboard overview statistics

**Query Parameters:**
- `course_id` (optional)
- `date_from` (optional)
- `date_to` (optional)

**Response: 200 OK**
```json
{
  "overview": {
    "total_submissions": 1247,
    "submissions_change": 12.5,
    "plagiarism_cases": 23,
    "plagiarism_change": -8.0,
    "ai_generated_count": 45,
    "ai_generated_change": 15.0,
    "time_saved_hours": 127,
    "time_saved_change": 22.0
  },
  "recent_activity": [
    {
      "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
      "assignment_name": "CS101 - Assignment 3",
      "analyzed_at": "2024-01-11T10:00:00Z",
      "submission_count": 45,
      "high_risk_count": 8,
      "medium_risk_count": 12
    }
  ],
  "risk_distribution": {
    "clean": 65,
    "low_risk": 0,
    "medium_risk": 25,
    "high_risk": 10
  },
  "trends": {
    "submissions_by_week": [
      {"week": "2024-W01", "count": 180},
      {"week": "2024-W02", "count": 220}
    ],
    "plagiarism_trend": [
      {"week": "2024-W01", "rate": 5.2},
      {"week": "2024-W02", "rate": 4.8}
    ]
  }
}
```

#### GET /statistics/assignment/{assignment_id}
Get detailed statistics for an assignment

**Response: 200 OK**
```json
{
  "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
  "submission_statistics": {
    "total": 45,
    "analyzed": 45,
    "pending": 0,
    "failed": 0
  },
  "similarity_distribution": {
    "0-20": 25,
    "20-40": 8,
    "40-60": 5,
    "60-80": 4,
    "80-100": 3
  },
  "ai_detection_statistics": {
    "total_flagged": 12,
    "high_confidence": 8,
    "medium_confidence": 3,
    "low_confidence": 1,
    "average_score": 35.2
  },
  "language_distribution": {
    "python": 40,
    "java": 3,
    "cpp": 2
  },
  "code_metrics": {
    "average_lines": 145,
    "average_complexity": 8.5,
    "total_functions": 180
  }
}
```

---

### WebSocket Endpoints

#### WS /ws/analysis/{assignment_id}
Real-time analysis progress updates

**Connection:**
```javascript
ws://api.codeguard-nexus.com/v1/ws/analysis/a1234567-e89b-12d3-a456-426614174000?token={access_token}
```

**Messages:**
```json
{
  "type": "progress",
  "data": {
    "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
    "status": "analyzing",
    "progress": 45,
    "current_submission": "student_c@university.edu",
    "analyzed_count": 20,
    "total_count": 45,
    "estimated_time_remaining": 180
  }
}
```

```json
{
  "type": "match_found",
  "data": {
    "submission_a": "student_a@university.edu",
    "submission_b": "student_b@university.edu",
    "similarity": 92.5,
    "risk_level": "high"
  }
}
```

```json
{
  "type": "completed",
  "data": {
    "assignment_id": "a1234567-e89b-12d3-a456-426614174000",
    "total_analyzed": 45,
    "plagiarism_cases": 8,
    "ai_generated": 12,
    "completion_time": 180
  }
}
```

---

## Error Responses

All API endpoints follow consistent error response format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The assignment_id field is required",
    "details": {
      "field": "assignment_id",
      "reason": "missing_required_field"
    },
    "timestamp": "2024-01-11T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| VALIDATION_ERROR | 422 | Request validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

---

## Rate Limiting

API endpoints are rate-limited per user/organization:

- **Free Tier:** 100 requests/hour
- **Pro Tier:** 1,000 requests/hour
- **Enterprise Tier:** 10,000 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1704974400
```

---

## Security

### Authentication
- JWT-based authentication with RS256 algorithm
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Token rotation on refresh

### Authorization
- Role-based access control (RBAC)
- Organization-level isolation
- Resource-level permissions

### Data Protection
- All data encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- PII anonymization in logs
- GDPR compliant data handling

### File Upload Security
- Virus scanning on upload
- File type validation
- Size limits enforced
- Sandboxed code execution

---

## Performance Considerations

### Caching Strategy
- Redis caching for frequently accessed data
- CDN for static reports
- ETag support for conditional requests

### Optimization
- Database query optimization with proper indexing
- Connection pooling
- Async task processing with Celery
- Result pagination

### Scalability
- Horizontal scaling with load balancers
- Database read replicas
- Queue-based architecture for analysis
- Microservices deployment

---

## Implementation Priority

### Phase 1: Core Functionality (Weeks 1-4)
1. Authentication & Authorization
2. Course & Assignment Management
3. File Upload & Storage
4. Basic Similarity Detection

### Phase 2: Advanced Analysis (Weeks 5-8)
1. AI-Generated Code Detection
2. Network Graph Analysis
3. Detailed Comparison Views
4. Report Generation

### Phase 3: Optimization & Features (Weeks 9-12)
1. WebSocket Real-time Updates
2. Advanced Analytics Dashboard
3. Batch Processing Optimization
4. Export Functionality

### Phase 4: Polish & Deploy (Weeks 13-16)
1. Performance Optimization
2. Security Hardening
3. Monitoring & Logging
4. Documentation & Testing

---

## Monitoring & Observability

### Metrics to Track
- Request latency (p50, p95, p99)
- Analysis processing time
- Queue depth
- Error rates by endpoint
- Database query performance
- Cache hit rates

### Alerts
- High error rate (>5%)
- Analysis queue backup (>100 pending)
- Database connection pool exhaustion
- High API latency (p95 >2s)
- Disk space <20%

---

## Development Guidelines

### Code Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── courses.py
│   │   │   │   ├── assignments.py
│   │   │   │   ├── submissions.py
│   │   │   │   ├── analysis.py
│   │   │   │   └── reports.py
│   │   │   └── router.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── celery_app.py
│   ├── models/
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── assignment.py
│   │   └── submission.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── course.py
│   │   └── assignment.py
│   ├── services/
│   │   ├── analysis/
│   │   │   ├── similarity_detector.py
│   │   │   ├── ai_detector.py
│   │   │   ├── network_analyzer.py
│   │   │   └── ast_parser.py
│   │   ├── storage/
│   │   │   └── file_manager.py
│   │   └── report/
│   │       └── generator.py
│   ├── tasks/
│   │   ├── analysis.py
│   │   └── reports.py
│   └── main.py
├── tests/
├── alembic/
├── requirements.txt
└── Dockerfile
```

### Testing Requirements
- Unit test coverage >80%
- Integration tests for all endpoints
- Load testing for analysis pipeline
- Security testing (OWASP Top 10)

---

## Deployment Architecture

### Infrastructure
- **Container Orchestration:** Kubernetes
- **CI/CD:** GitHub Actions / GitLab CI
- **Cloud Provider:** AWS / GCP / Azure
- **Load Balancer:** AWS ALB / Nginx
- **Object Storage:** AWS S3 / MinIO
- **Monitoring:** Prometheus + Grafana + ELK

### Environments
- **Development:** Local Docker Compose
- **Staging:** Kubernetes cluster (replica of production)
- **Production:** Multi-AZ Kubernetes deployment

---

This specification provides a comprehensive foundation for building the CodeGuard Nexus backend. Backend developers should prioritize implementing Phase 1 endpoints first, ensuring proper authentication, data models, and core CRUD operations before moving to advanced analysis features.
