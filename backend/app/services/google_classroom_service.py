"""
Google Classroom Service
Handles OAuth authentication and data fetching from Google Classroom API
"""

import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import secrets

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.schemas.google_classroom import (
    GoogleClassroomCourse,
    GoogleClassroomCourseWork,
    GoogleClassroomStudentSubmission,
    GoogleOAuthTokenCreate,
)


# OAuth 2.0 scopes for Google Classroom
SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails',
]


class GoogleClassroomService:
    """Service for interacting with Google Classroom API"""
    
    def __init__(self):
        # Check if we have environment variables for OAuth config
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        
        print(f"GoogleClassroomService initialized:")
        print(f"  - GOOGLE_CLIENT_ID: {'SET' if self.client_id else 'NOT SET'}")
        print(f"  - GOOGLE_CLIENT_SECRET: {'SET' if self.client_secret else 'NOT SET'}")
        
        # Fall back to file-based config if env vars not set
        client_secrets_file = os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "client_secret.json")
        if not os.path.isabs(client_secrets_file):
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            self.client_secrets_file = os.path.join(backend_dir, client_secrets_file)
        else:
            self.client_secrets_file = client_secrets_file
        
        # Verify we have either env vars or file
        has_env_config = self.client_id and self.client_secret
        has_file_config = os.path.exists(self.client_secrets_file)
        
        print(f"  - client_secrets_file: {self.client_secrets_file} (exists: {has_file_config})")
        
        if not has_env_config and not has_file_config:
            print(f"WARNING: No Google OAuth config found. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET or provide {self.client_secrets_file}")
    
    @property
    def redirect_uri(self):
        """Get redirect URI from environment variable (dynamic)"""
        return os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:8080/auth/google/callback")
    
    def generate_csrf_token(self) -> str:
        """Generate a random CSRF token"""
        return secrets.token_urlsafe(32)
    
    def create_authorization_url(self, state: Optional[str] = None) -> tuple[str, str]:
        """
        Create OAuth 2.0 authorization URL
        
        Returns:
            tuple: (authorization_url, state)
        """
        if state is None:
            state = secrets.token_urlsafe(32)
        
        print(f"Creating OAuth URL with redirect_uri: {self.redirect_uri}")
        
        # Use environment variables if available, otherwise use file
        if self.client_id and self.client_secret:
            client_config = {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            }
            flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=self.redirect_uri
            )
        elif os.path.exists(self.client_secrets_file):
            flow = Flow.from_client_secrets_file(
                self.client_secrets_file,
                scopes=SCOPES,
                redirect_uri=self.redirect_uri
            )
        else:
            raise FileNotFoundError(f"No Google OAuth config found. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET environment variables or provide {self.client_secrets_file}")
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'
        )
        
        print(f"Generated authorization URL: {authorization_url[:100]}...")
        
        return authorization_url, state
    
    def exchange_code_for_tokens(self, code: str, state: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens
        
        Args:
            code: Authorization code from OAuth callback
            state: State parameter for CSRF protection
            
        Returns:
            dict: Token information including access_token, refresh_token, expires_in
        """
        # Set environment variable before creating flow to relax scope validation
        import os
        os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow HTTP for local development
        
        # Use environment variables if available, otherwise use file
        if self.client_id and self.client_secret:
            client_config = {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            }
            flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=self.redirect_uri,
                state=state
            )
        else:
            flow = Flow.from_client_secrets_file(
                self.client_secrets_file,
                scopes=SCOPES,
                redirect_uri=self.redirect_uri,
                state=state
            )
        
        print(f"Exchanging code for tokens with redirect_uri: {self.redirect_uri}")
        
        try:
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            print(f"Token exchange successful!")
            
            return {
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'expires_in': 3600,  # Default to 1 hour
                'token_type': 'Bearer',
                'scope': ' '.join(SCOPES)
            }
        except Exception as e:
            print(f"Token exchange failed: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def get_service(self, access_token: str, refresh_token: Optional[str] = None, expires_at: Optional[str] = None):
        """
        Create authenticated Google Classroom service
        
        Args:
            access_token: OAuth access token
            refresh_token: OAuth refresh token for token renewal
            expires_at: Token expiration timestamp (ISO format)
            
        Returns:
            Google Classroom service object
        """
        # Parse expiry datetime if provided
        expiry = None
        if expires_at:
            try:
                expiry = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except:
                pass
        
        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self._get_client_id(),
            client_secret=self._get_client_secret(),
            scopes=SCOPES,
            expiry=expiry
        )
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
                print(f"Token refreshed successfully. New expiry: {credentials.expiry}")
            except Exception as e:
                print(f"Failed to refresh token: {e}")
                raise
        
        service = build('classroom', 'v1', credentials=credentials)
        return service
    
    def _get_client_id(self) -> str:
        """Get client ID from env vars or secrets file"""
        if self.client_id:
            print(f"Using GOOGLE_CLIENT_ID from environment variable")
            return self.client_id
        # Fall back to file
        print(f"WARNING: GOOGLE_CLIENT_ID not found, attempting to read from {self.client_secrets_file}")
        if not os.path.exists(self.client_secrets_file):
            raise FileNotFoundError(
                f"Google client secrets file not found at {self.client_secrets_file}. "
                "Please set GOOGLE_CLIENT_ID environment variable."
            )
        with open(self.client_secrets_file, 'r') as f:
            secrets = json.load(f)
            return secrets['web']['client_id']
    
    def _get_client_secret(self) -> str:
        """Get client secret from env vars or secrets file"""
        if self.client_secret:
            print(f"Using GOOGLE_CLIENT_SECRET from environment variable")
            return self.client_secret
        # Fall back to file
        print(f"WARNING: GOOGLE_CLIENT_SECRET not found, attempting to read from {self.client_secrets_file}")
        if not os.path.exists(self.client_secrets_file):
            raise FileNotFoundError(
                f"Google client secrets file not found at {self.client_secrets_file}. "
                "Please set GOOGLE_CLIENT_SECRET environment variable."
            )
        with open(self.client_secrets_file, 'r') as f:
            secrets = json.load(f)
            return secrets['web']['client_secret']
    
    async def fetch_courses(self, access_token: str, refresh_token: Optional[str] = None, expires_at: Optional[str] = None) -> List[GoogleClassroomCourse]:
        """
        Fetch all courses for authenticated user
        
        Args:
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            expires_at: Token expiration timestamp
            
        Returns:
            List of GoogleClassroomCourse objects
        """
        try:
            print(f"Fetching courses - expires_at: {expires_at}")
            service = self.get_service(access_token, refresh_token, expires_at)
            print("Service created successfully")
            results = service.courses().list(pageSize=100).execute()
            print(f"API call successful - fetched {len(results.get('courses', []))} courses")
            courses = results.get('courses', [])
            
            return [GoogleClassroomCourse(**course) for course in courses]
        
        except HttpError as error:
            print(f'HTTP error occurred while fetching courses: {error}')
            import traceback
            traceback.print_exc()
            return []
        except Exception as e:
            print(f'Unexpected error fetching courses: {e}')
            import traceback
            traceback.print_exc()
            raise
    
    async def fetch_course_by_id(self, course_id: str, access_token: str, refresh_token: Optional[str] = None, expires_at: Optional[str] = None) -> Optional[GoogleClassroomCourse]:
        """
        Fetch a specific course by ID
        
        Args:
            course_id: Google Classroom course ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            expires_at: Token expiration timestamp
            
        Returns:
            GoogleClassroomCourse object or None
        """
        try:
            service = self.get_service(access_token, refresh_token, expires_at)
            course = service.courses().get(id=course_id).execute()
            
            return GoogleClassroomCourse(**course)
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return None
    
    async def fetch_coursework(self, course_id: str, access_token: str, refresh_token: Optional[str] = None, expires_at: Optional[str] = None) -> List[GoogleClassroomCourseWork]:
        """
        Fetch all coursework (assignments) for a course
        
        Args:
            course_id: Google Classroom course ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            expires_at: Token expiration timestamp
            
        Returns:
            List of GoogleClassroomCourseWork objects
        """
        try:
            service = self.get_service(access_token, refresh_token, expires_at)
            results = service.courses().courseWork().list(courseId=course_id, pageSize=100).execute()
            coursework = results.get('courseWork', [])
            
            return [GoogleClassroomCourseWork(**work) for work in coursework]
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return []
    
    async def fetch_coursework_by_id(self, course_id: str, coursework_id: str, access_token: str, refresh_token: Optional[str] = None, expires_at: Optional[str] = None) -> Optional[GoogleClassroomCourseWork]:
        """
        Fetch specific coursework by ID
        
        Args:
            course_id: Google Classroom course ID
            coursework_id: Coursework ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            expires_at: Token expiration timestamp
            
        Returns:
            GoogleClassroomCourseWork object or None
        """
        try:
            service = self.get_service(access_token, refresh_token, expires_at)
            coursework = service.courses().courseWork().get(
                courseId=course_id,
                id=coursework_id
            ).execute()
            
            return GoogleClassroomCourseWork(**coursework)
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return None
    
    async def fetch_student_submissions(self, course_id: str, coursework_id: str, access_token: str, refresh_token: Optional[str] = None) -> List[GoogleClassroomStudentSubmission]:
        """
        Fetch all student submissions for a coursework
        
        Args:
            course_id: Google Classroom course ID
            coursework_id: Coursework ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            
        Returns:
            List of GoogleClassroomStudentSubmission objects
        """
        try:
            service = self.get_service(access_token, refresh_token)
            results = service.courses().courseWork().studentSubmissions().list(
                courseId=course_id,
                courseWorkId=coursework_id,
                pageSize=100
            ).execute()
            submissions = results.get('studentSubmissions', [])
            
            return [GoogleClassroomStudentSubmission(**submission) for submission in submissions]
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return []
    
    async def fetch_students(self, course_id: str, access_token: str, refresh_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch all students enrolled in a course
        
        Args:
            course_id: Google Classroom course ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            
        Returns:
            List of student dictionaries
        """
        try:
            service = self.get_service(access_token, refresh_token)
            results = service.courses().students().list(courseId=course_id, pageSize=100).execute()
            students = results.get('students', [])
            
            return students
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return []


# Singleton instance
google_classroom_service = GoogleClassroomService()
