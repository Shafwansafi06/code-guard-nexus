# 🚀 RTX 5000 Training - Quick Start

## One-Command Training

```bash
./START_TRAINING.sh
```

This script will:
1. ✓ Verify environment setup
2. ✓ Install all dependencies
3. ✓ Check GPU availability
4. ✓ Start optimized training
5. ✓ Save trained model

**Expected Time**: 3-4 hours on RTX 5000

---

## Manual Training

### Option 1: Using Training Script
```bash
cd backend
./train.sh
```

### Option 2: Direct Python
```bash
cd backend
source venv/bin/activate
python -m app.services.train_detector
```

---

## Configuration (Optimized for RTX 5000)

The training is pre-configured with optimal settings:

| Parameter | Value | Reason |
|-----------|-------|--------|
| Batch Size | 48 | Maximizes 16GB VRAM usage |
| Epochs | 10 | Complete training cycle |
| Learning Rate | 2e-5 | Standard for CodeBERT |
| Max Length | 512 | Full context window |
| Embedding Dim | 256 | Optimal for similarity |

**No manual configuration needed!**

---

## Expected Results

After training completes (3-4 hours):

```
✓ ROC-AUC: 0.92+
✓ Accuracy: 0.89+
✓ Model Size: ~500MB
✓ Inference Speed: ~100ms per request
```

---

## Monitor Training

### Watch GPU Usage
```bash
# In another terminal
watch -n 1 nvidia-smi
```

Expected GPU utilization: **85-100%**

### Training Output
```
Epoch 1/10:
  Train Loss: 1.234 → Target: ~0.5
  ROC-AUC: 0.850 → Target: >0.90
  Accuracy: 0.820 → Target: >0.85

Epoch 10/10:
  Train Loss: 0.456 ✓
  ROC-AUC: 0.927 ✓
  Accuracy: 0.894 ✓
```

---

## Troubleshooting

### Issue: Out of Memory
```python
# Edit backend/app/services/train_detector.py
config = TrainingConfig(
    batch_size=32,  # Reduce from 48
)
```

### Issue: Training Too Slow
- Check GPU is being used: `nvidia-smi`
- Check CUDA is installed: `python -c "import torch; print(torch.cuda.is_available())"`

### Issue: Import Errors
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-ml.txt
```

---

## After Training

### 1. Test the Model
```bash
cd backend
source venv/bin/activate
python << EOF
from app.services.inference import get_detector
detector = get_detector()
result = detector.detect_ai('def hello(): print("Hi")', 'python')
print(f"AI Score: {result['ai_score']:.3f}")
print(f"Is AI: {result['is_ai']}")
EOF
```

### 2. Start API Server
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test API
```bash
curl -X GET "http://localhost:8000/api/v1/ml/model-status"
```

Expected response:
```json
{
  "status": "loaded",
  "device": "cuda:0",
  "model_type": "DualHeadCodeModel"
}
```

---

## Files Created After Training

```
backend/models/code_detector/
├── pytorch_model.bin          # 500MB - Trained weights
├── config.json                # Model configuration
├── tokenizer/                 # CodeBERT tokenizer
│   ├── vocab.txt
│   └── tokenizer_config.json
└── training_history.json      # Loss/metrics per epoch
```

---

## Documentation

- **Full Guide**: [backend/RTX5000_TRAINING.md](backend/RTX5000_TRAINING.md)
- **ML Setup**: [ML_SETUP_COMPLETE.md](ML_SETUP_COMPLETE.md)
- **System Docs**: [SYSTEM_SUMMARY.md](SYSTEM_SUMMARY.md)
- **Quick Ref**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## Support

**Ready to train?** Run `./START_TRAINING.sh` and let it run for 3-4 hours! ☕

Questions? Check [ML_TRAINING_GUIDE.md](backend/ML_TRAINING_GUIDE.md)
