"""
Google Classroom API Routes
Endpoints for Google Classroom integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional, List
from datetime import datetime, timedelta

from app.schemas.google_classroom import (
    GoogleClassroomAuthURL,
    GoogleClassroomCourse,
    GoogleClassroomCourseWork,
    GoogleClassroomStudentSubmission,
    ImportCourseRequest,
    ImportCourseResponse,
    ImportAssignmentRequest,
    ImportAssignmentResponse,
    SyncStatusResponse,
    GoogleOAuthTokenResponse,
)
from app.services.google_classroom_service import google_classroom_service
from app.core.database import get_supabase

router = APIRouter(prefix="/google-classroom", tags=["Google Classroom"])


@router.get("/auth/url", response_model=GoogleClassroomAuthURL)
async def get_authorization_url():
    """
    Generate Google OAuth 2.0 authorization URL
    
    Returns:
        Authorization URL and state for CSRF protection
    """
    try:
        auth_url, state = google_classroom_service.create_authorization_url()
        return GoogleClassroomAuthURL(auth_url=auth_url, state=state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )


@router.post("/auth/callback", response_model=GoogleOAuthTokenResponse)
async def oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    user_id: str = Query(..., description="User ID to associate tokens with"),
    supabase = Depends(get_supabase)
):
    """
    Handle OAuth callback and exchange code for tokens
    
    Stores tokens in database for future use
    """
    try:
        # Exchange code for tokens
        token_data = google_classroom_service.exchange_code_for_tokens(code, state)
        
        # Store tokens in database (encrypted)
        expires_at = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
        
        token_record = {
            'user_id': user_id,
            'access_token': token_data['access_token'],
            'refresh_token': token_data.get('refresh_token'),
            'expires_at': expires_at.isoformat(),
            'token_type': token_data['token_type'],
            'scope': token_data['scope'],
            'created_at': datetime.utcnow().isoformat(),
        }
        
        # Upsert token (update if exists, insert if not)
        result = supabase.table('google_oauth_tokens').upsert(
            token_record,
            on_conflict='user_id'
        ).execute()
        
        return GoogleOAuthTokenResponse(**token_data)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to exchange authorization code: {str(e)}"
        )


@router.get("/courses", response_model=List[GoogleClassroomCourse])
async def list_google_classroom_courses(
    user_id: str = Query(..., description="User ID to fetch courses for"),
    supabase = Depends(get_supabase)
):
    """
    List all Google Classroom courses for authenticated user
    """
    try:
        # Fetch user's OAuth tokens from database
        result = supabase.table('google_oauth_tokens').select('*').eq('user_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated with Google Classroom"
            )
        
        token_data = result.data[0]
        access_token = token_data['access_token']
        refresh_token = token_data.get('refresh_token')
        
        # Fetch courses from Google Classroom
        courses = await google_classroom_service.fetch_courses(access_token, refresh_token)
        
        return courses
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch courses: {str(e)}"
        )


@router.get("/courses/{course_id}", response_model=GoogleClassroomCourse)
async def get_google_classroom_course(
    course_id: str,
    user_id: str = Query(..., description="User ID"),
    supabase = Depends(get_supabase)
):
    """
    Get a specific Google Classroom course by ID
    """
    try:
        # Fetch user's OAuth tokens
        result = supabase.table('google_oauth_tokens').select('*').eq('user_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated with Google Classroom"
            )
        
        token_data = result.data[0]
        access_token = token_data['access_token']
        refresh_token = token_data.get('refresh_token')
        
        # Fetch course from Google Classroom
        course = await google_classroom_service.fetch_course_by_id(course_id, access_token, refresh_token)
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course {course_id} not found"
            )
        
        return course
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course: {str(e)}"
        )


@router.get("/courses/{course_id}/coursework", response_model=List[GoogleClassroomCourseWork])
async def list_course_assignments(
    course_id: str,
    user_id: str = Query(..., description="User ID"),
    supabase = Depends(get_supabase)
):
    """
    List all coursework (assignments) for a Google Classroom course
    """
    try:
        # Fetch user's OAuth tokens
        result = supabase.table('google_oauth_tokens').select('*').eq('user_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated with Google Classroom"
            )
        
        token_data = result.data[0]
        access_token = token_data['access_token']
        refresh_token = token_data.get('refresh_token')
        
        # Fetch coursework from Google Classroom
        coursework = await google_classroom_service.fetch_coursework(course_id, access_token, refresh_token)
        
        return coursework
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch coursework: {str(e)}"
        )


@router.post("/import/course", response_model=ImportCourseResponse)
async def import_course_from_google_classroom(
    request: ImportCourseRequest,
    user_id: str = Query(..., description="User ID (instructor)"),
    supabase = Depends(get_supabase)
):
    """
    Import a course from Google Classroom into CodeGuard Nexus
    
    Creates a new course in the local database linked to Google Classroom
    """
    try:
        # Fetch user's OAuth tokens
        token_result = supabase.table('google_oauth_tokens').select('*').eq('user_id', user_id).execute()
        
        if not token_result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated with Google Classroom"
            )
        
        token_data = token_result.data[0]
        access_token = token_data['access_token']
        refresh_token = token_data.get('refresh_token')
        
        # Fetch course from Google Classroom
        google_course = await google_classroom_service.fetch_course_by_id(
            request.google_classroom_id,
            access_token,
            refresh_token
        )
        
        if not google_course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Google Classroom course {request.google_classroom_id} not found"
            )
        
        # Check if course already imported
        existing_result = supabase.table('courses').select('*').eq(
            'google_classroom_id', request.google_classroom_id
        ).execute()
        
        if existing_result.data:
            return ImportCourseResponse(
                success=False,
                course_id=existing_result.data[0]['id'],
                message="Course already imported",
                google_classroom_id=request.google_classroom_id
            )
        
        # Create course in local database
        course_data = {
            'name': google_course.name,
            'code': google_course.section or f"GC-{google_course.id[:8]}",
            'semester': "Imported from Google Classroom",
            'instructor_id': user_id,
            'google_classroom_id': google_course.id,
            'sync_enabled': request.sync_enabled,
            'last_synced_at': datetime.utcnow().isoformat(),
            'created_at': datetime.utcnow().isoformat(),
        }
        
        result = supabase.table('courses').insert(course_data).execute()
        
        return ImportCourseResponse(
            success=True,
            course_id=result.data[0]['id'],
            message="Course imported successfully",
            google_classroom_id=request.google_classroom_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import course: {str(e)}"
        )


@router.post("/import/assignment", response_model=ImportAssignmentResponse)
async def import_assignment_from_google_classroom(
    request: ImportAssignmentRequest,
    user_id: str = Query(..., description="User ID (instructor)"),
    supabase = Depends(get_supabase)
):
    """
    Import an assignment from Google Classroom into CodeGuard Nexus
    
    Creates a new assignment in the local database linked to Google Classroom coursework
    """
    try:
        # Fetch user's OAuth tokens
        token_result = supabase.table('google_oauth_tokens').select('*').eq('user_id', user_id).execute()
        
        if not token_result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated with Google Classroom"
            )
        
        token_data = token_result.data[0]
        access_token = token_data['access_token']
        refresh_token = token_data.get('refresh_token')
        
        # Get course to find Google Classroom course ID
        course_result = supabase.table('courses').select('*').eq('id', request.course_id).execute()
        
        if not course_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course {request.course_id} not found"
            )
        
        course = course_result.data[0]
        google_course_id = course.get('google_classroom_id')
        
        if not google_course_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course is not linked to Google Classroom"
            )
        
        # Fetch coursework from Google Classroom
        google_coursework = await google_classroom_service.fetch_coursework_by_id(
            google_course_id,
            request.google_coursework_id,
            access_token,
            refresh_token
        )
        
        if not google_coursework:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Google Classroom coursework {request.google_coursework_id} not found"
            )
        
        # Check if assignment already imported
        existing_result = supabase.table('assignments').select('*').eq(
            'external_assignment_id', request.google_coursework_id
        ).execute()
        
        if existing_result.data:
            return ImportAssignmentResponse(
                success=False,
                assignment_id=existing_result.data[0]['id'],
                message="Assignment already imported",
                google_coursework_id=request.google_coursework_id
            )
        
        # Parse due date
        due_date = None
        if google_coursework.dueDate and google_coursework.dueTime:
            due_date = datetime(
                year=google_coursework.dueDate.get('year', 2024),
                month=google_coursework.dueDate.get('month', 1),
                day=google_coursework.dueDate.get('day', 1),
                hour=google_coursework.dueTime.get('hours', 23),
                minute=google_coursework.dueTime.get('minutes', 59)
            ).isoformat()
        
        # Create assignment in local database
        assignment_data = {
            'name': google_coursework.title,
            'course_id': request.course_id,
            'due_date': due_date,
            'google_classroom_link': google_coursework.alternateLink,
            'external_assignment_id': google_coursework.id,
            'settings': {
                'similarity_threshold': 0.7,
                'enable_ai_detection': True,
                'max_points': google_coursework.maxPoints
            },
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
        }
        
        result = supabase.table('assignments').insert(assignment_data).execute()
        
        return ImportAssignmentResponse(
            success=True,
            assignment_id=result.data[0]['id'],
            message="Assignment imported successfully",
            google_coursework_id=request.google_coursework_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import assignment: {str(e)}"
        )


@router.get("/sync/status", response_model=SyncStatusResponse)
async def get_sync_status(
    user_id: str = Query(..., description="User ID"),
    supabase = Depends(get_supabase)
):
    """
    Get Google Classroom sync status for user
    """
    try:
        # Check if user is authenticated with Google
        token_result = supabase.table('google_oauth_tokens').select('*').eq('user_id', user_id).execute()
        
        if not token_result.data:
            return SyncStatusResponse(
                last_synced_at=None,
                sync_enabled=False,
                courses_synced=0,
                assignments_synced=0,
                message="Not connected to Google Classroom"
            )
        
        # Count synced courses
        courses_result = supabase.table('courses').select('*').eq('instructor_id', user_id).not_.is_('google_classroom_id', 'null').execute()
        courses_synced = len(courses_result.data)
        
        # Count synced assignments
        assignments_result = supabase.table('assignments').select('*').not_.is_('external_assignment_id', 'null').execute()
        assignments_synced = len(assignments_result.data)
        
        # Get last sync time (from most recent course)
        last_synced_at = None
        if courses_result.data:
            last_synced_at = max([c.get('last_synced_at') for c in courses_result.data if c.get('last_synced_at')])
        
        return SyncStatusResponse(
            last_synced_at=last_synced_at,
            sync_enabled=True,
            courses_synced=courses_synced,
            assignments_synced=assignments_synced,
            message=f"Connected. {courses_synced} courses and {assignments_synced} assignments synced."
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync status: {str(e)}"
        )
