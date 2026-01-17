# Google Classroom API Endpoints Reference

## Base URL
```
http://localhost:8000/api/v1/google-classroom
```

---

## Authentication Endpoints

### Get Authorization URL
Generates the Google OAuth 2.0 authorization URL.

```http
GET /auth/url
```

**Response:**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-csrf-token"
}
```

---

### OAuth Callback
Handles the OAuth callback and exchanges authorization code for tokens.

```http
POST /auth/callback?code={code}&state={state}&user_id={user_id}
```

**Query Parameters:**
- `code` (required) - Authorization code from Google
- `state` (required) - CSRF protection token
- `user_id` (required) - User ID to associate tokens with

**Response:**
```json
{
  "access_token": "ya29.a0AfH6...",
  "refresh_token": "1//0gHc...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "https://www.googleapis.com/auth/classroom.courses.readonly ..."
}
```

---

## Course Endpoints

### List Courses
Retrieves all Google Classroom courses for the authenticated user.

```http
GET /courses?user_id={user_id}
```

**Query Parameters:**
- `user_id` (required) - User ID

**Response:**
```json
[
  {
    "id": "123456789",
    "name": "Introduction to Computer Science",
    "section": "Section A",
    "description": "Learn the fundamentals of CS",
    "ownerId": "112358132134",
    "creationTime": "2024-01-15T10:00:00.000Z",
    "updateTime": "2024-01-16T15:30:00.000Z",
    "enrollmentCode": "abc123",
    "courseState": "ACTIVE",
    "alternateLink": "https://classroom.google.com/c/MTIzNDU2Nzg5",
    "teacherGroupEmail": "course@example.com",
    "courseGroupEmail": "course-all@example.com"
  }
]
```

---

### Get Course by ID
Retrieves a specific Google Classroom course.

```http
GET /courses/{course_id}?user_id={user_id}
```

**Path Parameters:**
- `course_id` (required) - Google Classroom course ID

**Query Parameters:**
- `user_id` (required) - User ID

**Response:** Single course object (same structure as list)

---

### List Course Assignments
Retrieves all coursework (assignments) for a specific course.

```http
GET /courses/{course_id}/coursework?user_id={user_id}
```

**Path Parameters:**
- `course_id` (required) - Google Classroom course ID

**Query Parameters:**
- `user_id` (required) - User ID

**Response:**
```json
[
  {
    "id": "987654321",
    "courseId": "123456789",
    "title": "Assignment 1: Hello World",
    "description": "Write a hello world program",
    "materials": [],
    "state": "PUBLISHED",
    "alternateLink": "https://classroom.google.com/c/MTIzNDU2Nzg5/a/OTg3NjU0MzIx",
    "creationTime": "2024-01-10T08:00:00.000Z",
    "updateTime": "2024-01-10T08:05:00.000Z",
    "dueDate": {
      "year": 2024,
      "month": 1,
      "day": 31
    },
    "dueTime": {
      "hours": 23,
      "minutes": 59
    },
    "maxPoints": 100,
    "workType": "ASSIGNMENT",
    "assigneeMode": "ALL_STUDENTS"
  }
]
```

---

## Import Endpoints

### Import Course
Imports a Google Classroom course into CodeGuard Nexus.

```http
POST /import/course?user_id={user_id}
```

**Query Parameters:**
- `user_id` (required) - User ID (instructor)

**Request Body:**
```json
{
  "google_classroom_id": "123456789",
  "sync_enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "course_id": "uuid-1234-5678-90ab-cdef",
  "message": "Course imported successfully",
  "google_classroom_id": "123456789"
}
```

---

### Import Assignment
Imports a Google Classroom assignment into CodeGuard Nexus.

```http
POST /import/assignment?user_id={user_id}
```

**Query Parameters:**
- `user_id` (required) - User ID (instructor)

**Request Body:**
```json
{
  "course_id": "uuid-1234-5678-90ab-cdef",
  "google_coursework_id": "987654321"
}
```

**Response:**
```json
{
  "success": true,
  "assignment_id": "uuid-abcd-efgh-ijkl-mnop",
  "message": "Assignment imported successfully",
  "google_coursework_id": "987654321"
}
```

---

## Status Endpoints

### Get Sync Status
Retrieves Google Classroom sync status for a user.

```http
GET /sync/status?user_id={user_id}
```

**Query Parameters:**
- `user_id` (required) - User ID

**Response:**
```json
{
  "last_synced_at": "2024-01-16T18:30:00.000Z",
  "sync_enabled": true,
  "courses_synced": 5,
  "assignments_synced": 23,
  "message": "Connected. 5 courses and 23 assignments synced."
}
```

**Response (Not Connected):**
```json
{
  "last_synced_at": null,
  "sync_enabled": false,
  "courses_synced": 0,
  "assignments_synced": 0,
  "message": "Not connected to Google Classroom"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "User not authenticated with Google Classroom"
}
```

### 404 Not Found
```json
{
  "detail": "Course {id} not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to fetch courses: {error_message}"
}
```

---

## Rate Limits

Google Classroom API has the following rate limits:
- **Free Tier**: 10,000 requests/day
- **Per User**: 100 requests/100 seconds

CodeGuard Nexus implements automatic retry with exponential backoff for rate limit errors.

---

## Authentication Flow

1. **User initiates connection:**
   ```
   GET /auth/url
   ```

2. **Frontend redirects to Google:**
   ```
   window.location.href = auth_url
   ```

3. **Google redirects back with code:**
   ```
   http://localhost:5173/auth/google/callback?code=xxx&state=yyy
   ```

4. **Frontend exchanges code for tokens:**
   ```
   POST /auth/callback?code=xxx&state=yyy&user_id=zzz
   ```

5. **Tokens stored securely in database**

6. **User can now import courses:**
   ```
   GET /courses?user_id=zzz
   POST /import/course?user_id=zzz
   ```

---

## Testing with cURL

### Get Authorization URL
```bash
curl http://localhost:8000/api/v1/google-classroom/auth/url
```

### List Courses (after authentication)
```bash
curl "http://localhost:8000/api/v1/google-classroom/courses?user_id=YOUR_USER_ID"
```

### Import Course
```bash
curl -X POST "http://localhost:8000/api/v1/google-classroom/import/course?user_id=YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "google_classroom_id": "123456789",
    "sync_enabled": false
  }'
```

---

## Postman Collection

A Postman collection is available for testing all endpoints:

1. Import the collection from `docs/postman/google-classroom.json`
2. Set environment variable `user_id` to your user ID
3. Run the requests in order

---

## Interactive API Documentation

Visit the auto-generated Swagger UI documentation:

```
http://localhost:8000/api/v1/docs
```

Look for the **"Google Classroom"** section in the sidebar.

---

**Last Updated:** January 16, 2026
