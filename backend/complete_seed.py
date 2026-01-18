#!/usr/bin/env python3
"""
Complete Seed Data - Add comparison pairs and analysis results
"""

import sys
import random
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import get_supabase
from dotenv import load_dotenv

load_dotenv()


def seed_comparison_pairs():
    """Seed comparison pairs for existing assignments"""
    supabase = get_supabase()
    print("\nSeeding comparison pairs...")
    
    # Get all assignments
    assignments = supabase.table("assignments").select("id").execute().data
    
    total_pairs = 0
    
    for assignment in assignments:
        assignment_id = assignment["id"]
        
        # Get submissions for this assignment
        result = supabase.table("submissions").select("id").eq("assignment_id", assignment_id).execute()
        submissions = result.data
        
        if len(submissions) < 2:
            continue
        
        # Create some comparison pairs
        num_pairs = min(15, len(submissions) * 2)
        
        for _ in range(num_pairs):
            sub_a = random.choice(submissions)
            sub_b = random.choice(submissions)
            
            if sub_a["id"] == sub_b["id"]:
                continue
            
            # Generate similarity score
            score_type = random.choice(["high", "medium", "low", "low"])
            if score_type == "high":
                similarity = random.uniform(0.75, 0.95)
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
                pass 
        
        print(f"✓ Created pairs for assignment {assignment_id[:8]}...")
    
    print(f"Total comparison pairs: {total_pairs}")
    return total_pairs


def seed_analysis_results():
    """Seed analysis results for existing submissions"""
    supabase = get_supabase()
    print("\nSeeding analysis results...")
    
    # Get all submissions
    submissions = supabase.table("submissions").select("id").execute().data
    
    count = 0
    for submission in submissions:
        # Generate AI detection score
        ai_score_type = random.choice(["low", "low", "medium", "high"])
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
            "submission_id": submission["id"],
            "overall_similarity": round(random.uniform(0.1, 0.8), 2),
            "ai_detection_score": round(ai_score, 2),
            "risk_level": risk_level,
            "detailed_results": {
                "patterns_detected": random.choice([True, False]),
                "confidence": round(random.uniform(0.6, 0.95), 2),
            },
        }
        
        try:
            supabase.table("analysis_results").insert(analysis_data).execute()
            count += 1
        except:
            pass
    
    print(f"Total analysis results: {count}")
    return count


def main():
    print("=" * 60)
    print("COMPLETING DATABASE SEED DATA")
    print("=" * 60)
    
    try:
        pairs = seed_comparison_pairs()
        results = seed_analysis_results()
        
        print("\n" + "=" * 60)
        print("✓ SEED COMPLETION SUCCESSFUL!")
        print("=" * 60)
        print(f"\nCreated:")
        print(f"  Comparison Pairs: {pairs}")
        print(f"  Analysis Results: {results}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
