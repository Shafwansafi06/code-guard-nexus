from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from app.core.database import get_supabase
from app.core.security import get_current_user, get_instructor_user
from app.schemas import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse, AssignmentWithStats
)
from app.services.plagiarism_service import plagiarism_service

router = APIRouter()


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment: AssignmentCreate,
    current_user: dict = Depends(get_instructor_user)
):
    """Create a new assignment"""
    supabase = get_supabase()
    
    try:
        # Verify course exists and user has permission
        course = supabase.table("courses").select("*").eq("id", assignment.course_id).execute()
        
        if not course.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if course.data[0]["instructor_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create assignment for this course"
            )
        
        assignment_data = assignment.model_dump()
        if assignment_data.get("due_date"):
            assignment_data["due_date"] = assignment_data["due_date"].isoformat()
        
        result = supabase.table("assignments").insert(assignment_data).execute()
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create assignment: {str(e)}"
        )


@router.get("/", response_model=List[AssignmentWithStats])
async def list_assignments(
    course_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all assignments"""
    supabase = get_supabase()
    
    try:
        query = supabase.table("assignments").select("*, courses(name)")
        
        if course_id:
            query = query.eq("course_id", course_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        result = query.execute()
        
        # Enhance with stats
        assignments_with_stats = []
        for assignment in result.data:
            # Get submission stats
            submissions = supabase.table("submissions").select("*").eq("assignment_id", assignment["id"]).execute()
            
            pending = sum(1 for s in submissions.data if s["status"] == "pending") if submissions.data else 0
            
            # Get average similarity
            comparisons = supabase.table("comparison_pairs").select("similarity_score").eq("assignment_id", assignment["id"]).execute()
            
            avg_similarity = None
            if comparisons.data:
                scores = [c["similarity_score"] for c in comparisons.data if c.get("similarity_score") is not None]
                avg_similarity = sum(scores) / len(scores) if scores else None
            
            course_name = assignment.get("courses", {}).get("name") if assignment.get("courses") else None
            
            assignments_with_stats.append({
                **assignment,
                "course_name": course_name,
                "submission_count": len(submissions.data) if submissions.data else 0,
                "pending_analyses": pending,
                "average_similarity": avg_similarity
            })
        
        return assignments_with_stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch assignments: {str(e)}"
        )


@router.get("/{assignment_id}", response_model=AssignmentWithStats)
async def get_assignment(
    assignment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific assignment by ID"""
    supabase = get_supabase()
    
    try:
        result = supabase.table("assignments").select("*, courses(name)").eq("id", assignment_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment = result.data[0]
        
        # Get stats
        submissions = supabase.table("submissions").select("*").eq("assignment_id", assignment_id).execute()
        pending = sum(1 for s in submissions.data if s["status"] == "pending") if submissions.data else 0
        
        comparisons = supabase.table("comparison_pairs").select("similarity_score").eq("assignment_id", assignment_id).execute()
        
        avg_similarity = None
        if comparisons.data:
            scores = [c["similarity_score"] for c in comparisons.data if c.get("similarity_score") is not None]
            avg_similarity = sum(scores) / len(scores) if scores else None
        
        course_name = assignment.get("courses", {}).get("name") if assignment.get("courses") else None
        
        return {
            **assignment,
            "course_name": course_name,
            "submission_count": len(submissions.data) if submissions.data else 0,
            "pending_analyses": pending,
            "average_similarity": avg_similarity
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch assignment: {str(e)}"
        )


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    assignment_update: AssignmentUpdate,
    current_user: dict = Depends(get_instructor_user)
):
    """Update an assignment"""
    supabase = get_supabase()
    
    try:
        # Check if assignment exists
        existing = supabase.table("assignments").select("*, courses(instructor_id)").eq("id", assignment_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check permissions
        course_instructor = existing.data[0]["courses"]["instructor_id"]
        if course_instructor != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this assignment"
            )
        
        # Update assignment
        update_data = assignment_update.model_dump(exclude_unset=True)
        if update_data.get("due_date"):
            update_data["due_date"] = update_data["due_date"].isoformat()
        
        result = supabase.table("assignments").update(update_data).eq("id", assignment_id).execute()
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update assignment: {str(e)}"
        )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: str,
    current_user: dict = Depends(get_instructor_user)
):
    """Delete an assignment"""
    supabase = get_supabase()
    
    try:
        # Check if assignment exists
        existing = supabase.table("assignments").select("*, courses(instructor_id)").eq("id", assignment_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check permissions
        course_instructor = existing.data[0]["courses"]["instructor_id"]
        if course_instructor != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this assignment"
            )
        
        # Delete assignment
        supabase.table("assignments").delete().eq("id", assignment_id).execute()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete assignment: {str(e)}"
        )


@router.post("/{assignment_id}/start-analysis", status_code=status.HTTP_202_ACCEPTED)
async def start_analysis(
    assignment_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_instructor_user)
):
    """Start plagiarism analysis for an assignment"""
    supabase = get_supabase()
    
    try:
        # Verify assignment exists
        assignment = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        
        if not assignment.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Get all submissions for this assignment
        submissions = supabase.table("submissions").select("*").eq("assignment_id", assignment_id).execute()
        
        if not submissions.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No submissions found for analysis"
            )
        
        # Create comparison pairs (all combinations)
        pairs_created = 0
        for i, sub_a in enumerate(submissions.data):
            for sub_b in submissions.data[i+1:]:
                try:
                    pair_data = {
                        "assignment_id": assignment_id,
                        "submission_a_id": sub_a["id"],
                        "submission_b_id": sub_b["id"],
                        "status": "pending"
                    }
                    supabase.table("comparison_pairs").insert(pair_data).execute()
                    pairs_created += 1
                except:
                    # Pair might already exist, skip
                    pass
        
        # Trigger actual ML analysis in background
        background_tasks.add_task(plagiarism_service.run_assignment_analysis, assignment_id)
        
        return {
            "message": "Analysis started",
            "assignment_id": assignment_id,
            "submission_count": len(submissions.data),
            "comparison_pairs_created": pairs_created
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to start analysis: {str(e)}"
        )
