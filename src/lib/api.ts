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

// ==================== Courses API ====================
export const coursesApi = {
  list: (semester?: string) => 
    apiClient.get('/courses', semester ? { semester } : undefined),
  
  get: (id: string) => 
    apiClient.get(`/courses/${id}`),
  
  create: (data: any) => 
    apiClient.post('/courses', data),
  
  update: (id: string, data: any) => 
    apiClient.put(`/courses/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/courses/${id}`),
};

// ==================== Assignments API ====================
export const assignmentsApi = {
  list: (courseId?: string, status?: string) => 
    apiClient.get('/assignments', { course_id: courseId, status_filter: status }),
  
  get: (id: string) => 
    apiClient.get(`/assignments/${id}`),
  
  create: (data: any) => 
    apiClient.post('/assignments', data),
  
  update: (id: string, data: any) => 
    apiClient.put(`/assignments/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/assignments/${id}`),
  
  startAnalysis: (id: string) => 
    apiClient.post(`/assignments/${id}/start-analysis`),
};

// ==================== Submissions API ====================
export const submissionsApi = {
  list: (assignmentId?: string, status?: string) => 
    apiClient.get('/submissions', { assignment_id: assignmentId, status_filter: status }),
  
  get: (id: string) => 
    apiClient.get(`/submissions/${id}`),
  
  create: (data: any) => 
    apiClient.post('/submissions', data),
  
  update: (id: string, data: any) => 
    apiClient.put(`/submissions/${id}`, data),
  
  delete: (id: string) => 
    apiClient.delete(`/submissions/${id}`),
  
  upload: (assignmentId: string, studentIdentifier: string, files: File[]) => {
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
  list: (assignmentId?: string, status?: string, minSimilarity?: number) => 
    apiClient.get('/comparisons', { 
      assignment_id: assignmentId, 
      status_filter: status,
      min_similarity: minSimilarity 
    }),
  
  get: (id: string) => 
    apiClient.get(`/comparisons/${id}`),
  
  update: (id: string, data: any) => 
    apiClient.put(`/comparisons/${id}`, data),
  
  getHighRisk: (assignmentId: string, threshold: number = 0.7) => 
    apiClient.get(`/comparisons/assignment/${assignmentId}/high-risk`, { threshold }),
};

// ==================== Dashboard API ====================
export const dashboardApi = {
  stats: () => 
    apiClient.get('/dashboard/stats'),
  
  analytics: (assignmentId: string) => 
    apiClient.get(`/dashboard/analytics/${assignmentId}`),
};

// ==================== Export all ====================
export const api = {
  courses: coursesApi,
  assignments: assignmentsApi,
  submissions: submissionsApi,
  comparisons: comparisonsApi,
  dashboard: dashboardApi,
};

export default api;
