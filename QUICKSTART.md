# CodeGuard Nexus - Quick Start Guide

## 🚀 Getting Started

### 1. Prerequisites Checklist

- [x] Node.js 18+ installed
- [x] Python 3.11+ installed (3.13 recommended)
- [x] Supabase account created
- [x] Git installed

### 2. Initial Setup

#### A. Clone and Setup Frontend

```bash
# Navigate to project root
cd /home/shafwan-safi/Desktop/code-guard-nexus

# Install dependencies (already done)
npm install

# Verify environment variables
cat .env
# Should contain:
# VITE_SUPABASE_URL=https://hgbljrqmzynmqfhwnraq.supabase.co
# VITE_SUPABASE_ANON_KEY=your-key
# VITE_API_URL=http://localhost:8000/api/v1

# Start frontend development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

#### B. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Dependencies are already installed
# Verify with:
python -m pip list | grep fastapi

# Verify environment variables
cat .env
# Should contain Supabase credentials

# Start backend server
uvicorn app.main:app --reload
```

Backend API will be available at: `http://localhost:8000`
- API Docs: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

### 3. Database Setup

#### Execute the following SQL in Supabase SQL Editor:

```sql
-- The schema is already defined in your Supabase instance
-- Verify tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected tables:
-- organizations, users, courses, assignments
-- submissions, files, comparison_pairs, analysis_results
```

#### Enable Row Level Security (Optional but Recommended):

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own data
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Create policy: Instructors manage their courses
CREATE POLICY "Instructors manage courses"
ON courses FOR ALL
USING (auth.uid() = instructor_id);
```

### 4. Test the Integration

#### Test Frontend → Backend → Supabase Flow

1. **Register a new user**
   ```bash
   # Using curl
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "instructor@test.com",
       "username": "instructor",
       "password": "Test1234!",
       "role": "instructor"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "instructor@test.com",
       "password": "Test1234!"
     }'
   
   # Save the access_token from response
   ```

3. **Create a course**
   ```bash
   curl -X POST http://localhost:8000/api/v1/courses \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d '{
       "name": "CS 101 - Intro to Programming",
       "code": "CS101",
       "semester": "Spring 2026"
     }'
   ```

4. **Test via Frontend**
   - Open `http://localhost:5173`
   - Click "Get Started" or "Sign Up"
   - Register with email and password
   - You should be redirected to Dashboard
   - Try creating a course

### 5. Common Issues and Solutions

#### Issue: Frontend can't connect to backend
**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running, start it:
cd backend
uvicorn app.main:app --reload
```

#### Issue: CORS errors in browser console
**Solution:**
Check `backend/.env` has correct ALLOWED_ORIGINS:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Issue: Supabase authentication fails
**Solution:**
1. Verify Supabase credentials in both `.env` files
2. Check Supabase dashboard for API keys
3. Ensure Supabase project is active

#### Issue: Import errors in Python
**Solution:**
```bash
cd backend
python -m pip install -r requirements.txt --upgrade
```

#### Issue: TypeScript errors in frontend
**Solution:**
```bash
npm install axios @supabase/supabase-js
```

### 6. Development Workflow

#### Running Both Servers Simultaneously

**Terminal 1 (Frontend):**
```bash
cd /home/shafwan-safi/Desktop/code-guard-nexus
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd /home/shafwan-safi/Desktop/code-guard-nexus/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Project Structure Overview

```
code-guard-nexus/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/          # UI components
│   ├── pages/               # Page components
│   ├── lib/                 # Services & utilities
│   │   ├── supabase.ts     # Supabase client
│   │   ├── auth.ts         # Auth service
│   │   └── api.ts          # API client
│   └── contexts/           # React contexts
│
├── backend/                 # Backend (FastAPI + Python)
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   ├── core/           # Config & security
│   │   ├── models/         # Data models
│   │   └── schemas/        # Pydantic schemas
│   └── .env                # Backend environment
│
├── .env                     # Frontend environment
└── README.md               # Documentation
```

### 8. Next Steps

1. ✅ **Test User Registration**: Create an account via UI
2. ✅ **Create a Course**: Add your first course
3. ✅ **Create an Assignment**: Set up an assignment
4. ✅ **Upload Submissions**: Test file upload functionality
5. ✅ **Run Analysis**: Test plagiarism detection

### 9. Useful Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter

# Backend
uvicorn app.main:app --reload              # Start with auto-reload
uvicorn app.main:app --host 0.0.0.0        # Expose to network
python -m pytest                            # Run tests

# Database
# Access Supabase SQL Editor at:
# https://supabase.com/dashboard/project/hgbljrqmzynmqfhwnraq/sql
```

### 10. Environment Variables Reference

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://hgbljrqmzynmqfhwnraq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:8000/api/v1
```

#### Backend (backend/.env)
```env
SUPABASE_URL=https://hgbljrqmzynmqfhwnraq.supabase.co
SUPABASE_KEY=eyJhbGc... (anon key)
SUPABASE_SERVICE_KEY=eyJhbGc... (service role key)

API_V1_STR=/api/v1
PROJECT_NAME=CodeGuard Nexus API
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173

SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🎉 You're Ready!

Everything is set up and ready to go. Start both servers and access the application at `http://localhost:5173`

For detailed API documentation, visit: `http://localhost:8000/api/v1/docs`

---

**Need Help?**
- 📖 Read the full [README.md](README.md)
- 🐛 Report issues on GitHub
- 📧 Contact support
