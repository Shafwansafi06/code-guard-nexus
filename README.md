# CodeGuard Nexus 🛡️

> **AI-Powered Code Plagiarism Detection & Academic Integrity Platform**

CodeGuard Nexus is an advanced academic integrity monitoring system that helps educators detect plagiarism, AI-generated code, and maintain code quality standards using machine learning.

## ✨ Features

### 🔍 **Advanced Detection**
- **Code Plagiarism Detection**: Uses CodeBERT ML model with 96% accuracy (ONNX-optimized)
- **AI Code Detection**: Identifies AI-generated code submissions
- **Cross-Language Support**: Detects plagiarism across different programming languages
- **Auto Language Detection**: Automatically identifies programming languages from code and file extensions

### 📊 **Smart Analysis**
- **Batch Comparison**: Compare multiple submissions simultaneously
- **Similarity Scoring**: Detailed similarity percentages with risk level classification
- **Network Graph Visualization**: Visual representation of plagiarism clusters
- **Real-time Dashboard**: Live metrics and analytics

### 🎓 **Google Classroom Integration**
- **OAuth 2.0 Authentication**: Secure Google account integration
- **Course Import**: Import courses directly from Google Classroom
- **Assignment Sync**: Automatically fetch coursework and submissions
- **Student Management**: Seamless roster synchronization

### 👥 **User Experience**
- **Onboarding Flow**: Guided setup for new users
- **Profile Management**: Track student count, subject, and submission volume
- **History Tracking**: Complete audit trail of all scans
- **Dark/Light Mode**: Beautiful UI with theme support

### 🔐 **Authentication & Security**
- **Supabase Auth**: Secure authentication with email/password
- **Google OAuth**: Social login integration
- **Password Reset**: Forgot password feature with OTP verification
- **Role-Based Access**: Instructor, student, and admin roles

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React + TypeScript<br/>Vite + TailwindCSS<br/>shadcn/ui]
    end
    
    subgraph "API Layer"
        B[FastAPI Backend<br/>Python 3.13<br/>Render]
    end
    
    subgraph "Database Layer"
        C[Supabase<br/>PostgreSQL + Auth]
    end
    
    subgraph "ML Layer"
        D[HuggingFace Spaces<br/>ONNX Runtime<br/>CodeBERT Model]
    end
    
    subgraph "External Services"
        E[Google Classroom<br/>OAuth 2.0]
    end
    
    A -->|REST API| B
    B -->|SQL Queries| C
    B -->|ML Requests| D
    B -->|OAuth Flow| E
    A -->|Authentication| C
    
    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style C fill:#10b981,stroke:#059669,color:#fff
    style D fill:#f59e0b,stroke:#d97706,color:#fff
    style E fill:#ef4444,stroke:#dc2626,color:#fff
```

### System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant DB as Supabase
    participant ML as ML Service
    participant GC as Google Classroom

    U->>F: Login
    F->>DB: Authenticate
    DB-->>F: JWT Token
    
    U->>F: Upload Code Files
    F->>B: POST /submissions/upload
    B->>DB: Store Submission
    B->>ML: POST /predict
    ML-->>B: Similarity Score
    B->>DB: Save Results
    B-->>F: Analysis Complete
    F-->>U: Display Results
    
    U->>F: Import from Classroom
    F->>B: GET /google-classroom/auth/url
    B-->>F: OAuth URL
    F->>GC: Redirect to Google
    GC-->>B: Callback with Code
    B->>GC: Exchange for Tokens
    GC-->>B: Access Token
    B->>DB: Store Token
    B->>GC: Fetch Courses
    GC-->>B: Course Data
    B-->>F: Courses List
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/bun
- Python 3.13+
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Shafwansafi06/code-guard-nexus.git
cd code-guard-nexus
```

2. **Install frontend dependencies**
```bash
npm install
# or
bun install
```

3. **Install backend dependencies**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Set up environment variables**

Create `backend/.env`:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# JWT
SECRET_KEY=your_secret_key_here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-backend-url/api/v1/google-classroom/auth/callback
FRONTEND_URL=https://your-frontend-url
```

Create `src/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

