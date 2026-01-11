#!/bin/bash

# CodeGuard Nexus - ML Model Training Script
# Optimized for RTX 5000 (16GB VRAM)

set -e

echo "=================================================="
echo "CodeGuard Nexus - ML Model Training"
echo "=================================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "Run: python3 -m venv venv && source venv/bin/activate"
    exit 1
fi

# Activate virtual environment
echo "✓ Activating virtual environment..."
source venv/bin/activate

# Check Python version
PYTHON_VERSION=$(python3 --version)
echo "✓ Python version: $PYTHON_VERSION"

# Check CUDA availability
echo ""
echo "Checking GPU availability..."
python3 << EOF
import torch
if torch.cuda.is_available():
    print(f"✓ CUDA available: {torch.cuda.get_device_name(0)}")
    print(f"✓ CUDA version: {torch.version.cuda}")
    print(f"✓ VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("⚠️  No GPU detected - training will be slow on CPU")
EOF

echo ""
echo "=================================================="
echo "Starting training..."
echo "=================================================="
echo ""

# Set environment variables for optimal performance
export CUDA_VISIBLE_DEVICES=0
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Run training with optimizations
python3 -m app.services.train_detector

echo ""
echo "=================================================="
echo "✓ Training Complete!"
echo "=================================================="
echo ""
echo "Model saved to: ./models/code_detector/"
echo ""
echo "To test the model:"
echo "  python3 -m app.services.inference"
echo ""
echo "To start the API with the trained model:"
echo "  uvicorn app.main:app --reload"
echo ""
