import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Types for database tables
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'instructor' | 'student';
  organization_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  instructor_id?: string;
}

export interface Assignment {
  id: string;
  name: string;
  course_id: string;
  due_date?: string;
  settings: Record<string, any>;
  status: 'draft' | 'active' | 'closed' | 'archived';
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_identifier: string;
  file_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submission_time: string;
}

export interface ComparisonPair {
  id: string;
  assignment_id: string;
  submission_a_id: string;
  submission_b_id: string;
  similarity_score?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AnalysisResult {
  id: string;
  submission_id: string;
  overall_similarity?: number;
  ai_detection_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  detailed_results: Record<string, any>;
}