5. **Run the database migration**
```bash
# Execute the SQL file in your Supabase SQL editor
cat backend/database/migrations/add_user_profile_fields.sql
```

6. **Start the development servers**

Backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
npm run dev
# or
bun dev
```

Visit `http://localhost:5173`

## 🎯 User Journey

```mermaid
journey
    title Instructor's Journey with CodeGuard Nexus
    section Onboarding
      Sign up with email: 5: Instructor
      Complete profile setup: 5: Instructor
      Import Google Classroom: 4: Instructor
    section Assignment Management
      Create assignment: 5: Instructor
      Set plagiarism threshold: 4: Instructor
      Upload student submissions: 5: Instructor
    section Analysis
      Run plagiarism detection: 5: System
      AI code detection: 5: System
      Generate similarity scores: 5: System
    section Review
      View results dashboard: 5: Instructor
      Check flagged submissions: 4: Instructor
      Review similarity network: 4: Instructor
      Export report: 5: Instructor
    section Action
      Contact students: 3: Instructor
      Document evidence: 4: Instructor
      Update grade: 4: Instructor
```

## 📦 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

### ML API (HuggingFace Spaces)
Already deployed at: `https://shafwansafi06-code-clone-detector.hf.space`

## 🔧 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **TailwindCSS** for styling
- **shadcn/ui** component library
- **Framer Motion** for animations
- **Recharts** for data visualization
- **React Query** for data fetching

### Backend
- **FastAPI** 0.115.0
- **Python 3.13**
- **Supabase** (PostgreSQL + Auth)
- **Pydantic** for validation
- **Google APIs** for Classroom integration

