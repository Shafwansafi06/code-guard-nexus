#!/usr/bin/env python3
"""
Seed Database Script
Populates the database with realistic test data for development and testing.
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# Sample data
ORGANIZATIONS = [
    {"name": "Stanford University", "subscription_tier": "premium"},
    {"name": "MIT Computer Science", "subscription_tier": "premium"},
    {"name": "Berkeley Engineering", "subscription_tier": "standard"},
]

INSTRUCTORS = [
    {"username": "prof_smith", "email": "smith@university.edu", "name": "Dr. Sarah Smith"},
    {"username": "prof_johnson", "email": "johnson@university.edu", "name": "Dr. Michael Johnson"},
    {"username": "prof_williams", "email": "williams@university.edu", "name": "Dr. Emily Williams"},
    {"username": "prof_brown", "email": "brown@university.edu", "name": "Dr. David Brown"},
    {"username": "prof_davis", "email": "davis@university.edu", "name": "Dr. Jennifer Davis"},
]

COURSES = [
    {"name": "Introduction to Python", "code": "CS101"},
    {"name": "Data Structures", "code": "CS201"},
    {"name": "Algorithms", "code": "CS301"},
    {"name": "Web Development", "code": "CS250"},
    {"name": "Machine Learning", "code": "CS401"},
    {"name": "Database Systems", "code": "CS305"},
]

ASSIGNMENTS = [
    "Binary Search Implementation",
    "Sorting Algorithms",
    "Web Scraper Project",
    "REST API Development",
    "Neural Network Basics",
    "SQL Query Optimization",
    "Tree Traversal",
    "Hash Table Implementation",
]

SEMESTERS = ["Fall 2025", "Spring 2026"]

PROGRAMMING_LANGUAGES = ["python", "java", "cpp", "javascript", "typescript"]

# Sample code snippets for different patterns
CODE_TEMPLATES = {
    "python": [
        """def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

def main():
    data = [1, 2, 3, 4, 5]
    result = calculate_sum(data)
    print(f"Sum: {result}")
