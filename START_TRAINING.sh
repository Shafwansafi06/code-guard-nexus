#!/bin/bash

# ================================================================
# CodeGuard Nexus - RTX 5000 Quick Training Guide
# ================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     CodeGuard Nexus - ML Training on RTX 5000             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Clone repository (if not already done)
echo "📦 Step 1: Repository Setup"
echo "─────────────────────────────────────────────────────────────"
if [ ! -d ".git" ]; then
    echo "Run: git clone https://github.com/your-repo/code-guard-nexus.git"
    echo "     cd code-guard-nexus"
    exit 1
else
    echo "✓ Repository already cloned"
fi
echo ""

# Step 2: Install dependencies
echo "📚 Step 2: Install Dependencies"
echo "─────────────────────────────────────────────────────────────"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing core dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "Installing ML dependencies (this may take 5-10 minutes)..."
pip install -q -r requirements-ml.txt

echo "✓ All dependencies installed"
echo ""

# Step 3: Verify GPU
echo "🎮 Step 3: GPU Verification"
echo "─────────────────────────────────────────────────────────────"
python3 << 'PYEOF'
import torch
import sys

if not torch.cuda.is_available():
    print("❌ ERROR: No GPU detected!")
    print("Make sure NVIDIA drivers and CUDA are installed")
    sys.exit(1)

gpu_name = torch.cuda.get_device_name(0)
vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
cuda_version = torch.version.cuda

print(f"✓ GPU Detected: {gpu_name}")
print(f"✓ VRAM: {vram_gb:.1f} GB")
print(f"✓ CUDA Version: {cuda_version}")

if "RTX" not in gpu_name and "5000" not in gpu_name:
    print(f"⚠️  Warning: Expected RTX 5000, found {gpu_name}")
    print("   Training will still work but performance may vary")
PYEOF

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ GPU verification failed. Please check your CUDA installation."
    exit 1
fi
echo ""

# Step 4: Configuration check
echo "⚙️  Step 4: Training Configuration"
echo "─────────────────────────────────────────────────────────────"
echo "Optimized settings for RTX 5000 (16GB VRAM):"
echo "  • Batch Size: 48"
echo "  • Epochs: 10"
echo "  • Learning Rate: 2e-5"
echo "  • Max Length: 512 tokens"
echo "  • Expected Time: 3-4 hours"
echo "  • Expected ROC-AUC: >0.90"
echo ""

# Step 5: Start training
echo "🚀 Step 5: Ready to Train!"
echo "─────────────────────────────────────────────────────────────"
echo ""
read -p "Start training now? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "Starting training... (This will take 3-4 hours)"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "💡 TIP: Monitor GPU usage in another terminal with:"
    echo "   watch -n 1 nvidia-smi"
    echo ""
    sleep 2
    
    # Run training
    ./train.sh
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                  Training Complete! 🎉                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Model saved to: ./models/code_detector/"
    echo ""
    echo "Next steps:"
    echo "  1. Test inference: python -m app.services.inference"
    echo "  2. Start API: uvicorn app.main:app --reload"
    echo "  3. Test endpoint: curl http://localhost:8000/api/v1/ml/model-status"
    echo ""
else
    echo ""
    echo "Training cancelled. To start training later:"
    echo "  cd backend"
    echo "  ./train.sh"
    echo ""
    echo "Or manually:"
    echo "  cd backend"
    echo "  source venv/bin/activate"
    echo "  python -m app.services.train_detector"
    echo ""
fi

echo "📖 Documentation:"
echo "  • Training Guide: backend/RTX5000_TRAINING.md"
echo "  • ML Setup: ML_SETUP_COMPLETE.md"
echo "  • Full Docs: SYSTEM_SUMMARY.md"
echo ""
