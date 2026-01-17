/**
 * Google Classroom Connect Button Component
 * Handles OAuth flow for connecting to Google Classroom
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface GoogleClassroomConnectProps {
  userId: string;
  onConnected?: () => void;
}

export function GoogleClassroomConnect({ userId, onConnected }: GoogleClassroomConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Get authorization URL from backend
      const response = await axios.get(`${API_URL}/google-classroom/auth/url`);
      const { auth_url, state } = response.data;

      // Store state in localStorage for verification
      localStorage.setItem('google_oauth_state', state);
      localStorage.setItem('google_oauth_user_id', userId);

      // Redirect to Google OAuth
      window.location.href = auth_url;
    } catch (error) {
      console.error('Failed to connect to Google Classroom:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Google Classroom. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {isConnecting ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          Connect Google Classroom
        </>
      )}
    </Button>
  );
}