""",
        """class BinarySearch:
    def search(self, arr, target):
        left, right = 0, len(arr) - 1
        
        while left <= right:
            mid = (left + right) // 2
            if arr[mid] == target:
                return mid
            elif arr[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1
""",
        """def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

# Test the function
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = bubble_sort(numbers)
print(sorted_numbers)
""",
    ],
    "java": [
        """public class Calculator {
    public int sum(int[] numbers) {
        int total = 0;
        for (int num : numbers) {
            total += num;
        }
        return total;
    }
    
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        int[] data = {1, 2, 3, 4, 5};
        System.out.println("Sum: " + calc.sum(data));
    }
}
""",
    ],
}


def generate_student_identifier():
    """Generate a realistic student identifier"""
    first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", 
                   "Ivy", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Peter", "Quinn", 
                   "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xavier", "Yara", "Zoe"]
    last_names = ["Anderson", "Bennett", "Carter", "Davis", "Evans", "Foster", "Garcia", 
                  "Harris", "Ibrahim", "Jackson", "Kim", "Lopez", "Martinez", "Nelson", 
                  "O'Brien", "Patel", "Quinn", "Rodriguez", "Smith", "Taylor", "Usman", 
                  "Vazquez", "Wilson", "Xu", "Young", "Zhang"]
    
    first = random.choice(first_names)
    last = random.choice(last_names)
    return f"{first.lower()}_{last.lower()}"


def generate_filename(language, assignment_name):
    """Generate a realistic filename"""
    extensions = {
        "python": ".py",
        "java": ".java",
        "cpp": ".cpp",
        "javascript": ".js",
        "typescript": ".ts",
    }
    
    base_names = ["solution", "main", "program", "assignment", assignment_name.lower().replace(" ", "_")]
    return random.choice(base_names) + extensions.get(language, ".txt")


def clear_database():
    """Clear all existing data"""
    supabase = get_supabase()
    
    print("Clearing existing data...")
    
    # Delete in reverse order of dependencies
    tables = [
        "analysis_results",
        "comparison_pairs",
        "files",
        "submissions",
        "assignments",
        "courses",
        "users",
        "organizations",
    ]
    
    for table in tables:
        try:
            supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            print(f"✓ Cleared {table}")
        except Exception as e:
            print(f"✗ Error clearing {table}: {e}")


def seed_organizations():
    """Seed organizations"""
    supabase = get_supabase()
    print("\nSeeding organizations...")
    
    org_ids = []
    for org_data in ORGANIZATIONS:
        result = supabase.table("organizations").insert(org_data).execute()
        org_id = result.data[0]["id"]
        org_ids.append(org_id)
        print(f"✓ Created organization: {org_data['name']} ({org_id})")
    
    return org_ids


def seed_users(org_ids):
    """Seed users (instructors)"""
    supabase = get_supabase()
    print("\nSeeding users...")
    
    user_ids = []
    for instructor in INSTRUCTORS:
        user_data = {
            "username": instructor["username"],
            "email": instructor["email"],
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYPdKq.vbqG",  # "password123"
            "role": "instructor",
            "organization_id": random.choice(org_ids),
        }
        
        result = supabase.table("users").insert(user_data).execute()
        user_id = result.data[0]["id"]
        user_ids.append(user_id)
        print(f"✓ Created user: {instructor['username']} ({user_id})")
    
    return user_ids


def seed_courses(user_ids):
    """Seed courses"""
    supabase = get_supabase()
    print("\nSeeding courses...")
    
    course_ids = []
    for course in COURSES:
        course_data = {
            "name": course["name"],
            "code": course["code"],
            "instructor_id": random.choice(user_ids),
            "semester": random.choice(SEMESTERS),
        }
        
        result = supabase.table("courses").insert(course_data).execute()
        course_id = result.data[0]["id"]
        course_ids.append(course_id)
        print(f"✓ Created course: {course['name']} ({course_id})")
    
    return course_ids


def seed_assignments(course_ids):
    """Seed assignments"""
    supabase = get_supabase()
    print("\nSeeding assignments...")
    
    assignment_ids = []
    statuses = ["active", "active", "active", "completed", "draft"]
    
    for course_id in course_ids:
        num_assignments = random.randint(2, 4)
        
        for i in range(num_assignments):
            assignment_data = {
                "name": random.choice(ASSIGNMENTS),
                "course_id": course_id,
                "due_date": (datetime.now() + timedelta(days=random.randint(-30, 30))).isoformat(),
                "status": random.choice(statuses),
                "settings": {
                    "similarity_threshold": 0.7,
                    "ai_detection_enabled": True,
                },
            }
            
            result = supabase.table("assignments").insert(assignment_data).execute()
            assignment_id = result.data[0]["id"]
            assignment_ids.append(assignment_id)
            print(f"✓ Created assignment: {assignment_data['name']} ({assignment_id})")
    
    return assignment_ids


def seed_submissions_and_files(assignment_ids):
    """Seed submissions and associated files"""
    supabase = get_supabase()
    print("\nSeeding submissions and files...")
    
    submission_ids = []
    
    for assignment_id in assignment_ids:
        num_students = random.randint(8, 12)  # Reduced from 15-25
        
        for _ in range(num_students):
            try:
                student_id = generate_student_identifier()
                num_files = random.randint(1, 2)  # Reduced from 1-3
                
                submission_data = {
                    "assignment_id": assignment_id,
                    "student_identifier": student_id,
                    "file_count": num_files,
                    "status": random.choice(["completed", "completed", "pending"]),
                    "submission_time": (datetime.now() - timedelta(days=random.randint(0, 20))).isoformat(),
                }
                
                result = supabase.table("submissions").insert(submission_data).execute()
                submission = result.data[0]
                submission_ids.append(submission["id"])
                
                # Create files for this submission
                for i in range(num_files):
                    language = random.choice(PROGRAMMING_LANGUAGES)
                    filename = generate_filename(language, f"file_{i}")
                    
                    file_data = {
                        "submission_id": submission["id"],
                        "filename": filename,
                        "language": language,
                        "file_hash": f"hash_{random.randint(100000, 999999)}",
                    }
                    
                    try:
                        supabase.table("files").insert(file_data).execute()
                    except Exception as e:
                        print(f"  Warning: Could not create file: {e}")
                        continue
                        
            except Exception as e:
                print(f"  Warning: Could not create submission: {e}")
                continue
            
        print(f"✓ Created submissions for assignment {assignment_id[:8]}...")
    
    print(f"Total submissions created: {len(submission_ids)}")
    return submission_ids


def seed_comparison_pairs(assignment_ids):
    """Seed comparison pairs"""
    supabase = get_supabase()
    print("\nSeeding comparison pairs...")
    
    total_pairs = 0
    
    for assignment_id in assignment_ids:
        # Get submissions for this assignment
        result = supabase.table("submissions").select("id").eq("assignment_id", assignment_id).execute()
        submissions = result.data
        
        if len(submissions) < 2:
            continue
        
        # Create comparison pairs for a subset of submissions
        num_pairs = random.randint(10, min(30, len(submissions) * 2))
        
        for _ in range(num_pairs):
            sub_a = random.choice(submissions)
            sub_b = random.choice(submissions)
            
            if sub_a["id"] == sub_b["id"]:
                continue
            
            # Generate similarity score with clustering around certain values
            score_type = random.choice(["high", "medium", "low", "low", "low"])
            if score_type == "high":
                similarity = random.uniform(0.75, 0.98)
            elif score_type == "medium":
                similarity = random.uniform(0.5, 0.74)
            else:
                similarity = random.uniform(0.1, 0.49)
            
            pair_data = {
                "assignment_id": assignment_id,
                "submission_a_id": sub_a["id"],
                "submission_b_id": sub_b["id"],
                "similarity_score": round(similarity, 2),
                "status": "completed",
            }
            
            try:
                supabase.table("comparison_pairs").insert(pair_data).execute()
                total_pairs += 1
            except:
                # Skip duplicates
                pass
        
        print(f"✓ Created comparison pairs for assignment {assignment_id}")
    
    print(f"Total comparison pairs created: {total_pairs}")


def seed_analysis_results(submission_ids):
    """Seed analysis results"""
    supabase = get_supabase()
    print("\nSeeding analysis results...")
    
    for submission_id in submission_ids:
        # Generate AI detection score
        ai_score_type = random.choice(["low", "low", "low", "medium", "high"])
        if ai_score_type == "high":
            ai_score = random.uniform(0.75, 0.95)
            risk_level = "high"
        elif ai_score_type == "medium":
            ai_score = random.uniform(0.4, 0.74)
            risk_level = "medium"
        else:
            ai_score = random.uniform(0.05, 0.39)
            risk_level = "low"
        
        analysis_data = {
            "submission_id": submission_id,
            "overall_similarity": round(random.uniform(0.1, 0.8), 2),
            "ai_detection_score": round(ai_score, 2),
            "risk_level": risk_level,
            "detailed_results": {
                "patterns_detected": random.choice([True, False]),
                "confidence": round(random.uniform(0.6, 0.95), 2),
                "flags": random.sample(["variable_naming", "code_structure", "comments", "imports"], k=random.randint(0, 3)),
            },
        }
        
        supabase.table("analysis_results").insert(analysis_data).execute()
    
    print(f"✓ Created {len(submission_ids)} analysis results")


def main():
    """Main seeding function"""
    print("=" * 60)
    print("DATABASE SEED SCRIPT")
    print("=" * 60)
    
    try:
        # Clear existing data
        response = input("\nClear existing data? (y/n): ")
        if response.lower() == 'y':
            clear_database()
        
        # Seed data in order
        org_ids = seed_organizations()
        user_ids = seed_users(org_ids)
        course_ids = seed_courses(user_ids)
        assignment_ids = seed_assignments(course_ids)
        submission_ids = seed_submissions_and_files(assignment_ids)
        seed_comparison_pairs(assignment_ids)
        seed_analysis_results(submission_ids)
        
        print("\n" + "=" * 60)
        print("✓ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  Organizations: {len(org_ids)}")
        print(f"  Users: {len(user_ids)}")
        print(f"  Courses: {len(course_ids)}")
        print(f"  Assignments: {len(assignment_ids)}")
        print(f"  Submissions: {len(submission_ids)}")
        
    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
