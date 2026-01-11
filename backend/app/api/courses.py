from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.core.database import get_supabase
from app.core.security import get_current_user, get_instructor_user
from app.schemas import (
    CourseCreate, CourseUpdate, CourseResponse, CourseWithStats
)

router = APIRouter()


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: CourseCreate,
    current_user: dict = Depends(get_instructor_user)
):
    """Create a new course"""
    supabase = get_supabase()
    
    # Set instructor_id to current user if not provided
    course_data = course.model_dump()
    if not course_data.get("instructor_id"):
        course_data["instructor_id"] = current_user["id"]
    
    try:
        result = supabase.table("courses").insert(course_data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create course: {str(e)}"
        )


@router.get("/", response_model=List[CourseWithStats])
async def list_courses(
    semester: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all courses for the current user"""
    supabase = get_supabase()
    
    try:
        query = supabase.table("courses").select("*")
        
        # Filter by instructor for instructors
        if current_user["role"] == "instructor":
            query = query.eq("instructor_id", current_user["id"])
        
        # Filter by semester if provided
        if semester:
            query = query.eq("semester", semester)
        
        result = query.execute()
        
        # Enhance with stats
        courses_with_stats = []
        for course in result.data:
            # Get assignment count
            assignments = supabase.table("assignments").select("id", count="exact").eq("course_id", course["id"]).execute()
            
            courses_with_stats.append({
                **course,
                "assignment_count": len(assignments.data) if assignments.data else 0,
                "student_count": 0  # TODO: Implement student count
            })
        
        return courses_with_stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch courses: {str(e)}"
        )


@router.get("/{course_id}", response_model=CourseWithStats)
async def get_course(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific course by ID"""
    supabase = get_supabase()
    
    try:
        result = supabase.table("courses").select("*").eq("id", course_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        course = result.data[0]
        
        # Check permissions
        if current_user["role"] == "instructor" and course["instructor_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this course"
            )
        
        # Get stats
        assignments = supabase.table("assignments").select("id", count="exact").eq("course_id", course_id).execute()
        
        return {
            **course,
            "assignment_count": len(assignments.data) if assignments.data else 0,
            "student_count": 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch course: {str(e)}"
        )


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user: dict = Depends(get_instructor_user)
):
    """Update a course"""
    supabase = get_supabase()
    
    try:
        # Check if course exists and user has permission
        existing = supabase.table("courses").select("*").eq("id", course_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if existing.data[0]["instructor_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this course"
            )
        
        # Update course
        update_data = course_update.model_dump(exclude_unset=True)
        result = supabase.table("courses").update(update_data).eq("id", course_id).execute()
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update course: {str(e)}"
        )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    current_user: dict = Depends(get_instructor_user)
):
    """Delete a course"""
    supabase = get_supabase()
    
    try:
        # Check if course exists and user has permission
        existing = supabase.table("courses").select("*").eq("id", course_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if existing.data[0]["instructor_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this course"
            )
        
        # Delete course
        supabase.table("courses").delete().eq("id", course_id).execute()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete course: {str(e)}"
        )
