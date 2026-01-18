#!/usr/bin/env python3
"""
Register Seed Users through Supabase Auth
Creates users properly in Supabase Auth system
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase, get_supabase_admin
from dotenv import load_dotenv

load_dotenv()

# User credentials to register
USERS_TO_REGISTER = [
    {
        "email": "smith@university.edu",
        "password": "password123",
        "username": "prof_smith",
        "role": "instructor"
    },
    {
        "email": "johnson@university.edu",
        "password": "password123",
        "username": "prof_johnson",
        "role": "instructor"
    },
    {
        "email": "williams@university.edu",
        "password": "password123",
        "username": "prof_williams",
        "role": "instructor"
    },
    {
        "email": "brown@university.edu",
        "password": "password123",
        "username": "prof_brown",
        "role": "instructor"
    },
    {
        "email": "davis@university.edu",
        "password": "password123",
        "username": "prof_davis",
        "role": "instructor"
    },
]


def register_auth_users():
    """Register users through Supabase Auth"""
    supabase = get_supabase()
    admin_supabase = get_supabase_admin()
    
    print("=" * 60)
    print("REGISTERING USERS THROUGH SUPABASE AUTH")
    print("=" * 60)
    print()
    
    registered_count = 0
    
    for user_data in USERS_TO_REGISTER:
        try:
            print(f"Registering: {user_data['email']}...", end=" ")
            
            # Check if user already exists in auth.users
            try:
                # Try to sign in first to check if exists
                test_response = supabase.auth.sign_in_with_password({
                    "email": user_data["email"],
                    "password": user_data["password"]
                })
                
                if test_response.user:
                    print("✓ Already exists and can log in")
                    registered_count += 1
                    continue
                    
            except Exception:
                # User doesn't exist or password wrong, continue with registration
                pass
            
            # Register with Supabase Auth
            auth_response = supabase.auth.sign_up({
                "email": user_data["email"],
                "password": user_data["password"],
            })
            
            if not auth_response.user:
                print("✗ Failed to create auth user")
                continue
            
            # Auto-confirm the user (skip email verification)
            try:
                admin_supabase.auth.admin.update_user_by_id(
                    auth_response.user.id,
                    {"email_confirm": True}
                )
            except Exception as e:
                print(f"Warning: Could not auto-confirm: {e}")
            
            # Get organization for this user
            existing_users = admin_supabase.table("users").select("organization_id").eq("email", user_data["email"]).execute()
            org_id = existing_users.data[0]["organization_id"] if existing_users.data else None
            
            # Update or create user record in custom users table
            from app.core.security import get_password_hash
            user_record = {
                "id": auth_response.user.id,
                "email": user_data["email"],
                "username": user_data["username"],
                "password_hash": get_password_hash(user_data["password"]),
                "role": user_data["role"],
                "organization_id": org_id,
                "is_active": True
            }
            
            # Try to update first, if not exists then insert
            try:
                admin_supabase.table("users").upsert(user_record).execute()
            except:
                admin_supabase.table("users").insert(user_record).execute()
            
            print("✓ Registered successfully")
            registered_count += 1
            
        except Exception as e:
            print(f"✗ Error: {e}")
            continue
    
    print()
    print("=" * 60)
    print(f"✓ REGISTRATION COMPLETE: {registered_count}/{len(USERS_TO_REGISTER)}")
    print("=" * 60)
    print()
    print("You can now log in with:")
    print("  Email: smith@university.edu")
    print("  Password: password123")
    print()


if __name__ == "__main__":
    register_auth_users()
