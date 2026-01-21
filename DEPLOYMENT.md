# CodeGuard Nexus - Production Deployment Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Backend Deployment](#backend-deployment)
4. [ML Model Deployment](#ml-model-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Overview

CodeGuard Nexus requires three main components to be deployed:

1. **Backend API** (FastAPI) - Handles business logic, ML inference, Google Classroom integration
2. **Frontend** (React + Vite) - User interface
3. **Database** (Supabase) - PostgreSQL with auth and storage

### Recommended Stack
- **Backend:** Railway.app or Google Cloud Run
- **Frontend:** Vercel or Netlify
- **Database:** Supabase (already hosted)
- **ML Models:** Embedded in backend (ONNX)

---

## 🚀 Quick Start (Easiest Path)

### Prerequisites
```bash
# Install CLIs
npm install -g @railway/cli vercel

# Check Python version (3.11+ required)
python3 --version

# Install backend dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-ml.txt
```

### One-Command Deployment
```bash
# From project root
./deploy.sh
```

This script will:
1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Provide URLs for both services

---

## Backend Deployment

### Option 1: Railway (Recommended)

**Why Railway?**
- ✅ Easy deployment
- ✅ Automatic SSL
- ✅ Built-in monitoring
- ✅ Free tier available
- ✅ Supports Python + ML libraries

**Steps:**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   railway init
   railway up
   ```

4. **Set Environment Variables** (in Railway dashboard)
   ```
   ENVIRONMENT=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   SECRET_KEY=generate_secure_key_here
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
   ENABLE_GPU=False
   ```

5. **Add Custom Domain** (optional)
   - Go to Railway dashboard
   - Settings → Domains → Add Custom Domain

### Option 2: Docker + Any Cloud Platform

**Build and Test Locally:**
```bash
cd backend
docker build -t codeguard-backend .
docker run -p 8000:8000 --env-file .env codeguard-backend
```

**Deploy to Cloud:**
- **Google Cloud Run:** `gcloud run deploy`
- **AWS ECS:** Use ECR + ECS
- **DigitalOcean:** Use App Platform or Droplet

### Option 3: Traditional VPS (DigitalOcean, Linode)

1. **Setup Server**
   ```bash
   # On your server
   sudo apt update
   sudo apt install python3.11 python3-pip nginx
   ```

2. **Clone and Setup**
   ```bash
   git clone your-repo
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Run with Systemd**
   Create `/etc/systemd/system/codeguard.service`:
   ```ini
   [Unit]
   Description=CodeGuard Nexus API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/codeguard/backend
   Environment="PATH=/var/www/codeguard/backend/venv/bin"
   ExecStart=/var/www/codeguard/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

   [Install]
   WantedBy=multi-user.target
   ```

4. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## ML Model Deployment

See [ML_DEPLOYMENT.md](ML_DEPLOYMENT.md) for detailed ML deployment strategies.

### Quick ML Setup for Production

1. **Ensure Models are Present**
   ```bash
   cd backend
   ls -lh models/
   # Should see: code_clone_detector.onnx
   ```

2. **Models are Embedded** - No separate deployment needed!
   - ONNX models are included in the backend deployment
   - Uses CPU inference by default (works everywhere)
   - Memory usage: ~600MB

3. **For GPU Inference** (optional, for high load)
   - Use Cloud Run with GPU
   - Or deploy to AWS EC2 with GPU instance
   - Set `ENABLE_GPU=True` in environment variables

### Model Updates

To deploy updated models:
```bash
# 1. Train new model
python backend/fine_tune_model.py

# 2. Export to ONNX
python backend/export_to_onnx.py

# 3. Test
python backend/tests/test_ml_integration.py

# 4. Redeploy backend
railway up
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build and Deploy**
   ```bash
   # From project root
   vercel --prod
   ```

3. **Set Environment Variables** (in Vercel dashboard)
   ```
   VITE_API_URL=https://your-backend.railway.app/api/v1
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Configure Git Integration** (recommended)
   - Connect your GitHub repo
   - Auto-deploy on push to main branch

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

### Option 3: Self-Hosted (Nginx)

```bash
# Build locally
npm run build

# Upload dist/ folder to server
scp -r dist/* user@server:/var/www/html/

# Configure Nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Database Setup

### Supabase (Current Setup)

Your database is already on Supabase! Just need to:

1. **Use Production Supabase Project**
   - Create new project for production (separate from dev)
   - Or upgrade existing project

2. **Run Migrations**
   ```bash
   cd backend/database/migrations
   # Apply migrations to production database
   ```

3. **Configure Row Level Security**
   - Already configured in your schema
   - Verify policies are active

4. **Backup Strategy**
   - Enable automated backups in Supabase dashboard
   - Export schema regularly

---

## Environment Variables

### Backend (.env.production)

```bash
# Environment
ENVIRONMENT=production
DEBUG=False

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Security
SECRET_KEY=generate_with_openssl_rand_hex_32
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://www.your-domain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/auth/google/callback

# ML
MODEL_PATH=./models
ENABLE_GPU=False
MODEL_CACHE_SIZE=100

# Performance
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

### Frontend (.env.production)

```bash
VITE_API_URL=https://your-backend.railway.app/api/v1
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Generate Secure Keys

```bash
# SECRET_KEY
openssl rand -hex 32

# Or using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Post-Deployment

### 1. Update Google OAuth Settings

In [Google Cloud Console](https://console.cloud.google.com):
- Go to APIs & Services → Credentials
- Edit OAuth 2.0 Client
- Add Authorized Redirect URIs:
  ```
  https://your-frontend.vercel.app/auth/google/callback
  https://your-backend.railway.app/api/v1/google-classroom/auth/callback
  ```
- Add Authorized JavaScript Origins:
  ```
  https://your-frontend.vercel.app
  ```

### 2. Test Deployment

```bash
# Health check
curl https://your-backend.railway.app/health

# API test
curl https://your-backend.railway.app/api/v1/

# ML endpoint test
curl https://your-backend.railway.app/api/v1/ml/status
```

### 3. Configure Custom Domains (Optional)

**Backend:**
- Railway: Settings → Domains → Add Custom Domain
- Add DNS records as instructed

**Frontend:**
- Vercel: Settings → Domains → Add Custom Domain
- Update DNS

### 4. Setup Monitoring

**Basic Monitoring (Free):**
- Railway: Built-in metrics dashboard
- Vercel: Analytics dashboard
- Supabase: Database metrics

**Advanced Monitoring (Optional):**
```bash
# Install Sentry for error tracking
pip install sentry-sdk
```

Add to `backend/app/main.py`:
```python
import sentry_sdk

if settings.is_production:
    sentry_sdk.init(
        dsn="your-sentry-dsn",
        environment="production"
    )
```

---

## Monitoring & Maintenance

### Health Checks

Monitor these endpoints:
- `GET /health` - Basic health check
- `GET /ready` - Database connectivity check
- `GET /api/v1/ml/status` - ML service status

### Key Metrics to Watch

1. **Response Time**
   - Target: < 500ms for API calls
   - Target: < 2s for ML inference

2. **Error Rate**
   - Target: < 1% error rate

3. **Resource Usage**
   - Memory: Monitor for leaks
   - CPU: Should be < 70% average

### Backup Strategy

1. **Database**
   - Automated daily backups (Supabase)
   - Weekly exports for safety

2. **Models**
   - Version control in git
   - Store production models in cloud storage

3. **Configuration**
   - Keep `.env.production.example` updated
   - Document any infrastructure changes

### Scaling Considerations

**When to Scale:**
- Response time > 2s
- CPU usage > 80%
- Error rate > 5%
- More than 1000 active users

**How to Scale:**
1. **Vertical:** Upgrade Railway plan (more RAM/CPU)
2. **Horizontal:** Add more workers (`--workers 8`)
3. **Separate ML:** Move ML to dedicated service
4. **CDN:** Add CloudFlare for static assets
5. **Caching:** Add Redis for frequently accessed data

---

## Deployment Checklist

Before going live:

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible  
- [ ] Environment variables set correctly
- [ ] Google OAuth configured with production URLs
- [ ] Database migrations applied
- [ ] ML models loaded successfully
- [ ] Health checks passing
- [ ] Error tracking configured
- [ ] Backup strategy in place
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates active
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Monitoring dashboards set up
- [ ] Documentation updated
- [ ] Team trained on new deployment

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
railway logs

# Common issues:
# - Missing environment variables
# - Model files not found
# - Database connection failed
```

### ML inference failing
```bash
# Check model file
ls -lh backend/models/

# Test locally
cd backend
python3 -c "import onnxruntime; print(onnxruntime.__version__)"
```

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify `VITE_API_URL` in frontend
- Check network tab in browser DevTools

### Database connection issues
- Verify Supabase keys are correct
- Check Supabase project is not paused
- Test connection with SQL Editor in Supabase dashboard

---

## Cost Estimation

### Small Scale (< 100 users)
- **Railway:** $5/month (Hobby plan)
- **Vercel:** Free tier
- **Supabase:** Free tier
- **Total:** ~$5/month

### Medium Scale (100-1000 users)
- **Railway:** $20/month (Pro plan)
- **Vercel:** Free tier
- **Supabase:** $25/month (Pro plan)
- **Total:** ~$45/month

### Large Scale (1000+ users)
- **Cloud Run/Kubernetes:** $100-500/month
- **Vercel:** $20/month (Pro plan)
- **Supabase:** $25-100/month
- **Total:** ~$145-620/month

---

## Support & Next Steps

1. **Deploy to Railway:** `./deploy.sh`
2. **Monitor health:** Check Railway dashboard
3. **Test thoroughly:** Create test assignments
4. **Gather feedback:** Monitor error rates
5. **Iterate:** Deploy updates regularly

For issues, check:
- Railway logs
- Vercel deployment logs
- Supabase logs
- Browser console

Good luck with your deployment! 🚀
