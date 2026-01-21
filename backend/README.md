# CodeGuard Nexus Backend

FastAPI backend service for the CodeGuard Nexus plagiarism detection platform.

## Features

- **Supabase Integration**: Full authentication and database integration
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, Instructor, and Student roles
- **RESTful API**: Complete CRUD operations for all resources
- **File Upload**: Support for code submission uploads
- **Real-time Analysis**: Plagiarism detection using HuggingFace deployed ML model
- **ML-Powered Detection**: CodeBERT-based clone detection via HuggingFace Spaces API
- **Hybrid Approach**: Combines Winnowing fingerprinting with deep learning

## ML Model

The backend uses a deployed CodeBERT model on HuggingFace Spaces:
- **API**: https://shafwansafi06-code-clone-detector.hf.space
- **Technology**: ONNX Runtime for 2-3x faster inference
- **Model**: Fine-tuned CodeBERT for code clone detection

## Setup

### Prerequisites

- Python 3.9+
- Supabase account and project

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token

### Courses
- `GET /api/v1/courses` - List courses
- `POST /api/v1/courses` - Create course
- `GET /api/v1/courses/{id}` - Get course
- `PUT /api/v1/courses/{id}` - Update course
- `DELETE /api/v1/courses/{id}` - Delete course

### Assignments
- `GET /api/v1/assignments` - List assignments
- `POST /api/v1/assignments` - Create assignment
- `GET /api/v1/assignments/{id}` - Get assignment
- `PUT /api/v1/assignments/{id}` - Update assignment
- `DELETE /api/v1/assignments/{id}` - Delete assignment
- `POST /api/v1/assignments/{id}/start-analysis` - Start plagiarism analysis

### Submissions
- `GET /api/v1/submissions` - List submissions
- `POST /api/v1/submissions` - Create submission
- `POST /api/v1/submissions/upload` - Upload submission files
- `GET /api/v1/submissions/{id}` - Get submission
- `PUT /api/v1/submissions/{id}` - Update submission
- `DELETE /api/v1/submissions/{id}` - Delete submission

### Comparisons
- `GET /api/v1/comparisons` - List comparison pairs
- `GET /api/v1/comparisons/{id}` - Get comparison
- `PUT /api/v1/comparisons/{id}` - Update comparison
- `GET /api/v1/comparisons/assignment/{id}/high-risk` - Get high-risk comparisons

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/analytics/{id}` - Get assignment analytics

## Database Schema

The application uses Supabase PostgreSQL database with the following tables:

- `organizations` - Organization/institution data
- `users` - User accounts and authentication
- `courses` - Course information
- `assignments` - Assignment details and settings
- `submissions` - Student code submissions
- `files` - Uploaded code files
- `comparison_pairs` - Similarity comparisons between submissions
- `analysis_results` - Detailed analysis results

## Security

- JWT token authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Supabase Row Level Security (RLS)
- CORS protection

## Development

### Project Structure

```
backend/
├── app/
│   ├── api/           # API endpoints
│   ├── core/          # Core configuration
│   ├── models/        # Data models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   └── main.py        # Application entry point
├── requirements.txt
├── .env
└── README.md
```

### Testing

```bash
pytest
```

## Deployment

### Using Docker

```bash
docker build -t codeguard-api .
docker run -p 8000:8000 codeguard-api
```

### Using Gunicorn

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

## License

MIT License