### ML/AI
- **CodeBERT** (microsoft/codebert-base)
- **ONNX Runtime** 1.20.1 (2-3x faster inference)
- **Transformers** library
- **HuggingFace** for model hosting

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/forgot-password` - Send reset code
- `POST /api/v1/auth/reset-password` - Reset password with OTP
- `GET /api/v1/auth/me` - Get current user

### Profile
- `GET /api/v1/profile/me` - Get user profile
- `POST /api/v1/profile/setup` - Complete onboarding
- `PUT /api/v1/profile/update` - Update profile

### Courses
- `GET /api/v1/courses` - List courses
- `POST /api/v1/courses` - Create course
- `GET /api/v1/courses/{id}` - Get course details

### Assignments
- `GET /api/v1/assignments` - List assignments
- `POST /api/v1/assignments` - Create assignment
- `GET /api/v1/assignments/{id}/results` - Get results

### Submissions
- `POST /api/v1/submissions/upload` - Upload files
- `GET /api/v1/submissions/{id}` - Get submission

### ML Analysis
- `POST /api/v1/ml/detect-clone` - Detect code similarity
- `POST /api/v1/ml/detect-ai` - Detect AI-generated code
- `POST /api/v1/ml/batch-clone` - Batch comparison

### Google Classroom
- `GET /api/v1/google-classroom/auth/url` - Get OAuth URL
- `GET /api/v1/google-classroom/auth/callback` - OAuth callback
- `GET /api/v1/google-classroom/courses` - List courses
- `POST /api/v1/google-classroom/import-course` - Import course

## 🎨 Language Detection

Automatically detects **30+ programming languages** including:
- Python, JavaScript, TypeScript, Java, C++, C, C#
- PHP, Ruby, Go, Rust, Swift, Kotlin, Scala
- HTML, CSS, SQL, Shell, PowerShell
- JSON, YAML, Markdown, and more

## 📊 Database Schema

```mermaid
erDiagram
    USERS ||--o{ COURSES : creates
    USERS ||--o{ GOOGLE_OAUTH_TOKENS : has
    COURSES ||--o{ ASSIGNMENTS : contains
    ASSIGNMENTS ||--o{ SUBMISSIONS : receives
    SUBMISSIONS ||--o{ FILES : includes
    SUBMISSIONS ||--o{ ANALYSIS_RESULTS : generates
    ASSIGNMENTS ||--o{ COMPARISON_PAIRS : analyzes
    USERS ||--o{ ORGANIZATIONS : belongs_to

    USERS {
        uuid id PK
        string email UK
        string username
        string password_hash
        string full_name
        string subject
        string institution
        int student_count
        int expected_submissions
        boolean onboarding_completed
        enum role
        boolean is_active
        timestamp created_at
    }
    
    COURSES {
        uuid id PK
        string name
        string code
        string semester
        uuid instructor_id FK
        timestamp created_at
    }
    
    ASSIGNMENTS {
        uuid id PK
        string name
        uuid course_id FK
        timestamp due_date
        json settings
        enum status
        timestamp created_at
    }
    
    SUBMISSIONS {
        uuid id PK
        uuid assignment_id FK
        string student_identifier
        int file_count
        enum status
        timestamp created_at
    }
    
    FILES {
        uuid id PK
        uuid submission_id FK
        string filename
        string language
        string file_hash
        text content
    }
    
    ANALYSIS_RESULTS {
        uuid id PK
        uuid submission_id FK
        float overall_similarity
        float ai_detection_score
        enum risk_level
        json detailed_results
    }
    
    GOOGLE_OAUTH_TOKENS {
        uuid id PK
        uuid user_id FK
        string access_token
        string refresh_token
        timestamp expires_at
    }
```

## 🔄 ML Detection Pipeline

```mermaid
flowchart TD
    A[Code Submission] --> B{File Type}
    B -->|Single File| C[Extract Code]
    B -->|Multiple Files| D[Batch Processing]
    
    C --> E[Language Detection]
    D --> E
    
    E --> F[Tokenization<br/>CodeBERT Tokenizer]
    F --> G[ONNX Model Inference<br/>microsoft/codebert-base]
    
    G --> H{Analysis Type}
    H -->|Clone Detection| I[Similarity Scoring<br/>Cosine Similarity]
    H -->|AI Detection| J[Pattern Analysis<br/>AI Probability]
    
    I --> K{Threshold Check}
    K -->|>70%| L[High Risk]
    K -->|50-70%| M[Medium Risk]
    K -->|<50%| N[Low Risk]
    
    J --> O{AI Score}
    O -->|>80%| P[AI Generated]
    O -->|50-80%| Q[Possibly AI]
    O -->|<50%| R[Human Written]
    
    L --> S[Generate Report]
    M --> S
    N --> S
    P --> S
    Q --> S
    R --> S
    
    S --> T[Store Results in DB]
    T --> U[Notify User]
    
    style A fill:#3b82f6
    style G fill:#f59e0b
    style L fill:#ef4444
    style M fill:#f59e0b
    style N fill:#10b981
    style P fill:#ef4444
    style R fill:#10b981
```

## 🔐 Authentication Flow

```mermaid
stateDiagram-v2
    [*] --> Landing
    Landing --> Login: Click Login
    Landing --> Signup: Click Signup
    
    Login --> EmailAuth: Email/Password
    Login --> GoogleAuth: Google OAuth
    
    EmailAuth --> Supabase: Authenticate
    GoogleAuth --> Supabase: OAuth Flow
    
    Supabase --> Verified: Success
    Supabase --> Login: Failed
    
    Signup --> NewUser: Register
    NewUser --> Supabase: Create Account
    Supabase --> Onboarding: First Login
    
    Onboarding --> ProfileSetup: Step 1
    ProfileSetup --> ClassDetails: Step 2
    ClassDetails --> Dashboard: Complete
    
    Verified --> Dashboard: Has Profile
    
    Dashboard --> ForgotPassword: Reset Password
    ForgotPassword --> EmailSent: Send OTP
    EmailSent --> ResetPassword: Enter Code
    ResetPassword --> Login: Password Updated
    
    Dashboard --> [*]: Logout
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Shafwan Safi**
- GitHub: [@Shafwansafi06](https://github.com/Shafwansafi06)
- Email: shafwansafi06@gmail.com

## 🙏 Acknowledgments

- CodeBERT model by Microsoft
- shadcn/ui component library
- Supabase for backend infrastructure
- HuggingFace for ML model hosting
- FastAPI for backend framework

## 📧 Support

For support, email shafwansafi06@gmail.com or open an issue on GitHub.

---

Made with ❤️ by Shafwan Safi
