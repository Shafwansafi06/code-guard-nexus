from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.core.database import get_supabase
from app.core.security import get_current_user, get_instructor_user
from app.schemas import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: dict = Depends(get_instructor_user)
):
    """Get dashboard statistics for the current user"""
    supabase = get_supabase()
    
    try:
        # Get user's courses
        courses_result = supabase.table("courses").select("id").eq("instructor_id", current_user["id"]).execute()
        course_ids = [c["id"] for c in courses_result.data] if courses_result.data else []
        
        # Get assignments count
        if course_ids:
            assignments_result = supabase.table("assignments").select("id").in_("course_id", course_ids).execute()
            assignment_ids = [a["id"] for a in assignments_result.data] if assignments_result.data else []
            total_assignments = len(assignment_ids)
        else:
            assignment_ids = []
            total_assignments = 0
        
        # Get submissions count
        total_submissions = 0
        pending_reviews = 0
        if assignment_ids:
            submissions_result = supabase.table("submissions").select("*").in_("assignment_id", assignment_ids).execute()
            total_submissions = len(submissions_result.data) if submissions_result.data else 0
            pending_reviews = sum(1 for s in submissions_result.data if s["status"] == "pending") if submissions_result.data else 0
        
        # Get high-risk cases (similarity > 70%)
        high_risk_cases = 0
        if assignment_ids:
            comparisons_result = supabase.table("comparison_pairs").select("similarity_score").in_("assignment_id", assignment_ids).execute()
            if comparisons_result.data:
                high_risk_cases = sum(1 for c in comparisons_result.data if c.get("similarity_score") and c["similarity_score"] >= 0.7)
        
        # Get recent activity (last 10 submissions)
        recent_activity = []
        if assignment_ids:
            recent_submissions = supabase.table("submissions").select("*, assignments(name)").in_("assignment_id", assignment_ids).order("submission_time", desc=True).limit(10).execute()
            
            if recent_submissions.data:
                recent_activity = [
                    {
                        "type": "submission",
                        "student": s["student_identifier"],
                        "assignment": s["assignments"]["name"] if s.get("assignments") else "Unknown",
                        "timestamp": s["submission_time"],
                        "status": s["status"]
                    }
                    for s in recent_submissions.data
                ]
        
        return {
            "total_assignments": total_assignments,
            "total_submissions": total_submissions,
            "pending_reviews": pending_reviews,
            "high_risk_cases": high_risk_cases,
            "recent_activity": recent_activity
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )


@router.get("/analytics/{assignment_id}")
async def get_assignment_analytics(
    assignment_id: str,
    current_user: dict = Depends(get_instructor_user)
):
    """Get detailed analytics for a specific assignment"""
    supabase = get_supabase()
    
    try:
        # Verify assignment exists
        assignment = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        
        if not assignment.data:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        # Get all submissions
        submissions = supabase.table("submissions").select("*").eq("assignment_id", assignment_id).execute()
        
        # Get all comparison pairs
        comparisons = supabase.table("comparison_pairs").select("*").eq("assignment_id", assignment_id).execute()
        
        # Calculate statistics
        similarity_scores = [c["similarity_score"] for c in comparisons.data if c.get("similarity_score")] if comparisons.data else []
        
        analytics = {
            "assignment_id": assignment_id,
            "assignment_name": assignment.data[0]["name"],
            "total_submissions": len(submissions.data) if submissions.data else 0,
            "total_comparisons": len(comparisons.data) if comparisons.data else 0,
            "similarity_distribution": {
                "low": sum(1 for s in similarity_scores if s < 0.3),
                "medium": sum(1 for s in similarity_scores if 0.3 <= s < 0.7),
                "high": sum(1 for s in similarity_scores if s >= 0.7)
            },
            "average_similarity": sum(similarity_scores) / len(similarity_scores) if similarity_scores else 0,
            "max_similarity": max(similarity_scores) if similarity_scores else 0,
            "min_similarity": min(similarity_scores) if similarity_scores else 0,
        }
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch analytics: {str(e)}"
        )
