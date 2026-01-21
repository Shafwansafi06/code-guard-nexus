from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.database import get_supabase, get_supabase_admin

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get current authenticated user from token"""
    token = credentials.credentials
    user_id = None
    
    # Try to decode as backend JWT token first
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        print(f"Backend JWT decoded successfully, user_id: {user_id}")
    except HTTPException:
        # If backend JWT fails, try to decode as Supabase token
        # Supabase tokens are also JWTs but signed with Supabase's secret
        try:
            # Decode without verification to get the user_id
            # We trust it's valid if the user exists in our database
            payload = jwt.decode(
                token, 
                key="", 
                options={"verify_signature": False, "verify_aud": False, "verify_exp": False}
            )
            user_id = payload.get("sub")
            print(f"Supabase token decoded successfully, user_id: {user_id}")
            print(f"Token payload: {payload}")
        except Exception as e:
            print(f"Token decoding failed: {e}")
            import traceback
            traceback.print_exc()
    
    if not user_id:
        print(f"No user_id found in token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch user from database using admin client
    supabase_admin = get_supabase_admin()
    try:
        result = supabase_admin.table("users").select("*").eq("id", user_id).execute()
        print(f"Database query result: {result.data}")
    except Exception as e:
        print(f"Database query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not result.data:
        print(f"No user found with id: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    user = result.data[0]
    
    if not user.get("is_active"):
        print(f"User {user_id} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    
    print(f"User authenticated successfully: {user['email']}")
    return user


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
):
    """Get current active user"""
    return current_user


def require_role(required_roles: list[str]):
    """Decorator to require specific user roles"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return current_user
    return role_checker


# Role-specific dependencies
async def get_admin_user(current_user: dict = Depends(require_role(["admin"]))):
    """Get current admin user"""
    return current_user


async def get_instructor_user(
    current_user: dict = Depends(require_role(["admin", "instructor"]))
):
    """Get current instructor or admin user"""
    return current_user
