from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.database import get_supabase, get_supabase_admin
from app.core.security import get_current_user, get_password_hash, create_access_token
from app.schemas import (
    UserLogin, UserRegister, Token, UserResponse
)
from pydantic import BaseModel, EmailStr

router = APIRouter()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


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
        
        # Automatically confirm the user using admin client (to skip email confirmation step)
        admin_supabase = get_supabase_admin()
        try:
            admin_supabase.auth.admin.update_user_by_id(
                auth_response.user.id,
                {"email_confirm": True}
            )
        except Exception:
            # Not critical if this fails, may be already confirmed or setting disabled
            pass
        
        # Create user record in database using admin client to bypass RLS
        admin_supabase = get_supabase_admin()
        user_record = {
            "id": auth_response.user.id,
            "email": user_data.email,
            "username": user_data.username,
            "password_hash": get_password_hash(user_data.password),
            "role": user_data.role,
            "organization_id": str(user_data.organization_id) if user_data.organization_id else None,
            "is_active": True
        }
        
        result = admin_supabase.table("users").insert(user_record).execute()
        
        return {
            "message": "User registered successfully",
            "user": result.data[0] if result.data else None
        }
        
    except Exception as e:
        print(f"DEBUG REGISTER: EXCEPTION: {str(e)}")
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
        
        # Fetch user details from database using admin client
        admin_supabase = get_supabase_admin()
        result = admin_supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User record not found in database"
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


@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str):
    """Get user by ID (for OAuth callback validation)"""
    admin_supabase = get_supabase_admin()
    
    try:
        result = admin_supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = result.data[0]
        return {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "role": user["role"],
            "organization_id": user.get("organization_id"),
            "is_active": user["is_active"],
            "created_at": user["created_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )


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


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email via Supabase"""
    supabase = get_supabase()
    
    try:
        # Send password reset email using Supabase Auth
        supabase.auth.reset_password_email(request.email)
        
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }
    except Exception as e:
        # Don't reveal if email exists or not (security best practice)
        print(f"Password reset error: {e}")
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using OTP code"""
    supabase = get_supabase()
    
    try:
        # Verify OTP and update password
        auth_response = supabase.auth.verify_otp({
            "email": request.email,
            "token": request.otp,
            "type": "recovery"
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code"
            )
        
        # Update the password
        supabase.auth.update_user({
            "password": request.new_password
        })
        
        # Update password hash in database
        admin_supabase = get_supabase_admin()
        admin_supabase.table("users").update({
            "password_hash": get_password_hash(request.new_password)
        }).eq("email", request.email).execute()
        
        return {
            "message": "Password reset successfully. You can now login with your new password."
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password reset failed: {str(e)}"
        )
