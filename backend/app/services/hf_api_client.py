"""
HuggingFace API Client for Code Clone Detection
Uses the deployed model at https://shafwansafi06-code-clone-detector.hf.space
"""

import logging
import httpx
from typing import Dict, Any, Optional
import asyncio

logger = logging.getLogger(__name__)

class HuggingFaceAPIClient:
    """Client for HuggingFace Spaces deployed model"""
    
    def __init__(self, api_url: str = "https://shafwansafi06-code-clone-detector.hf.space"):
        self.api_url = api_url.rstrip('/')
        self.timeout = 30.0
        
    async def predict(
        self,
        code1: str,
        code2: str,
        threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Predict if two code snippets are clones
        
        Args:
            code1: First code snippet
            code2: Second code snippet
            threshold: Similarity threshold (0.0 to 1.0)
            
        Returns:
            Dictionary with prediction results
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_url}/predict",
                    json={
                        "code1": code1,
                        "code2": code2,
                        "threshold": threshold
                    }
                )
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error("HuggingFace API request timed out")
            raise Exception("API request timed out")
        except httpx.HTTPError as e:
            logger.error(f"HuggingFace API error: {e}")
            raise Exception(f"API error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error calling HuggingFace API: {e}")
            raise
    
    async def batch_predict(
        self,
        code_pairs: list,
        threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Batch prediction for multiple code pairs
        
        Args:
            code_pairs: List of dicts with 'code1' and 'code2' keys
            threshold: Similarity threshold
            
        Returns:
            Dictionary with batch results
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.api_url}/batch",
                    json={
                        "pairs": code_pairs,
                        "threshold": threshold
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Batch prediction error: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if the API is healthy"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.api_url}/health")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}


# Global instance
_hf_client: Optional[HuggingFaceAPIClient] = None


def get_hf_client() -> HuggingFaceAPIClient:
    """Get or create the HuggingFace API client singleton"""
    global _hf_client
    if _hf_client is None:
        _hf_client = HuggingFaceAPIClient()
        logger.info("Initialized HuggingFace API client")
    return _hf_client
