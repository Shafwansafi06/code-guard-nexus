/**
 * OAuth Callback Handler
 * Processes OAuth redirects from Google and other providers
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the session from URL hash
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(error.message);
      }

      if (!session) {
        throw new Error('No session found');
      }

      // Create or update user in our backend
      const user = session.user;
      
      // For OAuth users, directly create if they don't exist
      // We'll use the user ID from Supabase as they're already authenticated
      try {
        // Try to get user data from backend using Supabase ID
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok && response.status === 404) {
          // User doesn't exist, create them
          await api.auth.register({
            email: user.email!,
            password: Math.random().toString(36).slice(-16), // Random password for OAuth users
            username: user.user_metadata?.full_name || user.email!.split('@')[0],
            role: 'instructor', // Default role
          });
        }
      } catch (err: any) {
        console.error('Error checking/creating user:', err);
        // Continue anyway as Supabase already authenticated them
      }

      // Store user ID
      if (user.id) {
        localStorage.setItem('user_id', user.id);
      }

      toast({
        title: "Welcome!",
        description: "You have been successfully signed in.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Auth callback error:', error);
      setStatus('error');
      
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to complete sign-in. Please try again.",
        variant: "destructive",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="w-10 h-10 text-primary" />
          <span className="text-2xl font-bold">
            Code<span className="text-primary">Guard</span> AI
          </span>
        </div>
        
        {status === 'processing' ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Completing sign-in...</h2>
            <p className="text-muted-foreground">Please wait while we set up your account.</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication failed</h2>
            <p className="text-muted-foreground">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}
