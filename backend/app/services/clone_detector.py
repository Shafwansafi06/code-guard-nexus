"""
Code Clone Detection Service using the trained Siamese Network
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel, AutoConfig
from typing import Dict, List, Tuple, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class CodeCloneDetector(nn.Module):
    """Siamese network using CodeBERT for code clone detection"""
    
    def __init__(self, model_name, hidden_size=768, dropout=0.1):
        super().__init__()
        
        # Load pre-trained CodeBERT
        model_config = AutoConfig.from_pretrained(model_name)
        self.encoder = AutoModel.from_pretrained(model_name, config=model_config)
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 4, 512),  # Concatenate + element-wise ops
            nn.LayerNorm(512),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(512, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 2)  # Binary classification
        )
        
    def encode(self, input_ids, attention_mask):
        """Encode a code snippet"""
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        # Use [CLS] token representation
        return outputs.last_hidden_state[:, 0, :]
    
    def forward(self, input_ids1, attention_mask1, input_ids2, attention_mask2, labels=None):
        """Forward pass for two code snippets"""
        # Encode both code snippets
        emb1 = self.encode(input_ids1, attention_mask1)
        emb2 = self.encode(input_ids2, attention_mask2)
        
        # Compute similarity features
        diff = torch.abs(emb1 - emb2)  # Element-wise difference
        prod = emb1 * emb2  # Element-wise product
        
        # Concatenate all features
        features = torch.cat([emb1, emb2, diff, prod], dim=1)
        
        # Classification
        logits = self.classifier(features)
        
        loss = None
        if labels is not None:
            loss_fct = nn.CrossEntropyLoss()
            loss = loss_fct(logits, labels)
        
        return {
            'loss': loss,
            'logits': logits,
            'embeddings': (emb1, emb2)
        }


class CloneDetectionService:
    """Service for detecting code clones using trained model"""
    
    def __init__(self, model_path: str = None, device: str = None):
        """
        Initialize the clone detection service
        
        Args:
            model_path: Path to the trained model file (.pt)
            device: Device to run inference on ('cuda' or 'cpu')
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.device = torch.device(self.device)
        
        # Default model path if not provided
        if model_path is None:
            # Try to find model in common locations
            possible_paths = [
                Path(__file__).parent.parent / "models" / "model.pt",  # Main location
                Path(__file__).parent.parent.parent / "models" / "clone_detector" / "model.pt",
                Path("/content/drive/MyDrive/code_plagiarism_model/final_model/model.pt"),
                Path("./models/model.pt")
            ]
            
            for path in possible_paths:
                if path.exists():
                    model_path = str(path)
                    break
            
            if model_path is None:
                raise FileNotFoundError(
                    "Model not found. Please provide model_path or place model at: "
                    f"{possible_paths[0]}"
                )
        
        logger.info(f"Loading clone detection model from {model_path}")
        self._load_model(model_path)
        logger.info("Clone detection model loaded successfully")
    
    def _load_model(self, model_path: str):
        """Load the trained model and tokenizer"""
        # Load checkpoint
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        
        # Get model configuration
        model_config = checkpoint.get('model_config', {})
        model_name = model_config.get('model_name', 'microsoft/codebert-base')
        hidden_size = model_config.get('hidden_size', 768)
        dropout = model_config.get('dropout', 0.1)
        
        # Initialize model
        self.model = CodeCloneDetector(
            model_name=model_name,
            hidden_size=hidden_size,
            dropout=dropout
        )
        
        # Load weights
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model = self.model.to(self.device)
        self.model.eval()
        
        # Load tokenizer
        model_dir = Path(model_path).parent
        tokenizer_path = model_dir if (model_dir / "tokenizer_config.json").exists() else model_name
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
        
        # Store metadata
        self.max_length = 256  # Default from training
        self.model_name = model_name
        
        # Get test metrics if available
        self.test_metrics = checkpoint.get('test_metrics', {})
        if self.test_metrics:
            logger.info(f"Model test F1 score: {self.test_metrics.get('f1', 'N/A')}")
    
    @torch.no_grad()
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
            threshold: Probability threshold for clone detection (default: 0.5)
        
        Returns:
            Dictionary with prediction results:
            - is_clone: Boolean indicating if codes are clones
            - clone_probability: Probability that codes are clones (0-1)
            - confidence: Confidence of the prediction (0-1)
            - similarity_score: Similarity score (0-100)
            - risk_level: 'high', 'medium', or 'low'
        """
        # Tokenize code1
        encoding1 = self.tokenizer(
            code1,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        ).to(self.device)
        
        # Tokenize code2
        encoding2 = self.tokenizer(
            code2,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        ).to(self.device)
        
        # Get predictions
        outputs = self.model(
            encoding1['input_ids'],
            encoding1['attention_mask'],
            encoding2['input_ids'],
            encoding2['attention_mask']
        )
        
        # Calculate probabilities
        probs = F.softmax(outputs['logits'], dim=-1)
        clone_prob = probs[0, 1].item()
        non_clone_prob = probs[0, 0].item()
        
        # Determine if clone
        is_clone = clone_prob > threshold
        confidence = max(clone_prob, non_clone_prob)
        similarity_score = clone_prob * 100  # Convert to 0-100 scale
        
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
            'threshold': threshold
        }
    
    @torch.no_grad()
    def batch_compare(
        self,
        codes: List[str],
        threshold: float = 0.5
    ) -> List[Dict[str, any]]:
        """
        Compare multiple code snippets pairwise
        
        Args:
            codes: List of code snippets
            threshold: Probability threshold for clone detection
        
        Returns:
            List of comparison results for each pair
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
    
    @torch.no_grad()
    def find_similar_submissions(
        self,
        target_code: str,
        candidate_codes: List[str],
        threshold: float = 0.6,
        top_k: int = 5
    ) -> List[Dict[str, any]]:
        """
        Find the most similar code submissions to a target
        
        Args:
            target_code: The code to compare against
            candidate_codes: List of candidate code snippets
            threshold: Minimum similarity threshold
            top_k: Number of top matches to return
        
        Returns:
            List of top similar submissions sorted by similarity
        """
        similarities = []
        
        for idx, candidate in enumerate(candidate_codes):
            result = self.predict_clone(target_code, candidate, threshold=0.0)
            result['candidate_index'] = idx
            similarities.append(result)
        
        # Sort by similarity score (descending)
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Filter by threshold and return top_k
        filtered = [s for s in similarities if s['similarity_score'] >= threshold * 100]
        return filtered[:top_k]


