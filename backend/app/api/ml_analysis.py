"""
API endpoints for ML-powered code analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from typing import List, Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.hf_api_client import get_hf_client
from app.services.advanced_ai_detector import get_advanced_detector
from app.services.clone_detector import get_clone_detector, CloneDetectionService
from app.services.onnx_clone_detector import get_onnx_detector, ONNXCloneDetector, ONNX_AVAILABLE
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


class CloneDetectionRequest(BaseModel):
    code1: str
    code2: str
    threshold: float = 0.5


class CloneDetectionResponse(BaseModel):
    is_clone: bool
    clone_probability: float
    non_clone_probability: float
    confidence: float
    similarity_score: float
    risk_level: str
    risk_description: str
    threshold: float


class BatchCloneRequest(BaseModel):
    codes: List[str]
    threshold: float = 0.6


class FindSimilarRequest(BaseModel):
    target_code: str
    candidate_codes: List[str]
    threshold: float = 0.6
    top_k: int = 5


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
        detector = get_advanced_detector()
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
    Compute similarity between two code snippets using HuggingFace API
    
    Returns similarity score (0-1) and suspicious flag
    """
    try:
        hf_client = get_hf_client()
        result = await hf_client.predict(
            request.code1,
            request.code2,
            threshold=0.7
        )
        
        similarity = result.get("similarity_score", 0.0)
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
    Comprehensive code analysis including AI detection
    
    Returns full analysis with risk assessment
    """
    try:
        detector = get_advanced_detector()
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
        detector = get_advanced_detector()
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
    Find most similar code snippets from a corpus using HuggingFace API
    
    Useful for finding potential plagiarism cases
    """
    try:
        hf_client = get_hf_client()
        results = []
        
        # Compare query against each corpus code
        for idx, corpus_code in enumerate(corpus_codes):
            try:
                result = await hf_client.predict(query_code, corpus_code, threshold=0.7)
                similarity = result.get("similarity_score", 0.0)
                results.append((idx, similarity))
            except Exception as e:
                logger.error(f"Failed to compare with corpus code {idx}: {e}")
                results.append((idx, 0.0))
        
        # Sort by similarity and get top_k
        results.sort(key=lambda x: x[1], reverse=True)
        top_results = results[:top_k]
        
        return {
            "query_code_length": len(query_code),
            "corpus_size": len(corpus_codes),
            "top_matches": [
                {
                    "index": idx,
                    "similarity_score": score,
                    "is_suspicious": score >= 0.7
                }
                for idx, score in top_results
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
        hf_client = get_hf_client()
        health = await hf_client.health_check()
        
        return {
            "status": "connected",
            "api_url": hf_client.api_url,
            "model_loaded": health.get("model_loaded", False),
            "model_type": "CodeBERT (ONNX)",
            "deployment": "HuggingFace Spaces",
            "capabilities": [
                "Code clone detection",
                "Code similarity computation",
                "Batch analysis"
            ]
        }
    
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e),
            "message": "Cannot connect to HuggingFace API"
        }


# ========== Clone Detection Endpoints (Siamese Network) ==========

@router.post("/detect-clone", response_model=CloneDetectionResponse)
async def detect_code_clone(
    request: CloneDetectionRequest,
    use_onnx: bool = Query(True, description="Use ONNX for faster inference")
):
    """
    Detect if two code snippets are clones using trained Siamese network
    
    This endpoint uses a deep learning model trained specifically for code clone detection.
    It can identify semantic clones even when variable names or syntax differ.
    
    ONNX Backend (default): 2-3x faster, lower memory, recommended for production
    PyTorch Backend: Use only if ONNX is unavailable
    
    Args:
        code1: First code snippet
        code2: Second code snippet
        threshold: Probability threshold for clone detection (default: 0.5)
        use_onnx: Use ONNX runtime for faster inference (default: True)
    
    Returns:
        Detailed clone detection results with similarity scores and risk levels
    """
    try:
        # Try ONNX first if requested and available
        if use_onnx and ONNX_AVAILABLE:
            try:
                clone_detector = get_onnx_detector()
                result = clone_detector.predict_clone(
                    request.code1,
                    request.code2,
                    threshold=request.threshold
                )
                return CloneDetectionResponse(**result)
            except FileNotFoundError:
                logger.warning("ONNX model not found, falling back to PyTorch")
                use_onnx = False
        
        # Fall back to PyTorch
        if not use_onnx:
            clone_detector = get_clone_detector()
            result = clone_detector.predict_clone(
                request.code1,
                request.code2,
                threshold=request.threshold
            )
            return CloneDetectionResponse(**result)
    
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Clone detection model not found. Please train/export the model first: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Clone detection failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clone detection failed: {str(e)}"
        )


@router.post("/batch-clone-detection")
async def batch_clone_detection(
    request: BatchCloneRequest,
    use_onnx: bool = Query(True, description="Use ONNX for faster inference")
):
    """
    Compare multiple code snippets pairwise to detect clones
    
    This is useful for analyzing entire assignment submissions to find potential plagiarism.
    Compares every pair of code snippets and returns all matches above the threshold.
    
    ONNX mode provides 2-3x performance improvement for batch processing.
    
    Args:
        codes: List of code snippets to compare
        threshold: Minimum similarity threshold (default: 0.6)
        use_onnx: Use ONNX runtime for faster inference (default: True)
    
    Returns:
        List of all clone pairs found with their similarity scores
    """
    try:
        # Select detector backend
        if use_onnx and ONNX_AVAILABLE:
            try:
                clone_detector = get_onnx_detector()
            except FileNotFoundError:
                logger.warning("ONNX model not found, using PyTorch")
                clone_detector = get_clone_detector()
        else:
            clone_detector = get_clone_detector()
        
        results = clone_detector.batch_compare(
            request.codes,
            threshold=request.threshold
        )
        
        # Filter results to only show clones
        clone_pairs = [r for r in results if r['is_clone']]
        
        return {
            "total_comparisons": len(results),
            "clone_pairs_found": len(clone_pairs),
            "clone_pairs": clone_pairs,
            "summary": {
                "total_codes": len(request.codes),
                "threshold": request.threshold,
                "max_similarity": max((r['similarity_score'] for r in results), default=0),
                "avg_similarity": sum(r['similarity_score'] for r in results) / len(results) if results else 0,
                "high_risk_pairs": sum(1 for r in results if r['risk_level'] == 'high')
            },
            "backend": clone_detector.__class__.__name__
        }
    
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Clone detection model not found: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Batch clone detection failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch clone detection failed: {str(e)}"
        )


