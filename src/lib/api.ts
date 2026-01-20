import axios, { AxiosInstance, AxiosError } from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError && session && error.config) {
            // Retry the request with new token
            error.config.headers.Authorization = `Bearer ${session.access_token}`;
            return this.client.request(error.config);
          }

          // If refresh fails, logout
          await supabase.auth.signOut();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint);
    return response.data;
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

// ==================== Interfaces ====================

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  organization_id?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  instructor_id: string;
  assignment_count?: number;
  student_count?: number;
}

export interface Assignment {
  id: string;
  name: string;
  course_id: string;
  course_name?: string;
  due_date?: string;
  settings: Record<string, any>;
  status: string;
  submission_count?: number;
  pending_analyses?: number;
  average_similarity?: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_identifier: string;
  file_count: number;
  status: string;
  submission_time: string;
  files?: FileData[];
}

export interface FileData {
  id: string;
  submission_id: string;
  filename: string;
  language?: string;
  file_hash: string;
}

export interface ComparisonPair {
  id: string;
  assignment_id: string;
  submission_a_id: string;
  submission_b_id: string;
  similarity_score?: number;
  status?: string;
  submission_a?: Submission;
  submission_b?: Submission;
}

export interface DashboardStats {
  total_assignments: number;
  total_submissions: number;
  pending_reviews: number;
  high_risk_cases: number;
  recent_activity?: {
    type: string;
    student: string;
    assignment: string;
    timestamp: string;
    status: string;
  }[];
}

// ==================== ML Analysis API ====================
export interface AIDetectionRequest {
  code: string;
  language?: string;
}

export interface AIDetectionResponse {
  is_ai: boolean;
  ai_score: number;
  human_score: number;
  confidence: number;
  risk_level: string;
  risk_description: string;
  note?: string;
}

export interface SimilarityRequest {
  code1: string;
  code2: string;
  language1?: string;
  language2?: string;
}

export interface SimilarityResponse {
  similarity_score: number;
  is_suspicious: boolean;
  threshold: number;
}

export interface ComprehensiveAnalysisResponse {
  ai_detection: any;
  language: string;
  code_length: number;
  risk_assessment: any;
  similarity_analysis?: any;
}

// ==================== Clone Detection API ====================
export interface CloneDetectionRequest {
  code1: string;
  code2: string;
  threshold?: number;
}

export interface CloneDetectionResponse {
  is_clone: boolean;
  clone_probability: number;
  non_clone_probability: number;
  confidence: number;
  similarity_score: number;
  risk_level: 'high' | 'medium' | 'low' | 'none';
  risk_description: string;
  threshold: number;
}

export interface BatchCloneResponse {
  total_comparisons: number;
  clone_pairs_found: number;
  clone_pairs: ClonePair[];
  summary: {
    total_codes: number;
    threshold: number;
    max_similarity: number;
    avg_similarity: number;
    high_risk_pairs: number;
  };
}

export interface ClonePair {
  pair: [number, number];
  code1_index: number;
  code2_index: number;
  is_clone: boolean;
  similarity_score: number;
  clone_probability: number;
  confidence: number;
  risk_level: 'high' | 'medium' | 'low' | 'none';
  risk_description: string;
}

export interface SimilarCodeResponse {
  target_code_length: number;
  total_candidates: number;
  matches_found: number;
  threshold: number;
  top_matches: SimilarCodeMatch[];
  summary: {
    highest_similarity: number;
    potential_plagiarism: number;
    flagged_for_review: number[];
  };
}

export interface SimilarCodeMatch {
  candidate_index: number;
  similarity_score: number;
  clone_probability: number;
  confidence: number;
  risk_level: 'high' | 'medium' | 'low' | 'none';
  risk_description: string;
  is_clone: boolean;
}

export interface CloneDetectorStatus {
  status: string;
  backend?: string;
  inference_speed?: string;
  optimization_level?: string;
  model_type?: string;
  capabilities?: string[];
  performance?: {
    f1_score: number | string;
    accuracy: number | string;
    auc_roc: number | string;
  };
  recommendation?: string;
}

// ==================== Courses API ====================
export const coursesApi = {
  list: (semester?: string): Promise<Course[]> =>
    apiClient.get('/courses', semester ? { semester } : undefined),

  get: (id: string): Promise<Course> =>
    apiClient.get(`/courses/${id}`),

  create: (data: any): Promise<Course> =>
    apiClient.post('/courses', data),

  update: (id: string, data: any): Promise<Course> =>
    apiClient.put(`/courses/${id}`, data),

  delete: (id: string): Promise<any> =>
    apiClient.delete(`/courses/${id}`),
};

