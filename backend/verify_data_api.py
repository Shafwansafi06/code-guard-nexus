#!/usr/bin/env python3
"""
Verify API data for logged in user (smith@university.edu)
"""

import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase
from dotenv import load_dotenv

load_dotenv()

def verify_data():
    supabase = get_supabase()
    
    print("Verifying data for smith@university.edu...")
    
    # 1. Get user ID
    user_email = "smith@university.edu"
    response = supabase.auth.sign_in_with_password({
        "email": user_email,
        "password": "password123"
    })
    
    if not response.user:
        print("✗ Login failed")
        return
        
    user_id = response.user.id
    print(f"✓ User ID: {user_id}")
    
    # 2. Get Courses
    print("\nFetching courses...")
    courses = supabase.table("courses").select("*").eq("instructor_id", user_id).execute()
    
    if courses.data:
        print(f"✓ Found {len(courses.data)} courses:")
        for c in courses.data:
            print(f"  - {c['name']} ({c['code']})")
    else:
        print("⚠ No courses found for this user. This might explain empty courses section.")
        # Let's check if there are ANY courses
        all_courses = supabase.table("courses").select("*").execute()
        print(f"  (Total courses in DB: {len(all_courses.data)})")
    
    # 3. Get Assignments
    print("\nFetching assignments...")
    # Simulate the API logic: fetch assignments and join with courses
    assignments = supabase.table("assignments").select("*, courses(name)").execute()
    
    if assignments.data:
        print(f"✓ Found {len(assignments.data)} assignments.")
        
        # Check course_name
        has_course_name = False
        for a in assignments.data[:3]:
            course_name = a.get("courses", {}).get("name") if a.get("courses") else None
            print(f"  - {a['name']}")
            print(f"    Course Name (from join): {course_name}")
            if course_name:
                has_course_name = True
                
        if has_course_name:
            print("✓ Course name populated correctly via join")
        else:
            print("✗ Course name missing from join")
            
    else:
        print("⚠ No assignments found")

if __name__ == "__main__":
    verify_data()
