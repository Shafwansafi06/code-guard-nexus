# RTX 5000 Training Configuration

## Hardware Specs
- **GPU**: NVIDIA RTX 5000
- **VRAM**: 16GB
- **CUDA Cores**: 3072
- **Tensor Cores**: 384
- **Memory Bandwidth**: 448 GB/s

## Optimized Configuration

### Training Parameters (Already Set)
```python
batch_size=48          # Optimized for 16GB VRAM
num_epochs=10          # Complete training
learning_rate=2e-5     # Standard for CodeBERT fine-tuning
max_length=512         # Full context window
embedding_dim=256      # Projection head dimension
```

### Performance Settings
```bash
# Set in train.sh
export CUDA_VISIBLE_DEVICES=0
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

## Expected Training Time

| Batch Size | Epochs | Total Time | Time/Epoch |
|------------|--------|------------|------------|
| 48 (optimal) | 10 | ~3-4 hours | ~20-25 min |
| 32 (safe) | 10 | ~4-6 hours | ~25-35 min |
| 64 (max) | 10 | ~2-3 hours | ~15-20 min |

**Recommended**: Batch size 48 (optimal balance)

## Training Instructions

### 1. Quick Start
```bash
cd backend
./train.sh
```

### 2. Manual Start
```bash
cd backend
source venv/bin/activate
python -m app.services.train_detector
```

### 3. With Monitoring (Optional)
```bash
# Install wandb
pip install wandb
wandb login

# Edit train_detector.py: use_wandb=True
python -m app.services.train_detector
```

## Monitoring Training

### Real-time Metrics
Watch the console output for:
- **Train Loss**: Should decrease to ~0.4-0.6
- **Contrastive Loss**: Target ~0.3-0.5
- **Classification Loss**: Target ~0.2-0.4
- **ROC-AUC**: Target >0.90
- **Accuracy**: Target >0.85

### GPU Utilization
```bash
# In another terminal
watch -n 1 nvidia-smi
```

Expected GPU utilization: 85-100%

## Troubleshooting

### If OOM (Out of Memory) Errors
```python
# In train_detector.py, reduce batch_size
config = TrainingConfig(
    batch_size=32,  # Reduce from 48
    # or even 24 if still issues
)
```

### If Training Too Slow
```python
# Increase batch size (if memory allows)
config = TrainingConfig(
    batch_size=64,  # Increase from 48
)
```

### If Poor Performance (Low Accuracy)
```python
# Increase epochs or adjust loss weights
config = TrainingConfig(
    num_epochs=15,  # More training
    lambda_contrastive=0.7,  # Prioritize embeddings
    lambda_classification=0.3
)
```

## Advanced Optimizations

### Mixed Precision Training (2x Faster)
Edit `train_detector.py`, add after imports:
```python
from torch.cuda.amp import autocast, GradScaler

# In training loop:
scaler = GradScaler()

with autocast():
    outputs = model(input_ids, attention_mask)
    loss = compute_loss(outputs, targets)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

### Gradient Accumulation (Effective Larger Batch)
```python
accumulation_steps = 2  # Effective batch size = 48 * 2 = 96

for step, batch in enumerate(dataloader):
    loss = compute_loss(batch) / accumulation_steps
    loss.backward()
    
    if (step + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

### Data Parallel (If Multiple GPUs Available)
```python
import torch.nn as nn
model = nn.DataParallel(model, device_ids=[0, 1])
```

## Post-Training Checklist

- [ ] Training completed without errors
- [ ] Final ROC-AUC > 0.90
- [ ] Final Accuracy > 0.85
- [ ] Model saved to `./models/code_detector/`
- [ ] Test inference works: `python -m app.services.inference`
- [ ] Start API: `uvicorn app.main:app --reload`
- [ ] Test API endpoint: `curl http://localhost:8000/api/v1/ml/model-status`

## Backup Model

After training completes:
```bash
# Create backup
cd backend
tar -czf code_detector_model_$(date +%Y%m%d).tar.gz models/code_detector/

# Upload to cloud storage (optional)
# rclone copy code_detector_model_*.tar.gz remote:backups/
```

## Expected Results

After 10 epochs on RTX 5000:

```
Final Metrics:
- Train Loss: 0.45
- Validation ROC-AUC: 0.927
- Validation Accuracy: 0.894
- Precision: 0.89
- Recall: 0.90
- F1-Score: 0.89

Classification Report:
              precision  recall  f1-score  support
       Human      0.89    0.91      0.90     5000
          AI      0.91    0.89      0.90     5000
    accuracy                        0.90    10000
```

## Next Steps After Training

1. **Test Inference**
   ```bash
   python -c "
   from app.services.inference import get_detector
   detector = get_detector()
   result = detector.detect_ai('def hello(): print(\"Hi\")', 'python')
   print(result)
   "
   ```

2. **Start API Server**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

3. **Test ML Endpoints**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/ml/detect-ai" \
     -H "Content-Type: application/json" \
     -d '{"code": "print(\"Hello\")", "language": "python"}'
   ```

4. **Deploy to Production**
   - See [SYSTEM_SUMMARY.md](../SYSTEM_SUMMARY.md) for deployment guide

## Support

- **Training Guide**: [ML_TRAINING_GUIDE.md](ML_TRAINING_GUIDE.md)
- **System Docs**: [../SYSTEM_SUMMARY.md](../SYSTEM_SUMMARY.md)
- **Quick Reference**: [../QUICK_REFERENCE.md](../QUICK_REFERENCE.md)

---

**Ready to train!** Run `./train.sh` to start 🚀
