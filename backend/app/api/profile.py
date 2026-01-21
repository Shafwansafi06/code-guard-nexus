"""
Profile API Routes
Endpoints for user profile and onboarding
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from app.schemas.profile import ProfileSetup, ProfileUpdate, ProfileResponse
from app.core.database import get_supabase_admin
from app.core.security import get_current_user

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    try:
        supabase = get_supabase_admin()
        
        # Fetch user data
        result = supabase.table('users').select('*').eq('id', current_user['id']).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        user_data = result.data[0]
        
        return ProfileResponse(
            user_id=user_data['id'],
            email=user_data['email'],
            username=user_data['username'],
            full_name=user_data.get('full_name'),
            subject=user_data.get('subject'),
            student_count=user_data.get('student_count'),
            expected_submissions=user_data.get('expected_submissions'),
            institution=user_data.get('institution'),
            onboarding_completed=user_data.get('onboarding_completed', False),
            created_at=user_data['created_at']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}"
        )


@router.post("/setup", response_model=ProfileResponse)
async def setup_profile(
    profile_data: ProfileSetup,
    current_user: dict = Depends(get_current_user)
):
    """Complete onboarding profile setup"""
    try:
        supabase = get_supabase_admin()
        
        # Update user profile
        update_data = {
            'full_name': profile_data.full_name,
            'subject': profile_data.subject,
            'student_count': profile_data.student_count,
            'expected_submissions': profile_data.expected_submissions,
            'onboarding_completed': True
        }
        
        if profile_data.institution:
            update_data['institution'] = profile_data.institution
        
        result = supabase.table('users').update(update_data).eq('id', current_user['id']).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = result.data[0]
        
        return ProfileResponse(
            user_id=user_data['id'],
            email=user_data['email'],
            username=user_data['username'],
            full_name=user_data.get('full_name'),
            subject=user_data.get('subject'),
            student_count=user_data.get('student_count'),
            expected_submissions=user_data.get('expected_submissions'),
            institution=user_data.get('institution'),
            onboarding_completed=user_data.get('onboarding_completed', False),
            created_at=user_data['created_at']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting up profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to setup profile: {str(e)}"
        )


@router.put("/update", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    try:
        supabase = get_supabase_admin()
        
        # Build update dict with only provided fields
        update_data = {}
        if profile_data.full_name is not None:
            update_data['full_name'] = profile_data.full_name
        if profile_data.subject is not None:
            update_data['subject'] = profile_data.subject
        if profile_data.student_count is not None:
            update_data['student_count'] = profile_data.student_count
        if profile_data.expected_submissions is not None:
            update_data['expected_submissions'] = profile_data.expected_submissions
        if profile_data.institution is not None:
            update_data['institution'] = profile_data.institution
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = supabase.table('users').update(update_data).eq('id', current_user['id']).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = result.data[0]
        
        return ProfileResponse(
            user_id=user_data['id'],
            email=user_data['email'],
            username=user_data['username'],
            full_name=user_data.get('full_name'),
            subject=user_data.get('subject'),
            student_count=user_data.get('student_count'),
            expected_submissions=user_data.get('expected_submissions'),
            institution=user_data.get('institution'),
            onboarding_completed=user_data.get('onboarding_completed', False),
            created_at=user_data['created_at']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )
