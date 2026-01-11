# ML Model Training Guide

## Overview

This guide will help you train the dual-head code similarity and AI detection model for CodeGuard Nexus.

## Architecture

**DualHeadCodeModel** consists of:
- **Backbone**: CodeBERT/UniXcoder (microsoft/codebert-base or microsoft/unixcoder-base)
- **Projection Head**: For contrastive learning (768 → 256 dimensions)
- **Classification Head**: Binary classifier for AI vs Human detection

**Training Objectives**:
1. **Contrastive Learning** (InfoNCE loss): Learn code similarity in embedding space
2. **Classification**: Detect AI-generated code

## Prerequisites

### 1. Install ML Dependencies

```bash
cd backend
pip install -r requirements-ml.txt
```

**Required packages**:
- `torch>=2.0.0` - PyTorch framework
- `transformers>=4.30.0` - Hugging Face transformers
- `datasets>=2.14.0` - Dataset loading
- `scikit-learn>=1.3.0` - Metrics and preprocessing
- `accelerate>=0.20.0` - Distributed training support

### 2. Hardware Requirements

**Minimum**:
- CPU: 8 cores
- RAM: 16GB
- Storage: 20GB free

**Recommended**:
- GPU: NVIDIA GPU with 8GB+ VRAM (e.g., RTX 3070, A100)
- RAM: 32GB
- Storage: 50GB SSD

**Training Time Estimates**:
- CPU only: ~24-48 hours
- Single GPU (RTX 3070): ~4-8 hours
- Multi-GPU (4x A100): ~1-2 hours

### 3. Datasets

The model will automatically download:

1. **Rosetta Code** (`christopher/rosetta-code`): ~79,000 code examples in 200+ languages
2. **MultiAIGCD**: AI-generated code detection dataset
3. **Source Code Plagiarism**: Plagiarism pairs dataset

Total download size: ~2-3GB

## Training Steps

### Step 1: Configure Training Parameters

Edit `backend/app/services/train_detector.py`:

```python
config = {
    'model_name': 'microsoft/codebert-base',  # or 'microsoft/unixcoder-base'
    'batch_size': 32,  # Reduce to 16 or 8 if OOM errors
    'learning_rate': 2e-5,
    'num_epochs': 10,
    'embedding_dim': 256,
    'max_length': 512,
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',
    'lambda_contrastive': 0.5,  # Weight for contrastive loss
    'lambda_classification': 0.5,  # Weight for classification loss
    'output_dir': './models/code_detector',
    'warmup_steps': 500,
    'gradient_clip': 1.0,
}
```

**Key parameters**:
- `batch_size`: Higher = faster training, but more memory. Reduce if OOM errors.
- `learning_rate`: 2e-5 is standard for fine-tuning CodeBERT
- `num_epochs`: 10 is a good starting point
- `lambda_contrastive` / `lambda_classification`: Balance between objectives (0.5 each = equal weight)

### Step 2: Run Training

```bash
cd backend

# Option 1: Basic training (CPU/single GPU)
python -m app.services.train_detector

# Option 2: With GPU specification
CUDA_VISIBLE_DEVICES=0 python -m app.services.train_detector

# Option 3: With experiment tracking (WandB)
wandb login
python -m app.services.train_detector --use-wandb

# Option 4: Distributed training (multiple GPUs)
accelerate config  # Configure distributed settings
accelerate launch app/services/train_detector.py
```

### Step 3: Monitor Training

The script will output:

```
Epoch 1/10
Loading Rosetta Code dataset...
Loaded 79,234 code examples
Preparing training data...
Training: 100%|██████████| 2476/2476 [1:23:45<00:00, 2.03s/batch]
Train Loss: 1.234, Contrastive: 0.678, Classification: 0.556
Validation: 100%|██████████| 310/310 [05:12<00:00, 1.01s/batch]
Val Loss: 0.987, Val ROC-AUC: 0.923, Val Accuracy: 0.891
✓ Best model saved (ROC-AUC: 0.923)
```

**Key metrics**:
- **Contrastive Loss**: Should decrease to ~0.3-0.5
- **Classification Loss**: Should decrease to ~0.2-0.4
- **ROC-AUC**: Target >0.90 (excellent), >0.85 (good)
- **Accuracy**: Target >0.85

### Step 4: Training Stages

The training uses a **freeze-unfreeze strategy**:

**Stage 1 (Epochs 1-3)**: Freeze backbone, train heads only
- Faster convergence for task-specific heads
- Prevents catastrophic forgetting of pre-trained knowledge

**Stage 2 (Epochs 4-10)**: Unfreeze backbone, train entire model
- Fine-tune entire model for domain adaptation
- Lower learning rate to avoid overfitting

### Step 5: Handle Common Issues

**Out of Memory (OOM)**:
```python
# Reduce batch size
config['batch_size'] = 16  # or 8

# Reduce max sequence length
config['max_length'] = 256  # from 512
```

**Training too slow**:
```python
# Enable mixed precision training
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

# In training loop:
with autocast():
    outputs = model(input_ids, attention_mask)
    loss = criterion(outputs, labels)
scaler.scale(loss).backward()
```

**Poor performance**:
- Increase training epochs to 15-20
- Try different backbone: `microsoft/graphcodebert-base`
- Adjust loss weights: `lambda_contrastive=0.7, lambda_classification=0.3`
- Add data augmentation

## Post-Training

### Model Artifacts

After training, you'll have:

```
backend/models/code_detector/
├── pytorch_model.bin          # Trained model weights (300MB)
├── config.json                # Model configuration
├── tokenizer_config.json      # Tokenizer settings
├── vocab.txt                  # Vocabulary
├── training_history.json      # Loss/metrics over epochs
└── README.md                  # Model card
```

