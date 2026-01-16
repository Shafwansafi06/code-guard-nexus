"""
API endpoints for ML-powered code analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.inference import get_detector, CodeDetectorInference
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# Request/Response Models
class CodeAnalysisRequest(BaseModel):
    code: str
    language: str = "python"


class BatchCodeAnalysisRequest(BaseModel):
    codes: List[str]
    languages: Optional[List[str]] = None


class SimilarityRequest(BaseModel):
    code1: str
    code2: str
    language1: str = "python"
    language2: str = "python"


class AIDetectionResponse(BaseModel):
    is_ai: bool
    ai_score: float
    human_score: float
    confidence: float
    risk_level: str
    risk_description: str
    note: Optional[str] = None


class SimilarityResponse(BaseModel):
    similarity_score: float
    is_suspicious: bool
    threshold: float = 0.7


class ComprehensiveAnalysisResponse(BaseModel):
    ai_detection: dict
    language: str
    code_length: int
    risk_assessment: dict
    similarity_analysis: Optional[dict] = None


@router.post("/detect-ai", response_model=AIDetectionResponse)
async def detect_ai_generated_code(
    request: CodeAnalysisRequest
):
    """
    Detect if code is AI-generated
    
    Returns AI likelihood score and classification
    """
    try:
        detector = get_detector()
        result = detector.detect_ai(request.code, request.language)
        
        # Add risk assessment
        if result['ai_score'] >= 0.8:
            risk_level = "critical"
            risk_description = "Very high likelihood of AI-generated code"
        elif result['ai_score'] >= 0.6:
            risk_level = "high"
            risk_description = "High likelihood of AI-generated code"
        elif result['ai_score'] >= 0.4:
            risk_level = "medium"
            risk_description = "Moderate likelihood of AI-generated code"
        else:
            risk_level = "low"
            risk_description = "Likely human-written code"
        
        return AIDetectionResponse(
            is_ai=result['is_ai'],
            ai_score=result['ai_score'],
            human_score=result['human_score'],
            confidence=result['confidence'],
            risk_level=risk_level,
            risk_description=risk_description,
            note=result.get('note')
        )
    
    except Exception as e:
        logger.error(f"AI detection failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI detection failed: {str(e)}"
        )


@router.post("/compute-similarity", response_model=SimilarityResponse)
async def compute_similarity(
    request: SimilarityRequest
):
    """
    Compute similarity between two code snippets
    
    Returns similarity score (0-1) and suspicious flag
    """
    try:
        detector = get_detector()
        similarity = detector.compute_similarity(
            request.code1,
            request.code2,
            request.language1,
            request.language2
        )
        
        threshold = 0.7
        is_suspicious = similarity >= threshold
        
        return SimilarityResponse(
            similarity_score=similarity,
            is_suspicious=is_suspicious,
            threshold=threshold
        )
    
    except Exception as e:
        logger.error(f"Similarity computation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similarity computation failed: {str(e)}"
        )


@router.post("/analyze-code", response_model=ComprehensiveAnalysisResponse)
async def analyze_code(
    request: CodeAnalysisRequest
):
    """
    Comprehensive code analysis including AI detection and embeddings
    
    Returns full analysis with risk assessment
    """
    try:
        detector = get_detector()
        result = detector.comprehensive_analysis(
            request.code,
            request.language
        )
        
        return ComprehensiveAnalysisResponse(**result)
    
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/batch-analysis")
async def batch_analysis(
    request: BatchCodeAnalysisRequest
):
    """
    Batch analysis of multiple code snippets
    
    Useful for analyzing entire assignment submissions
    """
    try:
        detector = get_detector()
        results = detector.analyze_code_batch(
            request.codes,
            request.languages
        )
        
        return {
            "total_analyzed": len(results),
            "results": results,
            "summary": {
                "ai_generated_count": sum(1 for r in results if r['ai_detection']['is_ai']),
                "human_written_count": sum(1 for r in results if not r['ai_detection']['is_ai']),
                "average_ai_score": sum(r['ai_detection']['ai_score'] for r in results) / len(results)
            }
        }
    
    except Exception as e:
        logger.error(f"Batch analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch analysis failed: {str(e)}"
        )


@router.post("/find-similar")
async def find_similar_submissions(
    query_code: str,
    corpus_codes: List[str],
    top_k: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Find most similar code snippets from a corpus
    
    Useful for finding potential plagiarism cases
    """
    try:
        detector = get_detector()
        results = detector.find_similar_submissions(
            query_code,
            corpus_codes,
            top_k=top_k
        )
        
        return {
            "query_code_length": len(query_code),
            "corpus_size": len(corpus_codes),
            "top_matches": [
                {
                    "index": idx,
                    "similarity_score": score,
                    "is_suspicious": score >= 0.7
                }
                for idx, score in results
            ]
        }
    
    except Exception as e:
        logger.error(f"Similar submission search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/model-status")
async def get_model_status():
    """
    Get ML model status and information
    """
    try:
        detector = get_detector()
        
        return {
            "status": "loaded",
            "device": str(detector.device),
            "model_type": "DualHeadCodeModel",
            "capabilities": [
                "AI-generated code detection",
                "Code similarity computation",
                "Code embedding generation",
                "Batch analysis"
            ]
        }
    
    except Exception as e:
        return {
            "status": "not_loaded",
            "error": str(e),
            "message": "Model needs to be trained first. Run train_detector.py"
        }
