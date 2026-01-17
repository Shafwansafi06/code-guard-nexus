# 🚀 Google Classroom Integration - Quick Start

Get your Google Classroom integration up and running in 15 minutes!

---

## Prerequisites Checklist

- [ ] Google Account (Gmail or Workspace)
- [ ] CodeGuard Nexus backend running
- [ ] CodeGuard Nexus frontend running
- [ ] Access to Google Cloud Console

---

## 5-Step Setup

### Step 1: Google Cloud Console (5 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project: **"CodeGuard Nexus"**
3. Enable API:
   - Search "Google Classroom API"
   - Click **Enable**

---

### Step 2: OAuth Setup (5 min)

1. **OAuth Consent Screen:**
   - Go to **APIs & Services → OAuth consent screen**
   - Choose **External** user type
   - Fill in app name: **"CodeGuard Nexus"**
   - Add your email
   - Click **Save and Continue**
   - **Add scopes:** Click "Add or Remove Scopes" → Filter for "classroom" → Select all read-only scopes
   - **Add test users:** Add your email address
   - Click **Save and Continue**

2. **Create Credentials:**
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: **"CodeGuard Nexus Web Client"**
   - Authorized redirect URIs:
     ```
     http://localhost:5173/auth/google/callback
     ```
   - Click **Create**
   - **Download JSON** (rename to `client_secret.json`)

---

### Step 3: Backend Configuration (2 min)

```bash
# 1. Move credentials file
mv ~/Downloads/client_secret_*.json backend/client_secret.json

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Update .env file
echo "GOOGLE_CLIENT_SECRETS_FILE=client_secret.json" >> .env
echo "GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/google/callback" >> .env
```

---

### Step 4: Database Migration (1 min)

**Option A: Using psql**
```bash
psql $SUPABASE_DB_URL -f backend/database/migrations/google_classroom_integration.sql
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Paste contents of `backend/database/migrations/google_classroom_integration.sql`
4. Click **Run**

---

### Step 5: Start & Test (2 min)

```bash
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Start frontend
npm run dev
```

**Test the integration:**
1. Open http://localhost:5173
2. Login to CodeGuard Nexus
3. Go to **Courses** page
4. Click **"Import from Google Classroom"**
5. Authenticate with Google
6. Select courses to import
7. Done! 🎉

---

## ✅ Verification

If everything is working:
- ✅ You see "Connect Google Classroom" button
- ✅ Clicking it opens Google OAuth
- ✅ After auth, you're redirected back
- ✅ You can see your Google Classroom courses
- ✅ You can import courses with one click
- ✅ Imported courses show up in CodeGuard Nexus

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "redirect_uri_mismatch" | Check that redirect URI in Google Console matches `.env` exactly |
| "Access blocked" | Add your email as test user in OAuth consent screen |
| "File not found: client_secret.json" | Move the JSON file to `backend/` directory |
| Backend won't start | Run `pip install -r requirements.txt` |
| "Invalid client_secret" | Re-download credentials from Google Console |

---

## 📖 Need More Help?

- **Full Setup Guide:** [GOOGLE_CLASSROOM_SETUP.md](./GOOGLE_CLASSROOM_SETUP.md)
- **Implementation Details:** [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- **Google Docs:** [developers.google.com/classroom](https://developers.google.com/classroom)

---

## 🎯 What's Next?

After setup, you can:
1. Import multiple courses at once
2. Import assignments from each course
3. View student rosters
4. Start plagiarism detection on imported assignments
5. Sync new assignments as they're created

---

**Happy Teaching! 🎓**

*Integration complete - start detecting plagiarism in imported assignments!*
