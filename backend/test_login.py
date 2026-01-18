#!/usr/bin/env python3
"""
Test Login - Check if auth users can log in
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase, get_supabase_admin
from dotenv import load_dotenv

load_dotenv()

TEST_EMAIL = "smith@university.edu"
TEST_PASSWORD = "password123"


def test_login():
    """Test if we can log in"""
    supabase = get_supabase()
    admin = get_supabase_admin()
    
    print("Testing login...")
    print(f"Email: {TEST_EMAIL}")
    print(f"Password: {TEST_PASSWORD}")
    print()
    
    try:
        # Try to sign in
        auth_response = supabase.auth.sign_in_with_password({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if auth_response.user and auth_response.session:
            print("✓ Login successful!")
            print(f"  User ID: {auth_response.user.id}")
            print(f"  Email: {auth_response.user.email}")
            
            # Check if user exists in custom users table
            result = admin.table("users").select("*").eq("id", auth_response.user.id).execute()
            
            if result.data:
                print(f"  Username: {result.data[0]['username']}")
                print(f"  Role: {result.data[0]['role']}")
                print()
                print("✓ Everything is working! You can now log in to the frontend.")
            else:
                print()
                print("⚠ Warning: User exists in auth but not in custom users table")
                print("  Creating user record...")
                
                # Create the user record
                from app.core.security import get_password_hash
                user_record = {
                    "id": auth_response.user.id,
                    "email": TEST_EMAIL,
                    "username": "prof_smith",
                    "password_hash": get_password_hash(TEST_PASSWORD),
                    "role": "instructor",
                    "organization_id": admin.table("organizations").select("id").limit(1).execute().data[0]["id"],
                    "is_active": True
                }
                
                admin.table("users").insert(user_record).execute()
                print("  ✓ User record created")
                print()
                print("✓ Everything is now working! You can log in to the frontend.")
        else:
            print("✗ Login failed - no user or session returned")
            
    except Exception as e:
        print(f"✗ Login failed: {e}")
        print()
        print("The user may not exist in Supabase Auth.")
        print("Attempting to create user...")
        
        try:
            admin = get_supabase_admin()
            
            # Create user through admin API
            auth_response = admin.auth.admin.create_user({
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "email_confirm": True,
            })
            
            if auth_response.user:
                print(f"✓ Created auth user: {auth_response.user.id}")
                
                # Create user record
                from app.core.security import get_password_hash
                org_id = admin.table("organizations").select("id").limit(1).execute().data[0]["id"]
                
                user_record = {
                    "id": auth_response.user.id,
                    "email": TEST_EMAIL,
                    "username": "prof_smith",
                    "password_hash": get_password_hash(TEST_PASSWORD),
                    "role": "instructor",
                    "organization_id": org_id,
                    "is_active": True
                }
                
                admin.table("users").insert(user_record).execute()
                print("✓ Created custom user record")
                print()
                print("✓ User created successfully! You can now log in.")
                
        except Exception as create_error:
            print(f"✗ Could not create user: {create_error}")


if __name__ == "__main__":
    test_login()
