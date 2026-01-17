# Google Classroom Integration Setup Guide

This guide will help you integrate Google Classroom with CodeGuard Nexus to automatically import courses, assignments, and student submissions.

## Prerequisites

- Google Account (Workspace or regular Gmail)
- Google Cloud Platform project
- CodeGuard Nexus backend and frontend setup

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select an existing project
3. Give your project a name (e.g., "CodeGuard Nexus Integration")
4. Note your **Project ID** for later use

---

## Step 2: Enable Google Classroom API

1. In your Google Cloud Console, go to **APIs & Services > Library**
2. Search for **"Google Classroom API"**
3. Click on it and press **"Enable"**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **"External"** user type (or **"Internal"** if using Google Workspace)
3. Fill in the required information:
   - **App name**: CodeGuard Nexus
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**

### Add Scopes

5. Click **"Add or Remove Scopes"**
6. Add the following scopes:
   ```
   https://www.googleapis.com/auth/classroom.courses.readonly
   https://www.googleapis.com/auth/classroom.coursework.students.readonly
   https://www.googleapis.com/auth/classroom.rosters.readonly
   https://www.googleapis.com/auth/classroom.student-submissions.students.readonly
   https://www.googleapis.com/auth/classroom.profile.emails
   ```
7. Click **"Update"** and then **"Save and Continue"**

### Add Test Users (if External)

8. Add your email and any other test users
9. Click **"Save and Continue"**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Select **"Web application"**
4. Configure:
   - **Name**: CodeGuard Nexus Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5173/auth/google/callback
     http://localhost:3000/auth/google/callback
     https://your-production-domain.com/auth/google/callback
     ```
5. Click **"Create"**
6. Download the JSON file (it will be named something like `client_secret_xxxxx.json`)

---

## Step 5: Setup Backend Configuration

1. **Rename** the downloaded JSON file to `client_secret.json`
2. **Move** it to your backend directory:
   ```bash
   mv ~/Downloads/client_secret_xxxxx.json /path/to/code-guard-nexus/backend/client_secret.json
   ```
3. **Update** your backend `.env` file:
   ```env
   GOOGLE_CLIENT_SECRETS_FILE=client_secret.json
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/google/callback
   ```

---

## Step 6: Run Database Migration

Execute the SQL migration to add Google Classroom support to your database:

```bash
# Connect to your Supabase database and run:
psql $SUPABASE_DB_URL -f backend/database/migrations/google_classroom_integration.sql
```

Or manually run the SQL in your Supabase SQL Editor:
- Go to your Supabase project
- Navigate to **SQL Editor**
- Paste the contents of `backend/database/migrations/google_classroom_integration.sql`
- Click **"Run"**

---

## Step 7: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## Step 8: Start the Backend

```bash
cd backend
uvicorn app.main:app --reload
```

The API should now be running at `http://localhost:8000`

---

## Step 9: Test the Integration

### From the Frontend:

1. **Start the frontend**:
   ```bash
   npm run dev
   ```

2. **Navigate to Courses page** (`/courses`)

3. **Click "Import from Google Classroom"**

4. **Authenticate** with your Google account

5. **Select courses** to import

6. **Import assignments** from imported courses

---

## API Endpoints

### Authentication

- **GET** `/api/v1/google-classroom/auth/url` - Get OAuth authorization URL
- **POST** `/api/v1/google-classroom/auth/callback` - Handle OAuth callback

### Courses

- **GET** `/api/v1/google-classroom/courses` - List all Google Classroom courses
- **GET** `/api/v1/google-classroom/courses/{course_id}` - Get specific course
- **POST** `/api/v1/google-classroom/import/course` - Import a course

### Assignments

- **GET** `/api/v1/google-classroom/courses/{course_id}/coursework` - List assignments
- **POST** `/api/v1/google-classroom/import/assignment` - Import an assignment

### Sync Status

- **GET** `/api/v1/google-classroom/sync/status` - Get sync status for user

---

## Troubleshooting

### "Access blocked: Authorization Error"

**Solution**: Make sure you've added your email as a test user in the OAuth consent screen.

### "redirect_uri_mismatch"

**Solution**: Verify that your redirect URI in the Google Cloud Console exactly matches the one in your `.env` file.

### "Invalid client_secret.json"

**Solution**: Re-download the credentials file from Google Cloud Console and ensure it's properly placed in the backend directory.

### "User not authenticated with Google Classroom"

**Solution**: Complete the OAuth flow by clicking "Import from Google Classroom" and authorizing the app.

---

## Security Considerations

1. **Never commit** `client_secret.json` to version control
2. Add it to `.gitignore`:
   ```
   backend/client_secret.json
   ```
3. **Use environment variables** in production
4. **Rotate credentials** regularly
5. **Enable HTTPS** in production
6. **Implement rate limiting** for API endpoints

---

## Production Deployment

### Update Redirect URIs

1. Go to Google Cloud Console > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add production redirect URI:
   ```
   https://your-domain.com/auth/google/callback
   ```

### Update Environment Variables

```env
GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

### Publish OAuth App (Optional)

1. Go to OAuth consent screen
2. Click **"Publish App"**
3. Submit for verification if needed

---

## Features Implemented

✅ OAuth 2.0 authentication with Google
✅ Import courses from Google Classroom
✅ Import assignments (coursework)
✅ View student rosters
✅ Sync status tracking
✅ Secure token storage
✅ Auto-refresh tokens

---

## Future Enhancements

- [ ] Auto-sync student submissions
- [ ] Two-way sync (push grades back to Google Classroom)
- [ ] Scheduled sync jobs
- [ ] Bulk import all courses at once
- [ ] Student submission file downloads
- [ ] Real-time notifications for new assignments

---

## Support

For issues or questions:
- Check the [Google Classroom API Documentation](https://developers.google.com/classroom)
- Open an issue on GitHub
- Contact the development team

---

**Happy Integrating! 🎓**
