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
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload files for a submission - each file creates a separate submission"""
    supabase = get_supabase()
    
    try:
        # Verify assignment exists
        assignment = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        
        if not assignment.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Process each file as a separate submission
        all_uploaded_files = []
        submissions_created = []
        
        for file in files:
            # Extract student identifier from filename (e.g., "student1.py" -> "student1")
            student_identifier = Path(file.filename).stem
            
            # Create submission for this file
            submission_data = {
                "assignment_id": assignment_id,
                "student_identifier": student_identifier,
                "file_count": 1,
                "status": "pending"
            }
            submission_result = supabase.table("submissions").insert(submission_data).execute()
            submission = submission_result.data[0]
            submissions_created.append(submission)
            
            # Read file content
            content = await file.read()
            
            # Calculate hash
            file_hash = hashlib.sha256(content).hexdigest()
            
            # Save file locally (in production, upload to cloud storage)
            upload_dir = Path(f"/tmp/submissions/{submission['id']}")
            upload_dir.mkdir(parents=True, exist_ok=True)
            
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
            all_uploaded_files.append(file_result.data[0])
            
            # Update this submission's status
            supabase.table("submissions").update({
                "file_count": 1,
                "status": "processing"
            }).eq("id", submission["id"]).execute()
        
        return {
            "submission_id": submissions_created[0]["id"] if submissions_created else None,  # Return first submission ID for compatibility
            "submissions_created": len(submissions_created),
            "files_uploaded": len(all_uploaded_files),
            "files": all_uploaded_files
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


@router.get("/{submission_id}/content")
async def get_submission_content(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the actual code content for a submission"""
    supabase = get_supabase()
    
    try:
        # Get submission
        submission_result = supabase.table("submissions").select("*").eq("id", submission_id).execute()
        
        if not submission_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        # Get associated files
        files_result = supabase.table("files").select("*").eq("submission_id", submission_id).execute()
        
        if not files_result.data:
            return {
                "submission_id": submission_id,
                "content": "",
                "files": [],
                "message": "No files found for this submission"
            }
        
        # Read file content from disk
        all_content = []
        file_details = []
        
        for file_record in files_result.data:
            file_path = Path(f"/tmp/submissions/{submission_id}/{file_record['filename']}")
            
            if file_path.exists():
                try:
                    async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = await f.read()
                        all_content.append(content)
                        file_details.append({
                            "filename": file_record['filename'],
                            "language": file_record.get('language', 'unknown'),
                            "content": content
                        })
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")
                    file_details.append({
                        "filename": file_record['filename'],
                        "language": file_record.get('language', 'unknown'),
                        "content": f"// Error reading file: {str(e)}"
                    })
            else:
                file_details.append({
                    "filename": file_record['filename'],
                    "language": file_record.get('language', 'unknown'),
                    "content": f"// File not found on disk: {file_path}"
                })
        
        # Combine all content
        combined_content = "\n\n".join(all_content) if all_content else "// No content available"
        
        return {
            "submission_id": submission_id,
            "content": combined_content,
            "files": file_details,
            "student_identifier": submission_result.data[0].get('student_identifier', 'unknown')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting submission content: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get submission content: {str(e)}"
        )
