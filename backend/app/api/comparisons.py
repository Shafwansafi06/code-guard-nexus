from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.core.database import get_supabase
from app.core.security import get_current_user
from app.schemas import (
    ComparisonPairResponse, ComparisonPairDetailed, ComparisonPairUpdate
)

router = APIRouter()


@router.get("/", response_model=List[ComparisonPairResponse])
async def list_comparisons(
    assignment_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    min_similarity: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all comparison pairs"""
    supabase = get_supabase()
    
    try:
        query = supabase.table("comparison_pairs").select("*")
        
        if assignment_id:
            query = query.eq("assignment_id", assignment_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        result = query.execute()
        
        # Filter by similarity if provided
        comparisons = result.data
        if min_similarity is not None:
            comparisons = [
                c for c in comparisons 
                if c.get("similarity_score") and c["similarity_score"] >= min_similarity
            ]
        
        # Sort by similarity score descending
        comparisons.sort(key=lambda x: x.get("similarity_score") or 0, reverse=True)
        
        return comparisons
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch comparisons: {str(e)}"
        )


@router.get("/{comparison_id}", response_model=ComparisonPairDetailed)
async def get_comparison(
    comparison_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific comparison pair by ID"""
    supabase = get_supabase()
    
    try:
        result = supabase.table("comparison_pairs").select("*").eq("id", comparison_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comparison not found"
            )
        
        comparison = result.data[0]
        
        # Get submission details
        sub_a = supabase.table("submissions").select("*").eq("id", comparison["submission_a_id"]).execute()
        sub_b = supabase.table("submissions").select("*").eq("id", comparison["submission_b_id"]).execute()
        
        return {
            **comparison,
            "submission_a": sub_a.data[0] if sub_a.data else None,
            "submission_b": sub_b.data[0] if sub_b.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch comparison: {str(e)}"
        )


@router.put("/{comparison_id}", response_model=ComparisonPairResponse)
async def update_comparison(
    comparison_id: str,
    comparison_update: ComparisonPairUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a comparison pair (used by analysis service)"""
    supabase = get_supabase()
    
    try:
        # Check if comparison exists
        existing = supabase.table("comparison_pairs").select("*").eq("id", comparison_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comparison not found"
            )
        
        # Update comparison
        update_data = comparison_update.model_dump(exclude_unset=True)
        result = supabase.table("comparison_pairs").update(update_data).eq("id", comparison_id).execute()
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update comparison: {str(e)}"
        )


@router.get("/assignment/{assignment_id}/high-risk", response_model=List[ComparisonPairDetailed])
async def get_high_risk_comparisons(
    assignment_id: str,
    threshold: float = 0.7,
    current_user: dict = Depends(get_current_user)
):
    """Get high-risk (high similarity) comparison pairs for an assignment"""
    supabase = get_supabase()
    
    try:
        result = supabase.table("comparison_pairs").select("*").eq("assignment_id", assignment_id).execute()
        
        # Filter high-risk comparisons
        high_risk = [
            c for c in result.data 
            if c.get("similarity_score") and c["similarity_score"] >= threshold
        ]
        
        # Sort by similarity score descending
        high_risk.sort(key=lambda x: x.get("similarity_score") or 0, reverse=True)
        
        # Enhance with submission details
        detailed_comparisons = []
        for comparison in high_risk:
            sub_a = supabase.table("submissions").select("*").eq("id", comparison["submission_a_id"]).execute()
            sub_b = supabase.table("submissions").select("*").eq("id", comparison["submission_b_id"]).execute()
            
            detailed_comparisons.append({
                **comparison,
                "submission_a": sub_a.data[0] if sub_a.data else None,
                "submission_b": sub_b.data[0] if sub_b.data else None
            })
        
        return detailed_comparisons
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch high-risk comparisons: {str(e)}"
        )