// ==================== Assignments API ====================
export const assignmentsApi = {
  list: (courseId?: string, status?: string): Promise<Assignment[]> =>
    apiClient.get('/assignments', { course_id: courseId, status_filter: status }),

  get: (id: string): Promise<Assignment> =>
    apiClient.get(`/assignments/${id}`),

  create: (data: any): Promise<Assignment> =>
    apiClient.post('/assignments', data),

  update: (id: string, data: any): Promise<Assignment> =>
    apiClient.put(`/assignments/${id}`, data),

  delete: (id: string): Promise<any> =>
    apiClient.delete(`/assignments/${id}`),

  startAnalysis: (id: string): Promise<any> =>
    apiClient.post(`/assignments/${id}/start-analysis`),
};

// ==================== Submissions API ====================
export const submissionsApi = {
  list: (assignmentId?: string, status?: string): Promise<Submission[]> =>
    apiClient.get('/submissions', { assignment_id: assignmentId, status_filter: status }),

  get: (id: string): Promise<Submission> =>
    apiClient.get(`/submissions/${id}`),

  create: (data: any): Promise<Submission> =>
    apiClient.post('/submissions', data),

  update: (id: string, data: any): Promise<Submission> =>
    apiClient.put(`/submissions/${id}`, data),

  delete: (id: string): Promise<any> =>
    apiClient.delete(`/submissions/${id}`),

  upload: (assignmentId: string, studentIdentifier: string, files: File[]): Promise<any> => {
    const formData = new FormData();
    formData.append('assignment_id', assignmentId);
    formData.append('student_identifier', studentIdentifier);
    files.forEach((file) => {
      formData.append('files', file);
    });
    return apiClient.upload('/submissions/upload', formData);
  },
};

// ==================== Comparisons API ====================
export const comparisonsApi = {
  list: (assignmentId?: string, status?: string, minSimilarity?: number): Promise<ComparisonPair[]> =>
    apiClient.get('/comparisons', {
      assignment_id: assignmentId,
      status_filter: status,
      min_similarity: minSimilarity
    }),

  get: (id: string): Promise<ComparisonPair> =>
    apiClient.get(`/comparisons/${id}`),

  update: (id: string, data: any): Promise<ComparisonPair> =>
    apiClient.put(`/comparisons/${id}`, data),

  getHighRisk: (assignmentId: string, threshold: number = 0.7): Promise<ComparisonPair[]> =>
    apiClient.get(`/comparisons/assignment/${assignmentId}/high-risk`, { threshold }),
};

// ==================== Dashboard API ====================
export const dashboardApi = {
  stats: (): Promise<DashboardStats> =>
    apiClient.get('/dashboard/stats'),

  analytics: (assignmentId: string): Promise<any> =>
    apiClient.get(`/dashboard/analytics/${assignmentId}`),
};

export const mlAnalysisApi = {
  detectAI: (data: AIDetectionRequest): Promise<AIDetectionResponse> =>
    apiClient.post('/ml/detect-ai', data),

  computeSimilarity: (data: SimilarityRequest): Promise<SimilarityResponse> =>
    apiClient.post('/ml/compute-similarity', data),

  analyzeCode: (data: AIDetectionRequest): Promise<ComprehensiveAnalysisResponse> =>
    apiClient.post('/ml/analyze-code', data),

  batchAnalysis: (codes: string[], languages?: string[]) =>
    apiClient.post('/ml/batch-analysis', { codes, languages }),

  findSimilarSubmissions: (queryCode: string, corpusCodes: string[], queryLanguage?: string) =>
    apiClient.post('/ml/find-similar', {
      query_code: queryCode,
      corpus_codes: corpusCodes,
      query_language: queryLanguage || 'python'
    }),

  // Clone Detection API (ONNX-powered)
  detectClone: (data: CloneDetectionRequest): Promise<CloneDetectionResponse> =>
    apiClient.post('/ml/detect-clone', data),

  batchCloneDetection: (codes: string[], threshold?: number): Promise<BatchCloneResponse> =>
    apiClient.post('/ml/batch-clone-detection', { 
      codes, 
      threshold: threshold || 0.6 
    }),

  findSimilarCode: (targetCode: string, candidateCodes: string[], threshold?: number, topK?: number): Promise<SimilarCodeResponse> =>
    apiClient.post('/ml/find-similar-submissions', {
      target_code: targetCode,
      candidate_codes: candidateCodes,
      threshold: threshold || 0.6,
      top_k: topK || 5
    }),

  getCloneDetectorStatus: (): Promise<CloneDetectorStatus> =>
    apiClient.get('/ml/clone-detector-status'),
};

export const authApi = {
  register: (data: any): Promise<any> =>
    apiClient.post('/auth/register', data),

  login: (data: any): Promise<Token> =>
    apiClient.post('/auth/login', data),

  logout: (): Promise<any> =>
    apiClient.post('/auth/logout'),

  me: (): Promise<User> =>
    apiClient.get('/auth/me'),
};

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

// ==================== Export all ====================
export const api = {
  auth: authApi,
  courses: coursesApi,
  assignments: assignmentsApi,
  submissions: submissionsApi,
  comparisons: comparisonsApi,
  dashboard: dashboardApi,
  mlAnalysis: mlAnalysisApi,
};

export default api;
