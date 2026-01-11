"""
Inference service for code similarity and AI detection
"""

import torch
import torch.nn.functional as F
from transformers import AutoTokenizer
import numpy as np
from typing import List, Dict, Tuple
import logging
from pathlib import Path
from .train_detector import DualHeadCodeModel, TrainingConfig

logger = logging.getLogger(__name__)


class CodeDetectorInference:
    """Inference class for code similarity and AI detection"""
    
    def __init__(self, model_path: str, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.device = torch.device(self.device)
        
        # Load model
        logger.info(f"Loading model from {model_path}")
        checkpoint = torch.load(model_path, map_location=self.device)
        config_dict = checkpoint.get('config', {})
        
        model_name = config_dict.get('model_name', 'microsoft/codebert-base')
        embedding_dim = config_dict.get('embedding_dim', 768)
        
        # Initialize model
        self.model = DualHeadCodeModel(
            model_name=model_name,
            embedding_dim=embedding_dim
        ).to(self.device)
        
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        # Load tokenizer
        tokenizer_path = Path(model_path).parent / "tokenizer"
        self.tokenizer = AutoTokenizer.from_pretrained(str(tokenizer_path))
        
        logger.info("Model loaded successfully")
    
    def preprocess_code(
        self, 
        code: str, 
        language: str = "unknown", 
        task: str = "",
        max_length: int = 512
    ) -> Dict[str, torch.Tensor]:
        """Preprocess code for inference"""
        text = f"<{language}> {code} <{task}>"
        
        encoding = self.tokenizer(
            text,
            max_length=max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].to(self.device),
            'attention_mask': encoding['attention_mask'].to(self.device)
        }
    
    @torch.no_grad()
    def detect_ai(
        self, 
        code: str, 
        language: str = "python",
        return_confidence: bool = True
    ) -> Dict[str, float]:
        """
        Detect if code is AI-generated
        
        Args:
            code: Source code string
            language: Programming language
            return_confidence: If True, return confidence scores
        
        Returns:
            Dictionary with 'is_ai', 'ai_score', 'human_score'
        """
        # Preprocess
        inputs = self.preprocess_code(code, language)
        
        # Forward pass
        logits, _ = self.model(
            inputs['input_ids'],
            inputs['attention_mask']
        )
        
        # Get probabilities
        probs = F.softmax(logits, dim=1)[0]
        human_score = probs[0].item()
        ai_score = probs[1].item()
        
        result = {
            'is_ai': ai_score > 0.5,
            'ai_score': ai_score,
            'human_score': human_score,
            'confidence': max(ai_score, human_score)
        }
        
        return result
    
    @torch.no_grad()
    def get_embedding(
        self, 
        code: str, 
        language: str = "python"
    ) -> np.ndarray:
        """
        Get code embedding vector
        
        Args:
            code: Source code string
            language: Programming language
        
        Returns:
            Embedding vector as numpy array
        """
        inputs = self.preprocess_code(code, language)
        
        _, embeddings = self.model(
            inputs['input_ids'],
            inputs['attention_mask'],
            return_embeddings=True
        )
        
        return embeddings[0].cpu().numpy()
    
    @torch.no_grad()
    def compute_similarity(
        self, 
        code1: str, 
        code2: str,
        language1: str = "python",
        language2: str = "python"
    ) -> float:
        """
        Compute similarity between two code snippets
        
        Args:
            code1: First code snippet
            code2: Second code snippet
            language1: Language of first code
            language2: Language of second code
        
        Returns:
            Similarity score (0-1)
        """
        # Get embeddings
        emb1 = self.get_embedding(code1, language1)
        emb2 = self.get_embedding(code2, language2)
        
        # Compute cosine similarity
        similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        
        return float(similarity)
    
    @torch.no_grad()
    def analyze_code_batch(
        self,
        codes: List[str],
        languages: List[str] = None
    ) -> List[Dict]:
        """
        Batch analysis of multiple code snippets
        
        Args:
            codes: List of code snippets
            languages: List of languages (optional)
        
        Returns:
            List of analysis results
        """
        if languages is None:
            languages = ["python"] * len(codes)
        
        results = []
        for code, lang in zip(codes, languages):
            ai_result = self.detect_ai(code, lang)
            embedding = self.get_embedding(code, lang)
            
            results.append({
                'code': code[:100] + "..." if len(code) > 100 else code,
                'language': lang,
                'ai_detection': ai_result,
                'embedding_norm': float(np.linalg.norm(embedding))
            })
        
        return results
    
    @torch.no_grad()
    def find_similar_submissions(
        self,
        query_code: str,
        corpus_codes: List[str],
        query_language: str = "python",
        corpus_languages: List[str] = None,
        top_k: int = 5
    ) -> List[Tuple[int, float]]:
        """
        Find top-k most similar code snippets from corpus
        
        Args:
            query_code: Query code snippet
            corpus_codes: List of corpus code snippets
            query_language: Language of query code
            corpus_languages: Languages of corpus codes
            top_k: Number of top results to return
        
        Returns:
            List of (index, similarity_score) tuples
        """
        if corpus_languages is None:
            corpus_languages = ["python"] * len(corpus_codes)
        
        # Get query embedding
        query_emb = self.get_embedding(query_code, query_language)
        
        # Get corpus embeddings
        corpus_embs = []
        for code, lang in zip(corpus_codes, corpus_languages):
            emb = self.get_embedding(code, lang)
            corpus_embs.append(emb)
        
        corpus_embs = np.array(corpus_embs)
        
        # Compute similarities
        similarities = np.dot(corpus_embs, query_emb) / (
            np.linalg.norm(corpus_embs, axis=1) * np.linalg.norm(query_emb)
        )
        
        # Get top-k
        top_indices = np.argsort(similarities)[::-1][:top_k]
        results = [(int(idx), float(similarities[idx])) for idx in top_indices]
        
        return results
    
    def comprehensive_analysis(
        self,
        code: str,
        language: str = "python",
        reference_codes: List[str] = None
    ) -> Dict:
        """
        Comprehensive analysis including AI detection and similarity
        
        Args:
            code: Code to analyze
            language: Programming language
            reference_codes: Optional list of codes to compare against
        
        Returns:
            Comprehensive analysis results
        """
        # AI detection
        ai_result = self.detect_ai(code, language)
        
        # Get embedding
        embedding = self.get_embedding(code, language)
        
        result = {
            'ai_detection': ai_result,
            'language': language,
            'embedding_dim': len(embedding),
            'code_length': len(code),
            'risk_assessment': self._assess_risk(ai_result)
        }
        
        # Similarity analysis if reference codes provided
        if reference_codes:
            similarities = []
            for ref_code in reference_codes:
                sim = self.compute_similarity(code, ref_code, language, language)
                similarities.append(float(sim))
            
            result['similarity_analysis'] = {
                'max_similarity': max(similarities) if similarities else 0.0,
                'mean_similarity': np.mean(similarities) if similarities else 0.0,
                'suspicious_pairs': sum(1 for s in similarities if s > 0.7)
            }
        
        return result
    
    def _assess_risk(self, ai_result: Dict) -> Dict:
        """Assess overall risk level"""
        ai_score = ai_result['ai_score']
        
        if ai_score >= 0.8:
            level = "critical"
            description = "Very high likelihood of AI-generated code"
        elif ai_score >= 0.6:
            level = "high"
            description = "High likelihood of AI-generated code"
        elif ai_score >= 0.4:
            level = "medium"
            description = "Moderate likelihood of AI-generated code"
        else:
            level = "low"
            description = "Likely human-written code"
        
        return {
            'level': level,
            'description': description,
            'confidence': ai_result['confidence']
        }


# Global inference instance (lazy loading)
_detector_instance = None


def get_detector(model_path: str = None) -> CodeDetectorInference:
    """Get or create detector instance"""
    global _detector_instance
    
    if _detector_instance is None:
        if model_path is None:
            model_path = "./models/code_detector/best_model.pt"
        _detector_instance = CodeDetectorInference(model_path)
    
    return _detector_instance


def detect_ai_generated(code: str, language: str = "python") -> Dict:
    """Convenience function for AI detection"""
    detector = get_detector()
    return detector.detect_ai(code, language)


def compute_code_similarity(code1: str, code2: str) -> float:
    """Convenience function for similarity computation"""
    detector = get_detector()
    return detector.compute_similarity(code1, code2)
