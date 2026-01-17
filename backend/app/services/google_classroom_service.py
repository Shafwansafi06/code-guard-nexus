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
        self.client_secrets_file = os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "client_secret.json")
        self.redirect_uri = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:5173/auth/google/callback")
    
    def create_authorization_url(self, state: Optional[str] = None) -> tuple[str, str]:
        """
        Create OAuth 2.0 authorization URL
        
        Returns:
            tuple: (authorization_url, state)
        """
        if state is None:
            state = secrets.token_urlsafe(32)
        
        flow = Flow.from_client_secrets_file(
            self.client_secrets_file,
            scopes=SCOPES,
            redirect_uri=self.redirect_uri
        )
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'
        )
        
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
        flow = Flow.from_client_secrets_file(
            self.client_secrets_file,
            scopes=SCOPES,
            redirect_uri=self.redirect_uri,
            state=state
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'expires_in': 3600,  # Default to 1 hour
            'token_type': 'Bearer',
            'scope': ' '.join(SCOPES)
        }
    
    def get_service(self, access_token: str, refresh_token: Optional[str] = None):
        """
        Create authenticated Google Classroom service
        
        Args:
            access_token: OAuth access token
            refresh_token: OAuth refresh token for token renewal
            
        Returns:
            Google Classroom service object
        """
        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self._get_client_id(),
            client_secret=self._get_client_secret(),
            scopes=SCOPES
        )
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        
        service = build('classroom', 'v1', credentials=credentials)
        return service
    
    def _get_client_id(self) -> str:
        """Get client ID from secrets file"""
        with open(self.client_secrets_file, 'r') as f:
            secrets = json.load(f)
            return secrets['web']['client_id']
    
    def _get_client_secret(self) -> str:
        """Get client secret from secrets file"""
        with open(self.client_secrets_file, 'r') as f:
            secrets = json.load(f)
            return secrets['web']['client_secret']
    
    async def fetch_courses(self, access_token: str, refresh_token: Optional[str] = None) -> List[GoogleClassroomCourse]:
        """
        Fetch all courses from Google Classroom
        
        Args:
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            
        Returns:
            List of GoogleClassroomCourse objects
        """
        try:
            service = self.get_service(access_token, refresh_token)
            results = service.courses().list(pageSize=100).execute()
            courses = results.get('courses', [])
            
            return [GoogleClassroomCourse(**course) for course in courses]
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return []
    
    async def fetch_course_by_id(self, course_id: str, access_token: str, refresh_token: Optional[str] = None) -> Optional[GoogleClassroomCourse]:
        """
        Fetch a specific course by ID
        
        Args:
            course_id: Google Classroom course ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            
        Returns:
            GoogleClassroomCourse object or None
        """
        try:
            service = self.get_service(access_token, refresh_token)
            course = service.courses().get(id=course_id).execute()
            
            return GoogleClassroomCourse(**course)
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return None
    
    async def fetch_coursework(self, course_id: str, access_token: str, refresh_token: Optional[str] = None) -> List[GoogleClassroomCourseWork]:
        """
        Fetch all coursework (assignments) for a course
        
        Args:
            course_id: Google Classroom course ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            
        Returns:
            List of GoogleClassroomCourseWork objects
        """
        try:
            service = self.get_service(access_token, refresh_token)
            results = service.courses().courseWork().list(courseId=course_id, pageSize=100).execute()
            coursework = results.get('courseWork', [])
            
            return [GoogleClassroomCourseWork(**work) for work in coursework]
        
        except HttpError as error:
            print(f'An error occurred: {error}')
            return []
    
    async def fetch_coursework_by_id(self, course_id: str, coursework_id: str, access_token: str, refresh_token: Optional[str] = None) -> Optional[GoogleClassroomCourseWork]:
        """
        Fetch a specific coursework by ID
        
        Args:
            course_id: Google Classroom course ID
            coursework_id: Coursework ID
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            
        Returns:
            GoogleClassroomCourseWork object or None
        """
        try:
            service = self.get_service(access_token, refresh_token)
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
