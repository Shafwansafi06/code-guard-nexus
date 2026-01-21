# Quick Deployment Reference

## 🚀 Deploy Everything (5 Minutes)

```bash
# 1. Install CLIs
npm install -g @railway/cli vercel

# 2. Run deployment script
./deploy.sh

# 3. Set environment variables in dashboards
# Railway: https://railway.app/dashboard
# Vercel: https://vercel.com/dashboard

# Done! 🎉
```

---

## 📦 What Gets Deployed Where

| Component | Platform | Cost | Setup Time |
|-----------|----------|------|------------|
| Backend API | Railway | $5-20/mo | 5 min |
| Frontend | Vercel | Free | 3 min |
| Database | Supabase | Free-$25/mo | Already setup |
| ML Models | Embedded | Included | No extra setup |

---

## 🔑 Required Environment Variables

### Railway (Backend)
```
ENVIRONMENT=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
SECRET_KEY=<generate with: openssl rand -hex 32>
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-api.railway.app/api/v1
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## ✅ Post-Deployment Checklist

1. [ ] Test health endpoint: `curl https://your-api.railway.app/health`
2. [ ] Update Google OAuth redirect URIs
3. [ ] Test login flow
4. [ ] Test Google Classroom import
5. [ ] Test plagiarism detection
6. [ ] Monitor error rates (Railway dashboard)

---

## 🆘 Quick Fixes

### Backend won't start
```bash
railway logs  # Check error messages
```

### Frontend blank page
- Check browser console
- Verify VITE_API_URL is set
- Check CORS settings

### ML not working
```bash
# Verify models exist
railway run ls -lh models/
```

---

## 📊 Monitoring URLs

- **Backend Health:** https://your-api.railway.app/health
- **Backend Metrics:** Railway Dashboard
- **Frontend Analytics:** Vercel Dashboard
- **Database:** Supabase Dashboard
- **API Docs:** https://your-api.railway.app/api/v1/docs

---

## 💰 Cost Breakdown

**Free Tier (0-100 users):**
- Vercel: Free
- Supabase: Free
- Railway: $5/mo
- **Total: $5/mo**

**Growth (100-1000 users):**
- Vercel: Free
- Supabase: $25/mo
- Railway: $20/mo
- **Total: $45/mo**

---

## 🔄 Update Deployment

```bash
# Backend changes
cd backend
git push  # Railway auto-deploys on git push

# Frontend changes
cd ..
git push  # Vercel auto-deploys on git push

# Manual deploy
vercel --prod  # Frontend
railway up     # Backend
```

---

## 📞 Support Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com

---

## 🎯 Production Ready Features

✅ Health checks
✅ Error tracking ready (add Sentry)
✅ CORS configured
✅ Environment-based config
✅ ML models optimized (ONNX)
✅ Database connection pooling
✅ Automatic SSL/HTTPS
✅ Git-based deployments

---

## 🏗️ Architecture Overview

```
User Browser
    ↓
Vercel (Frontend) → Railway (Backend API) → Supabase (Database)
                         ↓
                    ONNX Models (Embedded)
                         ↓
                    Google Classroom API
```

---

## 🔐 Security Checklist

- [x] Environment variables not in code
- [x] Supabase RLS policies enabled
- [x] HTTPS enforced (automatic)
- [x] CORS properly configured
- [x] API rate limiting (add if needed)
- [x] Secrets in secure storage
- [x] JWT token expiration set

---

Need detailed instructions? See [DEPLOYMENT.md](DEPLOYMENT.md)
