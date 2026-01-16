"""
Integration test for ML services
"""
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

import torch
from app.services.inference import get_detector
import numpy as np

def test_inference_service():
    print("Testing Inference Service...")
    detector = get_detector()
    
    # Test AI Detection
    ai_code = "def fib(n): if n <= 1: return n else: return fib(n-1) + fib(n-2)" # Simple enough to be ambiguous but let's see
    result = detector.detect_ai(ai_code)
    print(f"AI Detection Result: {result}")
    assert 'ai_score' in result
    assert 'human_score' in result
    
    # Test Embedding Generation
    embedding = detector.get_embedding(ai_code)
    print(f"Embedding Shape: {embedding.shape}")
    assert embedding.shape == (768,)
    
    # Test Similarity
    code1 = "for i in range(10): print(i)"
    code2 = "for x in range(10): print(x)"
    
    emb1 = detector.get_embedding(code1)
    emb2 = detector.get_embedding(code2)
    
    similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    print(f"Similarity between similar codes: {similarity:.4f}")
    assert similarity > 0.8
    
    code3 = "import os; print(os.listdir('.'))"
    emb3 = detector.get_embedding(code3)
    similarity_diff = np.dot(emb1, emb3) / (np.linalg.norm(emb1) * np.linalg.norm(emb3))
    print(f"Similarity between different codes: {similarity_diff:.4f}")
    assert similarity_diff < similarity

if __name__ == "__main__":
    try:
        test_inference_service()
        print("\nML Integration Test Passed!")
    except Exception as e:
        print(f"\nML Integration Test Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