### Evaluate Model

```python
from app.services.inference import CodeDetectorInference

# Load trained model
detector = CodeDetectorInference(model_path='./models/code_detector')

# Test AI detection
result = detector.detect_ai("""
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
""", language="python")

print(f"AI Score: {result['ai_score']:.3f}")
print(f"Is AI: {result['is_ai']}")
print(f"Risk Level: {result['risk_level']}")

# Test similarity
similarity = detector.compute_similarity(code1, code2, "python", "python")
print(f"Similarity: {similarity:.3f}")
```

### Integrate with API

The model is automatically loaded by FastAPI on startup:

```bash
# Start backend with trained model
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Test API endpoint
curl -X POST "http://localhost:8000/api/v1/ml/detect-ai" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "def hello(): print(\"Hello World\")",
    "language": "python"
  }'
```

## Advanced Training Options

### Transfer Learning from Pre-trained Model

If you have a pre-trained model from similar domain:

```python
# Load checkpoint
checkpoint = torch.load('path/to/pretrained_model.pt')
model.load_state_dict(checkpoint['model_state_dict'], strict=False)
```

### Data Augmentation

Add code transformations:

```python
def augment_code(code: str, language: str) -> str:
    """Apply random transformations"""
    transformations = [
        rename_variables,
        reorder_functions,
        add_comments,
        change_formatting,
    ]
    return random.choice(transformations)(code)
```

### Hyperparameter Tuning

Use Optuna for automatic tuning:

```python
import optuna

def objective(trial):
    lr = trial.suggest_loguniform('lr', 1e-6, 1e-4)
    batch_size = trial.suggest_categorical('batch_size', [8, 16, 32])
    lambda_c = trial.suggest_uniform('lambda_c', 0.3, 0.7)
    
    # Train model with these params
    val_auc = train_model(lr, batch_size, lambda_c)
    return val_auc

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=20)
```

### Continuous Training

Update model with new data:

```python
# Load existing model
model = DualHeadCodeModel.from_pretrained('./models/code_detector')

# Continue training with new data
trainer = CodeDetectorTrainer(model, config)
trainer.train(new_train_dataset, new_val_dataset, start_epoch=11)
```

## Production Deployment

### Model Optimization

**Quantization** (reduce size, faster inference):
```python
import torch.quantization as quantization

model_int8 = quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)
torch.save(model_int8.state_dict(), 'model_int8.pt')
```

**ONNX Export** (cross-platform):
```python
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    opset_version=14,
    input_names=['input_ids', 'attention_mask'],
    output_names=['embeddings', 'logits']
)
```

### Model Serving

**Option 1: FastAPI** (included in this project)
- API endpoints at `/api/v1/ml/*`
- Built-in authentication
- Request/response validation

**Option 2: TorchServe**
```bash
torch-model-archiver --model-name code_detector \
  --version 1.0 \
  --model-file model.py \
  --serialized-file pytorch_model.bin \
  --handler handler.py

torchserve --start --model-store model_store --models code_detector.mar
```

**Option 3: Cloud (AWS SageMaker, Azure ML)**
- Scalable infrastructure
- Auto-scaling
- Managed endpoints

## Monitoring & Maintenance

### Track Model Performance

```python
# Log predictions for monitoring
from app.core.database import supabase

supabase.table('ml_predictions').insert({
    'model_version': '1.0',
    'prediction': result,
    'confidence': confidence,
    'timestamp': datetime.now()
}).execute()
```

### Retrain Schedule

- **Weekly**: Quick fine-tuning on new submissions
- **Monthly**: Full retraining with updated datasets
- **Quarterly**: Architecture updates and ablation studies

### A/B Testing

```python
# Serve multiple model versions
models = {
    'v1.0': CodeDetectorInference('./models/v1.0'),
    'v1.1': CodeDetectorInference('./models/v1.1'),
}

# Random assignment
model = random.choice(['v1.0', 'v1.1'])
result = models[model].detect_ai(code)
```

## Troubleshooting

### Issue: CUDA out of memory

**Solution**:
- Reduce `batch_size` to 8 or 4
- Reduce `max_length` to 256
- Enable gradient checkpointing
- Use mixed precision training

### Issue: Model underfitting (low accuracy)

**Solution**:
- Increase `num_epochs` to 20
- Increase model capacity (larger backbone)
- Add more training data
- Reduce regularization (dropout)

### Issue: Model overfitting (train >> val accuracy)

**Solution**:
- Add dropout layers (0.1-0.3)
- Use data augmentation
- Reduce model capacity
- Early stopping on validation loss

### Issue: Training stuck (loss not decreasing)

**Solution**:
- Check learning rate (try 1e-5 or 5e-5)
- Check gradient flow (use gradient clipping)
- Verify data quality (check for NaN/Inf)
- Try different optimizer (AdamW → SGD)

## Resources

- **CodeBERT Paper**: https://arxiv.org/abs/2002.08155
- **UniXcoder Paper**: https://arxiv.org/abs/2203.03850
- **Contrastive Learning**: https://arxiv.org/abs/2002.05709
- **Hugging Face Docs**: https://huggingface.co/docs/transformers

## Next Steps

After training completes:

1. ✅ Test model with `inference.py`
2. ✅ Integrate with FastAPI endpoints (`/api/v1/ml/*`)
3. ✅ Update frontend to call ML API
4. ✅ Set up analysis workers for batch processing
5. ✅ Deploy to production
6. 📊 Monitor performance and retrain as needed

For questions or issues, please refer to the main [README.md](../README.md) or open an issue on GitHub.
