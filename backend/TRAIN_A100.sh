#!/bin/bash

# A100 Training Script for CodeGuard Nexus
# Optimized for NVIDIA A100 GPU

set -e

echo "======================================================================"
echo "CodeGuard Nexus - A100 Optimized Training"
echo "======================================================================"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found at .venv"
    echo "Please create one first: python -m venv .venv"
    exit 1
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Verify CUDA is available
echo ""
echo "Checking CUDA availability..."
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"None\"}'); print(f'VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB' if torch.cuda.is_available() else '')"

if ! python -c "import torch; exit(0 if torch.cuda.is_available() else 1)"; then
    echo "❌ CUDA not available. Please check your GPU setup."
    exit 1
fi

# Verify A100 or compatible GPU
GPU_NAME=$(python -c "import torch; print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else '')")
if [[ ! "$GPU_NAME" =~ "A100" ]] && [[ ! "$GPU_NAME" =~ "A30" ]] && [[ ! "$GPU_NAME" =~ "A40" ]]; then
    echo "⚠️  Warning: This script is optimized for A100. Detected: $GPU_NAME"
    echo "Training will continue but may not achieve optimal performance."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Python version
echo ""
echo "Checking Python version..."
python --version

# Set optimal environment variables for A100
echo ""
echo "Setting A100-optimized environment variables..."
export CUDA_LAUNCH_BLOCKING=0
export TORCH_CUDNN_V8_API_ENABLED=1
export CUDA_MODULE_LOADING=LAZY

# Enable TF32 for additional speedup on A100
export TORCH_ALLOW_TF32_OVERRIDE=1

# Set memory allocation strategy
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

echo "✓ Environment configured for A100"

# Navigate to backend directory
cd backend

# Start training
echo ""
echo "======================================================================"
echo "Starting Training..."
echo "======================================================================"
echo ""
echo "Estimated time: ~1 hour 45 minutes (10 epochs)"
echo "Expected final ROC-AUC: 0.88-0.92"
echo ""
echo "Monitor GPU usage in another terminal:"
echo "  watch -n 1 nvidia-smi"
echo ""
echo "======================================================================"
echo ""

# Run training with optimizations
python -m app.services.train_detector

# Check if training completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================================"
    echo "✓ Training completed successfully!"
    echo "======================================================================"
    echo ""
    echo "Model saved to: backend/models/code_detector/"
    echo ""
    echo "Next steps:"
    echo "  1. Test the model: python -m app.services.inference"
    echo "  2. Start the API: python -m app.main"
    echo "  3. Check accuracy: See validation metrics above"
    echo ""
    echo "Training log saved to: training.log"
    echo "======================================================================"
else
    echo ""
    echo "======================================================================"
    echo "❌ Training failed. Check the error messages above."
    echo "======================================================================"
    exit 1
fi
