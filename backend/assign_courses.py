#!/usr/bin/env python3
"""
Assign courses to Smith
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase
from dotenv import load_dotenv

load_dotenv()

def assign_courses_to_smith():
    supabase = get_supabase()
    
    # Smith's ID from previous run
    smith_id = "51eddede-65bf-4e99-b3a5-aa817c321960"
    
    print(f"Assigning courses to prof_smith ({smith_id})...")
    
    # Get all courses
    courses = supabase.table("courses").select("*").execute()
    
    if not courses.data:
        print("No courses found!")
        return
        
    print(f"Found {len(courses.data)} courses.")
    
    # Assign the first 3 courses to Smith
    for course in courses.data[:3]:
        print(f"Assigning '{course['name']}' to Smith...")
        supabase.table("courses").update({"instructor_id": smith_id}).eq("id", course["id"]).execute()
        
    print("Done!")

if __name__ == "__main__":
    assign_courses_to_smith()