# Global instance
_clone_detector: Optional[CloneDetectionService] = None


def get_clone_detector(model_path: str = None, use_onnx: bool = True):
    """
    Get or create the global clone detector instance
    
    Automatically uses ONNX backend if available for 2x faster inference.
    Falls back to PyTorch if ONNX is not available.
    
    Args:
        model_path: Path to model file (only used on first call)
        use_onnx: Whether to use ONNX backend (default: True)
    
    Returns:
        Clone detector instance (ONNX or PyTorch backend)
    """
    global _clone_detector
    
    if _clone_detector is None:
        # Try ONNX first for better performance
        if use_onnx:
            try:
                from .onnx_clone_detector import ONNXCloneDetector
                # ONNX detector doesn't use model_path arg, it auto-detects
                _clone_detector = ONNXCloneDetector()
                logger.info("✓ Using ONNX backend (2x faster inference)")
                return _clone_detector
            except (ImportError, FileNotFoundError) as e:
                logger.warning(f"ONNX backend not available: {e}")
                logger.info("Falling back to PyTorch backend")
        
        # Fallback to PyTorch
        _clone_detector = CloneDetectionService(model_path=model_path)
        logger.info("✓ Using PyTorch backend")
    
    return _clone_detector


def reset_clone_detector():
    """Reset the global clone detector instance"""
    global _clone_detector
    _clone_detector = None
