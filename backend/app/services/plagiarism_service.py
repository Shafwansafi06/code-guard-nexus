"""
Service for performing plagiarism and AI detection analysis on assignments
"""

import logging
import os
from typing import List, Dict, Any
from pathlib import Path
import numpy as np
from app.core.database import get_supabase
from app.services.hf_api_client import get_hf_client
from app.services.winnowing import winnowing_service
from app.services.advanced_ai_detector import get_advanced_detector
import asyncio

logger = logging.getLogger(__name__)

class PlagiarismService:
    def __init__(self):
        self.supabase = get_supabase()
        self.hf_client = get_hf_client()
        self.ai_detector = get_advanced_detector()
        self.winnowing = winnowing_service

    async def run_assignment_analysis(self, assignment_id: str):
        """
        Run comprehensive analysis on all submissions for an assignment
        """
        logger.info(f"Starting analysis for assignment {assignment_id}")
        
        try:
            # 1. Get all submissions and their files
            submissions_result = self.supabase.table("submissions").select("*, files(*)").eq("assignment_id", assignment_id).execute()
            submissions = submissions_result.data
            
            if len(submissions) < 2:
                logger.info(f"Only {len(submissions)} submission(s) for assignment {assignment_id}. comparison will be skipped, but AI detection will run.")

            # 2. Update status to processing
            self.supabase.table("assignments").update({"status": "processing"}).eq("id", assignment_id).execute()
            for sub in submissions:
                self.supabase.table("submissions").update({"status": "processing"}).eq("id", sub["id"]).execute()

            # 3. Analyze each submission for AI detection
            submission_embeddings = {}
            submission_fingerprints = {}
            
            for sub in submissions:
                all_code_for_sub = []
                all_fingerprints_for_sub = set()
                
                for file in sub.get("files", []):
                    # Read file content from local storage (as per submissions.py)
                    file_path = Path(f"/tmp/submissions/{sub['id']}/{file['filename']}")
                    if file_path.exists():
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                code = f.read()
                                all_code_for_sub.append(code)
                                
                                # Winnowing fingerprints for the file
                                file_fingerprints = self.winnowing.get_fingerprints(code)
                                all_fingerprints_for_sub.update(file_fingerprints)
                                
                                # Perform individual file AI detection
                                ai_result = self.ai_detector.detect(code, file.get("language", "python"))
                                
                                # Store analysis results
                                analysis_data = {
                                    "submission_id": sub["id"],
                                    "ai_detection_score": ai_result["ai_score"],
                                    "risk_level": self._get_risk_level(ai_result["ai_score"]),
                                    "detailed_results": {
                                        "filename": file["filename"],
                                        "is_ai": ai_result["is_ai"],
                                        "confidence": ai_result["confidence"],
                                        "fingerprint_count": len(file_fingerprints)
                                    }
                                }
                                self.supabase.table("analysis_results").insert(analysis_data).execute()
                        except Exception as e:
                            logger.error(f"Failed to read/analyze file {file['filename']}: {e}")
                
                # Store fingerprints for the entire submission
                submission_fingerprints[sub["id"]] = all_fingerprints_for_sub

            # 4. Compare submissions using HuggingFace API (Code Clone Detection)
            for i, sub_a in enumerate(submissions):
                for sub_b in submissions[i+1:]:
                    # Get all code from both submissions
                    code_a = "\n\n".join(all_code_for_sub) if sub_a["id"] in submission_embeddings else ""
                    code_b = "\n\n".join(all_code_for_sub) if sub_b["id"] in submission_embeddings else ""
                    
                    # Initialize scores
                    ml_similarity = 0.0
                    winnowing_similarity = 0.0
                    
                    # Compute ML-based similarity using HuggingFace API
                    if code_a and code_b:
                        try:
                            result = await self.hf_client.predict(code_a, code_b, threshold=0.5)
                            ml_similarity = result.get("similarity_score", 0.0)
                        except Exception as e:
                            logger.error(f"HuggingFace API call failed: {e}")
                    
                    # Compute Winnowing Similarity
                    if sub_a["id"] in submission_fingerprints and sub_b["id"] in submission_fingerprints:
                        winnowing_similarity = self.winnowing.compute_similarity(
                            submission_fingerprints[sub_a["id"]],
                            submission_fingerprints[sub_b["id"]]
                        )
                        
                    # Combined Similarity Score (Winnowing + ML model)
                    combined_similarity = max(
                        (ml_similarity * 0.5) + (winnowing_similarity * 0.5),
                        winnowing_similarity
                    )
                        
                    # Update comparison_pairs
                    self.supabase.table("comparison_pairs").update({
                        "similarity_score": min(combined_similarity, 1.0),
                        "status": "completed"  
                    }).eq("assignment_id", assignment_id).eq("submission_a_id", sub_a["id"]).eq("submission_b_id", sub_b["id"]).execute()

            # 5. Finalize status
            self.supabase.table("assignments").update({"status": "completed"}).eq("id", assignment_id).execute()
            for sub in submissions:
                self.supabase.table("submissions").update({"status": "completed"}).eq("id", sub["id"]).execute()
            
            logger.info(f"Analysis completed for assignment {assignment_id}")

        except Exception as e:
            logger.error(f"Analysis failed for assignment {assignment_id}: {e}")
            self.supabase.table("assignments").update({"status": "failed"}).eq("id", assignment_id).execute()

    def _get_risk_level(self, ai_score: float) -> str:
        if ai_score >= 0.8: return "critical"
        if ai_score >= 0.6: return "high"
        if ai_score >= 0.4: return "medium"
        return "low"

# Singleton instance
plagiarism_service = PlagiarismService()
