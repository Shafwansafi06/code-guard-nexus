# Render Deployment

1. Go to https://render.com
2. Sign up / Login
3. New → Web Service
4. Connect GitHub repo: `code-guard-nexus`
5. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     - Add all from `.env` (Supabase URLs, keys, etc.)
6. Deploy!

Your backend URL will be: `https://your-app-name.onrender.com`

Then update frontend `.env`:
```
VITE_API_URL=https://your-app-name.onrender.com/api/v1
```
