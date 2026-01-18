#!/usr/bin/env python3
"""
Fix Auth - Clean and Re-register Users
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase_admin
from app.core.security import get_password_hash
from dotenv import load_dotenv

load_dotenv()

# User credentials to register
USERS_TO_REGISTER = [
    {"email": "smith@university.edu", "password": "password123", "username": "prof_smith", "role": "instructor"},
    {"email": "johnson@university.edu", "password": "password123", "username": "prof_johnson", "role": "instructor"},
    {"email": "williams@university.edu", "password": "password123", "username": "prof_williams", "role": "instructor"},
    {"email": "brown@university.edu", "password": "password123", "username": "prof_brown", "role": "instructor"},
    {"email": "davis@university.edu", "password": "password123", "username": "prof_davis", "role": "instructor"},
]


def fix_auth_users():
    """Delete old users and re-register through Supabase Auth"""
    supabase = get_supabase_admin()
    
    print("=" * 60)
    print("FIX AUTH USERS")
    print("=" * 60)
    print()
    
    # Step 1: Delete existing users from custom table
    print("Step 1: Removing old user records...")
    for user_data in USERS_TO_REGISTER:
        try:
            supabase.table("users").delete().eq("email", user_data["email"]).execute()
            print(f"  ✓ Deleted {user_data['email']}")
        except Exception as e:
            print(f"  - {user_data['email']} (not found or error)")
    
    print()
    
    # Step 2: Register users through Supabase Auth
    print("Step 2: Registering users through Supabase Auth...")
    registered_count = 0
    
    # Get first organization ID
    orgs = supabase.table("organizations").select("id").limit(1).execute()
    org_id = orgs.data[0]["id"] if orgs.data else None
    
    for user_data in USERS_TO_REGISTER:
        try:
            print(f"  {user_data['email']}...", end=" ")
            
            # Register with Supabase Auth
            auth_response = supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True,  # Auto-confirm
            })
            
            if not auth_response.user:
                print("✗ Failed")
                continue
            
            # Create user record in custom users table
            user_record = {
                "id": auth_response.user.id,
                "email": user_data["email"],
                "username": user_data["username"],
                "password_hash": get_password_hash(user_data["password"]),
                "role": user_data["role"],
                "organization_id": org_id,
                "is_active": True
            }
            
            supabase.table("users").insert(user_record).execute()
            
            print("✓")
            registered_count += 1
            
        except Exception as e:
            print(f"✗ Error: {str(e)[:50]}")
            continue
    
    print()
    print("=" * 60)
    print(f"✓ COMPLETE: {registered_count}/{len(USERS_TO_REGISTER)} users registered")
    print("=" * 60)
    print()
    print("🔐 Test Login Credentials:")
    print("  Email: smith@university.edu")
    print("  Password: password123")
    print()


if __name__ == "__main__":
    fix_auth_users()
