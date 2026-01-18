#!/usr/bin/env python3
"""
Create all test users in custom users table
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase, get_supabase_admin
from app.core.security import get_password_hash
from dotenv import load_dotenv

load_dotenv()

USERS = [
    {"email": "smith@university.edu", "username": "prof_smith"},
    {"email": "johnson@university.edu", "username": "prof_johnson"},
    {"email": "williams@university.edu", "username": "prof_williams"},
    {"email": "brown@university.edu", "username": "prof_brown"},
    {"email": "davis@university.edu", "username": "prof_davis"},
]

PASSWORD = "password123"


def create_all_users():
    """Create all user records to match auth users"""
    supabase = get_supabase()
    admin = get_supabase_admin()
    
    print("Creating/fixing user records...")
    print()
    
    org_id = admin.table("organizations").select("id").limit(1).execute().data[0]["id"]
    created_count = 0
    
    for user_info in USERS:
        try:
            # Try to sign in to get the auth user ID
            auth_response = supabase.auth.sign_in_with_password({
                "email": user_info["email"],
                "password": PASSWORD
            })
            
            if not auth_response.user:
                print(f"✗ {user_info['email']}: Auth user doesn't exist ")
                continue
            
            user_id = auth_response.user.id
            
            # Check if custom user record exists
            result = admin.table("users").select("*").eq("id", user_id).execute()
            
            if result.data:
                print(f"✓ {user_info['email']}: Already exists")
                created_count += 1
            else:
                # Create user record
                user_record = {
                    "id": user_id,
                    "email": user_info["email"],
                    "username": user_info["username"],
                    "password_hash": get_password_hash(PASSWORD),
                    "role": "instructor",
                    "organization_id": org_id,
                    "is_active": True
                }
                
                admin.table("users").insert(user_record).execute()
                print(f"✓ {user_info['email']}: Created")
                created_count += 1
                
        except Exception as e:
            print(f"✗ {user_info['email']}: {str(e)[:50]}")
    
    print()
    print(f"✓ Complete: {created_count}/{len(USERS)} users ready")
    print()
    print("Login credentials:")
    print("  Email: smith@university.edu")
    print("  Password: password123")


if __name__ == "__main__":
    create_all_users()
