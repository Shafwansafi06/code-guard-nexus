from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.database import get_supabase
from app.core.security import get_current_user, get_password_hash, create_access_token
from app.schemas import (
    UserLogin, UserRegister, Token, UserResponse
)

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user using Supabase Auth"""
    supabase = get_supabase()
    
    try:
        # Register with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Create user record in database
        user_record = {
            "id": auth_response.user.id,
            "email": user_data.email,
            "username": user_data.username,
            "password_hash": get_password_hash(user_data.password),
            "role": user_data.role,
            "organization_id": str(user_data.organization_id) if user_data.organization_id else None,
            "is_active": True
        }
        
        result = supabase.table("users").insert(user_record).execute()
        
        return {
            "message": "User registered successfully",
            "user": result.data[0] if result.data else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    supabase = get_supabase()
    
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Fetch user details from database
        result = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = result.data[0]
        
        if not user.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Return Supabase session token
        return {
            "access_token": auth_response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
                "role": user["role"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout current user"""
    supabase = get_supabase()
    
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "username": current_user["username"],
        "role": current_user["role"],
        "organization_id": current_user.get("organization_id"),
        "is_active": current_user["is_active"],
        "created_at": current_user["created_at"]
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Refresh access token"""
    supabase = get_supabase()
    
    try:
        # Refresh the session
        refresh_response = supabase.auth.refresh_session()
        
        if not refresh_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh token"
            )
        
        return {
            "access_token": refresh_response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": current_user["id"],
                "email": current_user["email"],
                "username": current_user["username"],
                "role": current_user["role"]
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}"
        )
