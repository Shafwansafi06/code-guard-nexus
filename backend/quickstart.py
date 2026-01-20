#!/usr/bin/env python3
"""
Quick Start: Code Clone Detection API
Deploy and test the clone detection model in under 2 minutes
"""

import subprocess
import sys
import time
from pathlib import Path


def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)


def run_command(cmd, description):
    """Run a command and print status"""
    print(f"\n🔧 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        print(f"✅ Done")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {e}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False


def main():
    print_header("Code Guard Nexus - Clone Detection Quick Start")
    
    # Check if model exists
    model_path = Path("app/models/model.pt")
    onnx_path = Path("app/models/model_optimized.onnx")
    
    print("\n📦 Checking model files...")
    
    if not model_path.exists():
        print(f"❌ PyTorch model not found at: {model_path}")
        print("\nPlease place your trained model at:")
        print(f"  {model_path.absolute()}")
        sys.exit(1)
    else:
        print(f"✅ PyTorch model found")
    
    # Export to ONNX if needed
    if not onnx_path.exists():
        print(f"\n⚠️  ONNX model not found, exporting...")
        if not run_command("python export_to_onnx.py", "Exporting to ONNX"):
            print("\n⚠️  ONNX export failed, will use PyTorch backend")
        else:
            print(f"✅ ONNX model created")
    else:
        print(f"✅ ONNX model found (production-ready)")
    
    # Run tests
    print_header("Running Tests")
    
    print("\n🧪 Test 1: Model Loading")
    test_code = """
from app.services.clone_detector import get_clone_detector
detector = get_clone_detector()
backend = 'ONNX' if hasattr(detector, 'session') else 'PyTorch'
print(f'  Backend: {backend}')
"""
    
    result = subprocess.run(
        [sys.executable, "-c", test_code],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Model loaded successfully")
        print(result.stdout)
    else:
        print("❌ Model loading failed")
        print(result.stderr)
        sys.exit(1)
    
    # Test inference
    print("\n🧪 Test 2: Clone Detection")
    test_code = """
from app.services.clone_detector import get_clone_detector
import time

detector = get_clone_detector()

code1 = 'def add(a, b): return a + b'
code2 = 'def sum(x, y): return x + y'

start = time.time()
result = detector.predict_clone(code1, code2)
elapsed = (time.time() - start) * 1000

print(f'  Similarity: {result[\"similarity_score\"]:.2f}%')
print(f'  Inference time: {elapsed:.1f}ms')
print(f'  Risk: {result[\"risk_level\"]}')
"""
    
    result = subprocess.run(
        [sys.executable, "-c", test_code],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("✅ Inference working")
        print(result.stdout)
    else:
        print("❌ Inference failed")
        print(result.stderr)
        sys.exit(1)
    
    # API endpoints summary
    print_header("API Endpoints Ready")
    
    print("\n📡 Available Endpoints:")
    print("  POST /api/ml/detect-clone")
    print("    - Detect clones between two code snippets")
    print()
    print("  POST /api/ml/batch-clone-detection")
    print("    - Batch plagiarism detection across multiple submissions")
    print()
    print("  POST /api/ml/find-similar-submissions")
    print("    - Find top-K similar submissions to a target")
    print()
    print("  GET /api/ml/clone-detector-status")
    print("    - Check model status and backend info")
    
    # Start server instructions
    print_header("Start the API Server")
    
    print("\n🚀 To start the server:")
    print("  cd backend")
    print("  uvicorn app.main:app --reload --port 8000")
    print()
    print("📖 Then visit: http://localhost:8000/docs")
    print()
    
    print_header("Quick Test Commands")
    
    print("\n# Test clone detection")
    print("""curl -X POST http://localhost:8000/api/ml/detect-clone \\
  -H "Content-Type: application/json" \\
  -d '{
    "code1": "def add(a, b): return a + b",
    "code2": "def sum(x, y): return x + y"
  }'""")
    
    print("\n# Check model status")
    print("curl http://localhost:8000/api/ml/clone-detector-status")
    
    print_header("✅ Setup Complete!")
    
    print("\n🎉 Your clone detection model is ready for production!")
    print("📚 See ONNX_DEPLOYMENT.md for detailed deployment guide")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
