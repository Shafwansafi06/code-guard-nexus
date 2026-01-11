# 🚀 CodeGuard Nexus - Quick Reference

## One-Command Setup
```bash
./setup.sh  # Automated setup (recommended)
```

## Manual Commands

### Start Development Servers
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2: Frontend
npm run dev
```

### Access Points
- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/api/v1/docs

## Training ML Model
```bash
cd backend
source venv/bin/activate
pip install -r requirements-ml.txt
python -m app.services.train_detector

# Training time: 4-8 hours (GPU) / 24-48 hours (CPU)
```

## API Quick Test
```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Detect AI code
curl -X POST "http://localhost:8000/api/v1/ml/detect-ai" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "def hello(): print(\"Hi\")", "language": "python"}'
```

## Database Connection
```python
# backend/app/core/database.py
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
```

## Common Tasks

### Add New API Endpoint
```python
# backend/app/api/your_module.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def your_endpoint():
    return {"message": "Hello"}
```

### Use ML Inference
```python
from app.services.inference import get_detector

detector = get_detector()
result = detector.detect_ai(code, language)
similarity = detector.compute_similarity(code1, code2)
```

### Create Frontend API Call
```typescript
// src/lib/api.ts
import { apiClient } from './api';

const response = await apiClient.get('/endpoint');
```

## Deployment

### Railway (Backend)
```bash
railway login
railway init
railway up
```

### Vercel (Frontend)
```bash
vercel login
vercel deploy
```

### Docker
```bash
docker-compose up -d
```

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SECRET_KEY=your-jwt-secret
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Import errors | `pip install -r requirements.txt` / `npm install` |
| Port in use | Change port: `uvicorn app.main:app --port 8001` |
| CUDA OOM | Reduce batch_size in config to 8 or 4 |
| Token expired | Check interceptors in `lib/api.ts` |
| Model not found | Run `python -m app.services.train_detector` |

## Key Files

- `backend/app/main.py` - FastAPI app entry
- `backend/app/api/ml_analysis.py` - ML endpoints
- `backend/app/services/train_detector.py` - Training script
- `backend/app/services/inference.py` - Inference service
- `src/lib/api.ts` - Frontend API client
- `src/contexts/AuthContext.tsx` - Auth state

## Performance

| Operation | Time |
|-----------|------|
| AI Detection | ~100-200ms |
| Similarity (pair) | ~150-300ms |
| Batch Analysis (100 files) | ~10-15s |
| Model Training | 4-8h (GPU) |

## Metrics Targets

- ROC-AUC: >0.90
- Accuracy: >0.85
- API Response: <500ms (p95)
- Uptime: >99.9%

## Resources

- [Full Documentation](./README.md)
- [ML Training Guide](./backend/ML_TRAINING_GUIDE.md)
- [System Summary](./SYSTEM_SUMMARY.md)
- [API Docs](http://localhost:8000/api/v1/docs)

---

Need help? Check documentation or open an issue on GitHub.
