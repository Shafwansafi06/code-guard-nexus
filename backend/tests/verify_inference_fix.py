import sys
import os
import logging

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.services.inference import CodeDetectorInference

# Configure logging to see if warnings appear (they shouldn't for transformers)
logging.basicConfig(level=logging.INFO)

def test_loading():
    model_path = "/home/shafwan-safi/Desktop/code-guard-nexus/backend/app/services/models/code_detector/demo_model.pt"
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}, skipping load test.")
        return

    print("--- Attempting to load model ---")
    try:
        # This triggers the warning if not suppressed
        inference = CodeDetectorInference(model_path, device="cpu")
        print("--- Model loaded successfully ---")
    except Exception as e:
        print(f"Error loading model: {e}")

if __name__ == "__main__":
    test_loading()
