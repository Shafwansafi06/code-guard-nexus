/**
 * Google Classroom OAuth Callback Handler
 * Handles the redirect from Google OAuth and exchanges code for tokens
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

export function GoogleClassroomCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      // Verify state matches what we stored
      const storedState = localStorage.getItem('google_oauth_state');
      const userId = localStorage.getItem('google_oauth_user_id');

      if (state !== storedState) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      if (!userId) {
        throw new Error('User ID not found');
      }

      // Exchange code for tokens
      await axios.post(
        `${API_URL}/google-classroom/auth/callback`,
        null,
        {
          params: {
            code,
            state,
            user_id: userId,
          },
        }
      );

      // Clean up localStorage
      localStorage.removeItem('google_oauth_state');
      localStorage.removeItem('google_oauth_user_id');

      setStatus('success');
      toast({
        title: 'Success',
        description: 'Successfully connected to Google Classroom!',
      });

      // Redirect to courses page after 2 seconds
      setTimeout(() => {
        navigate('/courses');
      }, 2000);
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Google Classroom. Please try again.',
        variant: 'destructive',
      });

      // Redirect to courses page after 3 seconds
      setTimeout(() => {
        navigate('/courses');
      }, 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connecting to Google Classroom</h2>
            <p className="text-gray-600">Please wait while we complete the connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Successfully Connected!</h2>
            <p className="text-gray-600">Redirecting you to courses...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 text-6xl mb-4">✕</div>
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-gray-600">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
}
