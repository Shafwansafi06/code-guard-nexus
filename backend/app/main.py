from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, courses, assignments, submissions, comparisons, dashboard, ml_analysis, google_classroom

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"]
)

app.include_router(
    courses.router,
    prefix=f"{settings.API_V1_STR}/courses",
    tags=["Courses"]
)

app.include_router(
    assignments.router,
    prefix=f"{settings.API_V1_STR}/assignments",
    tags=["Assignments"]
)

app.include_router(
    submissions.router,
    prefix=f"{settings.API_V1_STR}/submissions",
    tags=["Submissions"]
)

app.include_router(
    comparisons.router,
    prefix=f"{settings.API_V1_STR}/comparisons",
    tags=["Comparisons"]
)

app.include_router(
    dashboard.router,
    prefix=f"{settings.API_V1_STR}/dashboard",
    tags=["Dashboard"]
)

app.include_router(
    ml_analysis.router,
    prefix=f"{settings.API_V1_STR}/ml",
    tags=["ML Analysis"]
)

app.include_router(
    google_classroom.router,
    prefix=f"{settings.API_V1_STR}/google-classroom",
    tags=["Google Classroom"]
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to CodeGuard Nexus API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    return {
        "status": "healthy",
        "service": "codeguard-nexus-api",
        "version": "1.0.0"
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check - verifies service can handle requests"""
    try:
        # Test database connection
        from app.core.database import get_supabase_admin
        supabase = get_supabase_admin()
        # Simple query to verify connection
        supabase.table('users').select('id').limit(1).execute()
        return {"status": "ready"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
