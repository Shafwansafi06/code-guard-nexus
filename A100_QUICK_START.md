# A100 Training Quick Start

## 🚀 How to Start Training

```bash
# Make sure you're in the project root
cd /home/shafwan-safi/Desktop/code-guard-nexus

# Ensure .venv is activated and all requirements are installed
source .venv/bin/activate

# Run the optimized training script
./TRAIN_A100.sh
```

## ⚡ Key Optimizations

| Optimization | Benefit | Speedup |
|-------------|---------|---------|
| **Mixed Precision (FP16)** | Uses Tensor Cores | 2-3x |
| **Torch Compile** | Kernel fusion | 1.2-1.3x |
| **Gradient Accumulation** | Effective batch 256 | Better convergence |
| **Optimized Data Loading** | 8 workers + prefetch | 1.1-1.2x |
| **Large Batch Size** | GPU utilization 90%+ | 1.5-2x |

**Total Speedup**: ~5-6x faster than baseline!

## ⏱️ Time & Accuracy Summary

### Training Time
- **Total**: ~1 hour 45 minutes (10 epochs)
- **Per Epoch**: ~10.5 minutes average
- **Compared to RTX 5000**: 2.5-3x faster

### Expected Accuracy
- **ROC-AUC**: 0.88-0.92 (target: ≥0.88)
- **PR-AUC**: 0.85-0.90 (target: ≥0.85)
- **Accuracy**: 85-88%
- **F1-Score**: 0.82-0.86

### Resource Usage
- **VRAM**: ~16 GB / 40 GB (40% utilization)
- **GPU Compute**: 88-95%
- **Tensor Cores**: Fully utilized
- **Memory Available**: 24 GB headroom

## 📊 What's Different from Before?

### Old Configuration (RTX 5000):
```python
batch_size = 48
learning_rate = 2e-5
mixed_precision = False (implied)
num_workers = 4
# Training time: ~4-5 hours
```

### New Configuration (A100):
```python
batch_size = 128
gradient_accumulation_steps = 2  # Effective: 256
learning_rate = 3e-5
mixed_precision = True
compile_model = True
num_workers = 8
pin_memory = True
prefetch_factor = 2
# Training time: ~1.75 hours
```

## 🎯 Performance Expectations by Epoch

```
Epoch 1:  ROC-AUC ~0.72 | Loss ~0.85 | Time ~12 min (compilation overhead)
Epoch 2:  ROC-AUC ~0.78 | Loss ~0.68 | Time ~12 min
Epoch 3:  ROC-AUC ~0.82 | Loss ~0.58 | Time ~10 min (encoder unfrozen)
Epoch 5:  ROC-AUC ~0.86 | Loss ~0.48 | Time ~10 min
Epoch 7:  ROC-AUC ~0.88 | Loss ~0.42 | Time ~10 min
Epoch 10: ROC-AUC ~0.90 | Loss ~0.38 | Time ~10 min ⭐ Best model
```

## 🔍 Monitoring During Training

Open a second terminal and run:
```bash
# Watch GPU utilization
watch -n 1 nvidia-smi

# Or use htop for CPU
htop
```

Expected output in `nvidia-smi`:
```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 525.x.xx   Driver Version: 525.x.xx   CUDA Version: 12.0      |
|-------------------------------+----------------------+----------------------+
|   0  NVIDIA A100-PCIE   On   | 00000000:00:00.0 Off |                    0 |
| N/A   45C    P0    220W / 250W |  16000MiB / 40960MiB |     92%      Default |
+-------------------------------+----------------------+----------------------+
```

## ✅ Training Checklist

- [ ] `.venv` virtual environment exists
- [ ] All requirements installed (`requirements-ml.txt`)
- [ ] CUDA/GPU available (check with `nvidia-smi`)
- [ ] A100 or compatible GPU detected
- [ ] At least 20GB free disk space
- [ ] Script is executable (`chmod +x TRAIN_A100.sh`)
- [ ] In project root directory
- [ ] Ready to train! 🚀

## 📁 Output Files

After training completes:
```
backend/models/code_detector/
├── best_model_auc_0.XXXX.pt     # Best performing model
├── tokenizer/
│   ├── config.json
│   ├── tokenizer.json
│   └── vocab.txt
└── training_log.txt              # Detailed logs
```

## 🐛 Troubleshooting

### OOM Error
```python
# Reduce batch size in train_detector.py
batch_size = 96  # Instead of 128
```

### Slow Training
- Check GPU utilization: `nvidia-smi`
- Should be >85%, if not:
  - Increase `num_workers` to 12
  - Check CPU isn't bottleneck
  - Verify SSD/NVMe for dataset

### Compilation Warning
```
This is normal for first epoch
PyTorch 2.0+ compilation takes ~1-2 min
Subsequent epochs will be faster
```

## 📖 Full Documentation

See [A100_TRAINING_ESTIMATES.md](./A100_TRAINING_ESTIMATES.md) for:
- Detailed optimization explanations
- Advanced tuning options
- Multi-GPU setup
- Accuracy improvement tips
- Production deployment guide

---

**Ready to train?** Run `./TRAIN_A100.sh` and grab a coffee! ☕

The model will be ready in ~2 hours with excellent accuracy for your plagiarism detection system.
