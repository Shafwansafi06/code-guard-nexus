from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from app.core.database import get_supabase
from app.core.security import get_current_user
from app.schemas import (
    SubmissionCreate, SubmissionUpdate, SubmissionResponse, 
    SubmissionWithFiles, FileCreate, FileResponse, BulkUploadResponse
)
import hashlib
import aiofiles
import os
from pathlib import Path

router = APIRouter()


@router.post("/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission: SubmissionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new submission"""
    supabase = get_supabase()
    
    try:
        # Verify assignment exists
        assignment = supabase.table("assignments").select("*").eq("id", submission.assignment_id).execute()
        
        if not assignment.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        submission_data = submission.model_dump()
        result = supabase.table("submissions").insert(submission_data).execute()
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create submission: {str(e)}"
        )


@router.post("/upload", response_model=BulkUploadResponse)
async def upload_submission_files(
    assignment_id: str = Form(...),
    student_identifier: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload files for a submission"""
    supabase = get_supabase()
    
    try:
        # Verify assignment exists
        assignment = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        
        if not assignment.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Create or get submission
        existing_submission = supabase.table("submissions").select("*").eq("assignment_id", assignment_id).eq("student_identifier", student_identifier).execute()
        
        if existing_submission.data:
            submission = existing_submission.data[0]
        else:
            submission_data = {
                "assignment_id": assignment_id,
                "student_identifier": student_identifier,
                "file_count": 0,
                "status": "pending"
            }
            submission_result = supabase.table("submissions").insert(submission_data).execute()
            submission = submission_result.data[0]
        
        # Process and upload files
        uploaded_files = []
        upload_dir = Path(f"/tmp/submissions/{submission['id']}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        for file in files:
            # Read file content
            content = await file.read()
            
            # Calculate hash
            file_hash = hashlib.sha256(content).hexdigest()
            
            # Save file locally (in production, upload to cloud storage)
            file_path = upload_dir / file.filename
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Detect language (simple detection based on extension)
            language = detect_language(file.filename)
            
            # Create file record
            file_data = {
                "submission_id": submission["id"],
                "filename": file.filename,
                "language": language,
                "file_hash": file_hash
            }
            
            file_result = supabase.table("files").insert(file_data).execute()
            uploaded_files.append(file_result.data[0])
        
        # Update submission file count
        supabase.table("submissions").update({
            "file_count": len(uploaded_files),
            "status": "processing"
        }).eq("id", submission["id"]).execute()
        
        return {
            "submission_id": submission["id"],
            "files_uploaded": len(uploaded_files),
            "files": uploaded_files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload files: {str(e)}"
        )


def detect_language(filename: str) -> str:
    """Detect programming language from filename extension"""
    extension_map = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".java": "java",
        ".cpp": "c++",
        ".c": "c",
        ".cs": "c#",
        ".rb": "ruby",
        ".go": "go",
        ".rs": "rust",
        ".php": "php",
        ".swift": "swift",
        ".kt": "kotlin",
        ".scala": "scala",
        ".r": "r",
        ".m": "matlab",
        ".sql": "sql",
        ".sh": "bash",
    }
    
    ext = Path(filename).suffix.lower()
    return extension_map.get(ext, "unknown")


@router.get("/", response_model=List[SubmissionResponse])
async def list_submissions(
    assignment_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all submissions"""
    supabase = get_supabase()
    
    try:
        query = supabase.table("submissions").select("*")
        
        if assignment_id:
            query = query.eq("assignment_id", assignment_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        result = query.execute()
        return result.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch submissions: {str(e)}"
        )


@router.get("/{submission_id}", response_model=SubmissionWithFiles)
async def get_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific submission by ID"""
    supabase = get_supabase()
    
    try:
        result = supabase.table("submissions").select("*").eq("id", submission_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        submission = result.data[0]
        
        # Get associated files
        files = supabase.table("files").select("*").eq("submission_id", submission_id).execute()
        
        return {
            **submission,
            "files": files.data if files.data else []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch submission: {str(e)}"
        )


@router.put("/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: str,
    submission_update: SubmissionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a submission"""
    supabase = get_supabase()
    
    try:
        # Check if submission exists
        existing = supabase.table("submissions").select("*").eq("id", submission_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        # Update submission
        update_data = submission_update.model_dump(exclude_unset=True)
        result = supabase.table("submissions").update(update_data).eq("id", submission_id).execute()
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update submission: {str(e)}"
        )


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a submission"""
    supabase = get_supabase()
    
    try:
        # Delete associated files first
        supabase.table("files").delete().eq("submission_id", submission_id).execute()
        
        # Delete submission
        supabase.table("submissions").delete().eq("id", submission_id).execute()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete submission: {str(e)}"
        )
