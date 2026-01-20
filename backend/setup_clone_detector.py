#!/usr/bin/env python3
"""
Setup script for the clone detection model

This script helps you set up the trained clone detection model by:
1. Creating the necessary directory structure
2. Copying the model from Google Drive or local path
3. Verifying the model loads correctly
"""

import argparse
import shutil
from pathlib import Path
import sys


def setup_model_directory(base_path: Path):
    """Create the models directory structure"""
    models_dir = base_path / "models" / "clone_detector"
    models_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Created directory: {models_dir}")
    return models_dir


def copy_model_files(source_path: Path, target_path: Path):
    """Copy model files from source to target directory"""
    if not source_path.exists():
        print(f"❌ Source path does not exist: {source_path}")
        return False
    
    # Files to copy
    files_to_copy = {
        'model.pt': 'Model weights and architecture',
        'config.json': 'Model configuration',
        'tokenizer_config.json': 'Tokenizer configuration',
        'vocab.json': 'Vocabulary',
        'merges.txt': 'BPE merges',
        'special_tokens_map.json': 'Special tokens'
    }
    
    copied_files = []
    for filename, description in files_to_copy.items():
        source_file = source_path / filename
        target_file = target_path / filename
        
        if source_file.exists():
            shutil.copy2(source_file, target_file)
            copied_files.append(filename)
            print(f"  ✓ Copied {filename} ({description})")
        else:
            if filename == 'model.pt':
                print(f"  ❌ Required file missing: {filename}")
                return False
            else:
                print(f"  ⚠ Optional file not found: {filename}")
    
    print(f"\n✓ Successfully copied {len(copied_files)} files")
    return True


def verify_model(model_path: Path):
    """Verify the model loads correctly"""
    print("\nVerifying model...")
    
    try:
        import torch
        
        # Try to load the model
        checkpoint = torch.load(
            model_path / "model.pt",
            map_location='cpu',
            weights_only=False
        )
        
        print("✓ Model file loaded successfully")
        
        # Check model components
        if 'model_state_dict' in checkpoint:
            print("✓ Model state dict found")
        else:
            print("❌ Model state dict missing")
            return False
        
        if 'model_config' in checkpoint:
            config = checkpoint['model_config']
            print(f"✓ Model config found: {config}")
        
        if 'test_metrics' in checkpoint:
            metrics = checkpoint['test_metrics']
            print(f"✓ Test metrics found:")
            print(f"  - F1 Score: {metrics.get('f1', 'N/A'):.4f}")
            print(f"  - Accuracy: {metrics.get('accuracy', 'N/A'):.4f}")
            print(f"  - AUC-ROC: {metrics.get('auc', 'N/A'):.4f}")
        
        # Try to load the service
        sys.path.insert(0, str(Path(__file__).parent))
        from app.services.clone_detector import CloneDetectionService
        
        detector = CloneDetectionService(model_path=str(model_path / "model.pt"))
        print("✓ Clone detection service initialized successfully")
        
        # Run a simple test
        code1 = "def add(a, b): return a + b"
        code2 = "def sum_numbers(x, y): return x + y"
        
        result = detector.predict_clone(code1, code2)
        print(f"\n✓ Test prediction successful:")
        print(f"  - Similarity score: {result['similarity_score']:.2f}%")
        print(f"  - Is clone: {result['is_clone']}")
        print(f"  - Risk level: {result['risk_level']}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("   Make sure required packages are installed: transformers, torch")
        return False
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Setup the clone detection model for Code Guard Nexus"
    )
    parser.add_argument(
        "--source",
        type=str,
        help="Path to the trained model directory (e.g., /content/drive/MyDrive/code_plagiarism_model/final_model)",
        required=False
    )
    parser.add_argument(
        "--target",
        type=str,
        help="Target directory (default: ./models/clone_detector)",
        default="./models/clone_detector"
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Only verify existing model without copying"
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("Code Guard Nexus - Clone Detector Setup")
    print("=" * 70)
    
    # Get paths
    backend_path = Path(__file__).parent
    target_path = Path(args.target)
    
    if not target_path.is_absolute():
        target_path = backend_path / target_path
    
    # Verify only mode
    if args.verify_only:
        if not (target_path / "model.pt").exists():
            print(f"❌ Model not found at: {target_path}")
            print("\nRun without --verify-only to copy the model first")
            sys.exit(1)
        
        success = verify_model(target_path)
        sys.exit(0 if success else 1)
    
    # Copy mode - require source
    if not args.source:
        print("❌ --source is required when copying the model")
        print("\nExample usage:")
        print("  python setup_clone_detector.py --source /path/to/final_model")
        print("\nOr to verify existing model:")
        print("  python setup_clone_detector.py --verify-only")
        sys.exit(1)
    
    source_path = Path(args.source)
    
    # Create directory
    target_path.mkdir(parents=True, exist_ok=True)
    print(f"\n📁 Target directory: {target_path}")
    
    # Copy files
    print(f"\n📦 Copying model from: {source_path}")
    if not copy_model_files(source_path, target_path):
        print("\n❌ Setup failed - could not copy all required files")
        sys.exit(1)
    
    # Verify
    if verify_model(target_path):
        print("\n" + "=" * 70)
        print("✅ Clone detector setup complete!")
        print("=" * 70)
        print(f"\nModel location: {target_path}")
        print("\nYou can now use the clone detection API endpoints:")
        print("  POST /api/ml/detect-clone - Detect clones between two code snippets")
        print("  POST /api/ml/batch-clone-detection - Batch plagiarism detection")
        print("  POST /api/ml/find-similar-submissions - Find similar submissions")
        print("  GET  /api/ml/clone-detector-status - Check model status")
    else:
        print("\n⚠ Setup completed but verification failed")
        print("Please check the error messages above")
        sys.exit(1)


if __name__ == "__main__":
    main()
