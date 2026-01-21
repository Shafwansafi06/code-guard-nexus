# ML Model Deployment Strategy

## Current Status
- ✅ Models trained and converted to ONNX format
- ✅ ONNX runtime integration in backend
- ⚠️  Models need to be optimized for production

## Production ML Architecture

### Option 1: Embedded ML (Recommended for MVP)
Deploy ML models directly with the backend API.

**Pros:**
- Simple deployment
- Low latency
- No additional services needed

**Cons:**
- Increases backend memory usage
- Slower cold starts

**Implementation:**
```python
# Already implemented in backend/app/services/ml_service.py
# Uses ONNX Runtime for fast CPU inference
```

### Option 2: Separate ML Service
Run ML models as a separate microservice.

**Pros:**
- Independent scaling
- Better resource management
- Can use GPU instances

**Cons:**
- More complex architecture
- Network latency between services

## Deployment Steps

### 1. Prepare Models for Production

```bash
# Navigate to backend
cd backend

# Ensure ONNX models are present
ls -lh models/

# Expected files:
# - code_clone_detector.onnx
# - tokenizer/  (directory with tokenizer files)
```

### 2. Model Optimization (Optional but Recommended)

For better performance, optimize ONNX models:

```python
# optimize_model.py
import onnx
from onnxruntime.transformers import optimizer

model_path = "models/code_clone_detector.onnx"
optimized_path = "models/code_clone_detector_optimized.onnx"

# Load model
model = onnx.load(model_path)

# Optimize
optimized_model = optimizer.optimize_model(
    model_path,
    model_type='bert',
    num_heads=12,
    hidden_size=768
)

optimized_model.save_model_to_file(optimized_path)
print(f"✅ Optimized model saved to {optimized_path}")
```

### 3. Upload Models to Cloud Storage

For production, store models in cloud storage and download on startup:

```bash
# Using Google Cloud Storage
gsutil cp models/*.onnx gs://your-bucket/models/

# Using AWS S3
aws s3 sync models/ s3://your-bucket/models/

# Using Azure Blob Storage
az storage blob upload-batch -d models -s models/ --account-name youraccount
```

### 4. Update Backend to Load Models from Cloud

```python
# backend/app/services/ml_service.py

import os
from google.cloud import storage  # or boto3 for AWS

class MLService:
    def __init__(self):
        model_path = self._download_model_if_needed()
        self.session = ort.InferenceSession(
            model_path,
            providers=['CPUExecutionProvider']
        )
    
    def _download_model_if_needed(self):
        local_path = "models/code_clone_detector.onnx"
        
        if os.path.exists(local_path):
            return local_path
        
        # Download from cloud storage
        if os.getenv('MODEL_STORAGE_URL'):
            self._download_from_cloud(local_path)
        
        return local_path
```

### 5. GPU vs CPU Inference

**For CPU-only deployment (Railway, most cloud platforms):**
```python
providers=['CPUExecutionProvider']
```

**For GPU deployment (if available):**
```python
providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
```

## Model Training Pipeline

### Periodic Retraining Workflow

1. **Collect Training Data**
   - Export submissions from database
   - Label plagiarism cases
   - Generate negative examples

2. **Train on GPU Environment**
   ```bash
   # On Google Colab or local GPU machine
   python backend/fine_tune_model.py
   ```

3. **Export to ONNX**
   ```bash
   python backend/export_to_onnx.py
   ```

4. **Test Model**
   ```bash
   python backend/tests/test_ml_integration.py
   ```

5. **Deploy New Model**
   ```bash
   # Upload to cloud storage
   gsutil cp models/code_clone_detector.onnx gs://your-bucket/models/

   # Trigger model reload in production (implement hot-reload)
   curl -X POST https://your-api.com/api/v1/ml/reload-model \
     -H "Authorization: Bearer admin-token"
   ```

## Performance Considerations

### Memory Usage
- Base ONNX model: ~400MB
- Runtime overhead: ~200MB
- Total: ~600MB per worker

### Inference Speed
- CPU: ~100-200ms per comparison
- GPU: ~20-50ms per comparison

### Scaling Recommendations
- **< 100 users:** Single instance with embedded ML
- **100-1000 users:** Multiple instances with load balancing
- **1000+ users:** Separate ML service with autoscaling

## Monitoring & Maintenance

### Key Metrics to Track
```python
# Add to ML service
import time
from prometheus_client import Histogram

INFERENCE_TIME = Histogram('ml_inference_seconds', 'Time spent on ML inference')

@INFERENCE_TIME.time()
def detect_plagiarism(code1, code2):
    # ... inference code
    pass
```

### Model Versioning
```
models/
  v1/
    code_clone_detector.onnx
    tokenizer/
  v2/
    code_clone_detector.onnx
    tokenizer/
  current -> v2/  # symlink to active version
```

## Cost Optimization

### For Small Scale (< 100 users)
- **Railway/Render:** $5-20/month
- Use CPU inference
- Single instance deployment

### For Medium Scale (100-1000 users)
- **Cloud Run/App Engine:** Pay per use ($20-100/month)
- Use CPU inference
- Auto-scaling enabled

### For Large Scale (1000+ users)
- **Kubernetes + GPU nodes:** $200+/month
- Use GPU for ML inference
- Separate ML service
- Model caching and batching

## Quick Start for Production

1. **Deploy with CPU inference (fastest):**
   ```bash
   cd backend
   ./deploy-railway.sh
   ```

2. **Set environment variables in Railway dashboard:**
   ```
   ENABLE_GPU=False
   MODEL_PATH=./models
   MODEL_CACHE_SIZE=100
   ```

3. **Verify ML endpoint:**
   ```bash
   curl https://your-api.railway.app/api/v1/ml/status
   ```

## Troubleshooting

### Model Not Loading
```python
# Check model file exists
import os
print(os.path.exists('models/code_clone_detector.onnx'))

# Check ONNX Runtime
import onnxruntime as ort
print(ort.get_available_providers())
```

### Out of Memory
- Reduce `MODEL_CACHE_SIZE`
- Use model quantization
- Increase server memory

### Slow Inference
- Enable model caching
- Use batch processing for multiple comparisons
- Consider GPU deployment