@router.post("/find-similar-submissions")
async def find_similar_code_submissions(
    request: FindSimilarRequest
):
    """
    Find the most similar code submissions to a target code
    
    This is useful for finding potential plagiarism by comparing a target submission
    against all other submissions in a class.
    
    Args:
        target_code: The code to compare against (e.g., suspected plagiarized code)
        candidate_codes: List of candidate submissions to compare
        threshold: Minimum similarity threshold (default: 0.6)
        top_k: Number of top matches to return (default: 5)
    
    Returns:
        Top K most similar submissions sorted by similarity score
    """
    try:
        clone_detector = get_clone_detector()
        results = clone_detector.find_similar_submissions(
            request.target_code,
            request.candidate_codes,
            threshold=request.threshold,
            top_k=request.top_k
        )
        
        return {
            "target_code_length": len(request.target_code),
            "total_candidates": len(request.candidate_codes),
            "matches_found": len(results),
            "threshold": request.threshold,
            "top_matches": results,
            "summary": {
                "highest_similarity": results[0]['similarity_score'] if results else 0,
                "potential_plagiarism": len([r for r in results if r['risk_level'] in ['high', 'medium']]),
                "flagged_for_review": [r['candidate_index'] for r in results if r['risk_level'] == 'high']
            }
        }
    
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Clone detection model not found: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Similar submission search failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/clone-detector-status")
async def get_clone_detector_status():
    """
    Get clone detector model status and information
    
    Returns information about loaded clone detection models (both PyTorch and ONNX)
    including performance metrics and configuration.
    """
    status_info = {
        "pytorch": {"status": "not_loaded"},
        "onnx": {"status": "not_loaded"},
        "recommended": "onnx"
    }
    
    # Check PyTorch model
    try:
        clone_detector = get_clone_detector()
        status_info["pytorch"] = {
            "status": "loaded",
            "model_type": "Siamese Network (CodeBERT)",
            "device": str(clone_detector.device),
            "model_name": clone_detector.model_name,
            "max_sequence_length": clone_detector.max_length,
            "test_metrics": clone_detector.test_metrics,
            "performance": {
                "f1_score": clone_detector.test_metrics.get('f1', 'N/A'),
                "accuracy": clone_detector.test_metrics.get('accuracy', 'N/A'),
                "auc_roc": clone_detector.test_metrics.get('auc', 'N/A')
            }
        }
    except FileNotFoundError:
        status_info["pytorch"] = {
            "status": "not_found",
            "message": "PyTorch model not found at backend/app/models/model.pt"
        }
    except Exception as e:
        status_info["pytorch"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check ONNX model
    if ONNX_AVAILABLE:
        try:
            onnx_detector = get_onnx_detector()
            info = onnx_detector.get_info()
            status_info["onnx"] = {
                "status": "loaded",
                "model_type": "Siamese Network (ONNX)",
                "providers": info['providers'],
                "model_name": info['model_name'],
                "max_sequence_length": info['max_sequence_length'],
                "model_size_mb": round(info['model_size_mb'], 2),
                "test_metrics": info['test_metrics'],
                "performance": {
                    "f1_score": info['test_metrics'].get('f1', 'N/A'),
                    "accuracy": info['test_metrics'].get('accuracy', 'N/A'),
                    "auc_roc": info['test_metrics'].get('auc', 'N/A'),
                    "speedup": "2-3x faster than PyTorch"
                }
            }
        except FileNotFoundError:
            status_info["onnx"] = {
                "status": "not_found",
                "message": "ONNX model not found. Export using: python export_to_onnx.py",
                "export_command": "python backend/export_to_onnx.py"
            }
        except Exception as e:
            status_info["onnx"] = {
                "status": "error",
                "error": str(e)
            }
    else:
        status_info["onnx"] = {
            "status": "runtime_unavailable",
            "message": "ONNX Runtime not installed",
            "install_command": "pip install onnxruntime"
        }
    
    # Add overall capabilities
    status_info["capabilities"] = [
        "Pairwise code clone detection",
        "Batch plagiarism detection",
        "Similar submission search",
        "Semantic similarity analysis"
    ]
    
    # Deployment recommendation
    if status_info["onnx"]["status"] == "loaded":
        status_info["deployment_status"] = "production_ready"
        status_info["deployment_recommendation"] = "ONNX model is loaded and ready for production use with optimized performance"
    elif status_info["pytorch"]["status"] == "loaded":
        status_info["deployment_status"] = "ready_with_warning"
        status_info["deployment_recommendation"] = "PyTorch model is loaded but ONNX export recommended for better performance"
    else:
        status_info["deployment_status"] = "not_ready"
        status_info["deployment_recommendation"] = "Please train and export the model before deployment"
    
    return status_info

