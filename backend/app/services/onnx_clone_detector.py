"""
ONNX-based Code Clone Detection Service for Production

This service provides optimized inference using ONNX Runtime:
- 2-3x faster than PyTorch inference
- Lower memory footprint
- Better multi-threading support
- Production-ready deployment
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
import logging
from pathlib import Path
import json

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    logging.warning("onnxruntime not installed. Install with: pip install onnxruntime")

from transformers import AutoTokenizer

logger = logging.getLogger(__name__)


class ONNXCloneDetector:
    """
    ONNX-based clone detection service for optimized production deployment
    
    Advantages over PyTorch:
    - Faster inference (2-3x speedup)
    - Lower memory usage
    - Better CPU utilization
    - Cross-platform compatibility
    """
    
    def __init__(
        self,
        onnx_model_path: str = None,
        tokenizer_path: str = None,
        device: str = "cpu",
        num_threads: int = None
    ):
        """
        Initialize ONNX clone detector
        
        Args:
            onnx_model_path: Path to ONNX model file
            tokenizer_path: Path to tokenizer (defaults to same directory as model)
            device: Device for inference ('cpu' or 'cuda')
            num_threads: Number of threads for CPU inference (None = auto)
        """
        if not ONNX_AVAILABLE:
            raise ImportError(
                "onnxruntime is required for ONNX inference. "
                "Install with: pip install onnxruntime or onnxruntime-gpu"
            )
        
        # Default model path
        if onnx_model_path is None:
            possible_paths = [
                Path(__file__).parent.parent / "models" / "model.onnx",
                Path(__file__).parent.parent.parent / "models" / "model.onnx",
                Path("/home/shafwan-safi/Desktop/code-guard-nexus/backend/app/models/model.onnx")
            ]
            
            for path in possible_paths:
                if path.exists():
                    onnx_model_path = str(path)
                    break
            
            if onnx_model_path is None:
                raise FileNotFoundError(
                    "ONNX model not found. Export PyTorch model first using: "
                    "python export_to_onnx.py"
                )
        
        self.model_path = Path(onnx_model_path)
        logger.info(f"Loading ONNX model from {self.model_path}")
        
        # Load metadata
        metadata_path = self.model_path.with_name(
            self.model_path.stem + '_metadata.json'
        )
        if metadata_path.exists():
            with open(metadata_path) as f:
                self.metadata = json.load(f)
            logger.info(f"Loaded metadata from {metadata_path}")
        else:
            self.metadata = {}
            logger.warning("No metadata file found, using defaults")
        
        # Set up ONNX Runtime session
        session_options = ort.SessionOptions()
        
        # Optimization settings
        session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        
        # Thread settings for CPU
        if num_threads:
            session_options.intra_op_num_threads = num_threads
            session_options.inter_op_num_threads = num_threads
        
        # Enable optimizations
        session_options.enable_cpu_mem_arena = True
        session_options.enable_mem_pattern = True
        
        # Select execution provider
        providers = []
        if device == "cuda" and 'CUDAExecutionProvider' in ort.get_available_providers():
            providers.append('CUDAExecutionProvider')
            logger.info("Using CUDA execution provider")
        providers.append('CPUExecutionProvider')
        
        # Create session
        self.session = ort.InferenceSession(
            str(self.model_path),
            sess_options=session_options,
            providers=providers
        )
        
        logger.info(f"ONNX Runtime session created with providers: {self.session.get_providers()}")
        
        # Load tokenizer
        model_config = self.metadata.get('model_config', {})
        model_name = model_config.get('model_name', 'microsoft/codebert-base')
        
        if tokenizer_path is None:
            tokenizer_path = self.model_path.parent
        
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        logger.info(f"Tokenizer loaded from {tokenizer_path}")
        
        # Store configuration
        self.max_length = self.metadata.get('max_length', 256)
        self.model_name = model_name
        self.test_metrics = self.metadata.get('test_metrics', {})
        
        # Get input/output names
        self.input_names = [input.name for input in self.session.get_inputs()]
        self.output_names = [output.name for output in self.session.get_outputs()]
        
        logger.info("ONNX model loaded successfully")
        if self.test_metrics:
            logger.info(f"Model performance: F1={self.test_metrics.get('f1', 'N/A'):.4f}")
    
    def _tokenize(self, code: str) -> Dict[str, np.ndarray]:
        """Tokenize code snippet"""
        encoding = self.tokenizer(
            code,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='np'
        )
        
        return {
            'input_ids': encoding['input_ids'].astype(np.int64),
            'attention_mask': encoding['attention_mask'].astype(np.int64)
        }
    
    def predict_clone(
        self,
        code1: str,
        code2: str,
        threshold: float = 0.5
    ) -> Dict[str, any]:
        """
        Predict if two code snippets are clones
        
        Args:
            code1: First code snippet
            code2: Second code snippet
            threshold: Probability threshold for clone detection
        
        Returns:
            Dictionary with prediction results
        """
        # Tokenize inputs
        enc1 = self._tokenize(code1)
        enc2 = self._tokenize(code2)
        
        # Prepare ONNX inputs
        onnx_inputs = {
            'input_ids1': enc1['input_ids'],
            'attention_mask1': enc1['attention_mask'],
            'input_ids2': enc2['input_ids'],
            'attention_mask2': enc2['attention_mask']
        }
        
        # Run inference
        logits = self.session.run(self.output_names, onnx_inputs)[0]
        
        # Compute probabilities (softmax)
        exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)
        
        clone_prob = float(probs[0, 1])
        non_clone_prob = float(probs[0, 0])
        
        # Determine if clone
        is_clone = clone_prob > threshold
        confidence = max(clone_prob, non_clone_prob)
        similarity_score = clone_prob * 100
        
        # Determine risk level
        if similarity_score >= 80:
            risk_level = "high"
            risk_description = "Very high similarity - likely plagiarized"
        elif similarity_score >= 60:
            risk_level = "medium"
            risk_description = "Moderate similarity - possible code clone"
        elif similarity_score >= 40:
            risk_level = "low"
            risk_description = "Low similarity - some common patterns"
        else:
            risk_level = "none"
            risk_description = "Minimal similarity - likely original code"
        
        return {
            'is_clone': is_clone,
            'clone_probability': round(clone_prob, 4),
            'non_clone_probability': round(non_clone_prob, 4),
            'confidence': round(confidence, 4),
            'similarity_score': round(similarity_score, 2),
            'risk_level': risk_level,
            'risk_description': risk_description,
            'threshold': threshold,
            'inference_backend': 'onnx'
        }
    
    def batch_compare(
        self,
        codes: List[str],
        threshold: float = 0.5
    ) -> List[Dict[str, any]]:
        """
        Compare multiple code snippets pairwise
        
        Args:
            codes: List of code snippets
            threshold: Probability threshold
        
        Returns:
            List of comparison results
        """
        results = []
        n = len(codes)
        
        for i in range(n):
            for j in range(i + 1, n):
                result = self.predict_clone(codes[i], codes[j], threshold)
                result['pair'] = (i, j)
                result['code1_index'] = i
                result['code2_index'] = j
                results.append(result)
        
        return results
    
    def find_similar_submissions(
        self,
        target_code: str,
        candidate_codes: List[str],
        threshold: float = 0.6,
        top_k: int = 5
    ) -> List[Dict[str, any]]:
        """
        Find most similar code submissions
        
        Args:
            target_code: Target code to compare
            candidate_codes: List of candidate codes
            threshold: Minimum similarity threshold
            top_k: Number of top matches to return
        
        Returns:
            List of top similar submissions
        """
        similarities = []
        
        for idx, candidate in enumerate(candidate_codes):
            result = self.predict_clone(target_code, candidate, threshold=0.0)
            result['candidate_index'] = idx
            similarities.append(result)
        
        # Sort by similarity score
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Filter and return top_k
        filtered = [s for s in similarities if s['similarity_score'] >= threshold * 100]
        return filtered[:top_k]
    
    def get_info(self) -> Dict[str, any]:
        """Get model information and performance metrics"""
        return {
            'model_path': str(self.model_path),
            'model_name': self.model_name,
            'max_sequence_length': self.max_length,
            'inference_backend': 'onnx',
            'providers': self.session.get_providers(),
            'test_metrics': self.test_metrics,
            'model_size_mb': self.model_path.stat().st_size / (1024 * 1024)
        }


# Global instance
_onnx_detector: Optional[ONNXCloneDetector] = None


def get_onnx_detector(
    model_path: str = None,
    device: str = "cpu",
    num_threads: int = None
) -> ONNXCloneDetector:
    """
    Get or create global ONNX detector instance
    
    Args:
        model_path: Path to ONNX model (only used on first call)
        device: Device for inference
        num_threads: Number of threads for CPU inference
    
    Returns:
        ONNXCloneDetector instance
    """
    global _onnx_detector
    
    if _onnx_detector is None:
        _onnx_detector = ONNXCloneDetector(
            onnx_model_path=model_path,
            device=device,
            num_threads=num_threads
        )
    
    return _onnx_detector


def reset_onnx_detector():
    """Reset global ONNX detector instance"""
    global _onnx_detector
    _onnx_detector = None
