from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, courses, assignments, submissions, comparisons, dashboard, ml_analysis

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
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
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
