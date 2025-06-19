import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, User, Event, CreateEventForm, ApiResponse, Comment } from '@/types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://172.20.213.111:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    token: token ? token.substring(0, 20) + '...' : null
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => 
    api.post('/auth/register', data).then(res => res.data),
  
  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => 
    api.post('/auth/login', data).then(res => res.data),
  
  getProfile: (): Promise<ApiResponse<{ user: User }>> => 
    api.get('/auth/profile').then(res => res.data),
  
  updateProfile: (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => 
    api.put('/auth/profile', data).then(res => res.data),
};

export const eventAPI = {
  getEvents: (params?: { year?: number; month?: number; startDate?: string; endDate?: string }): Promise<ApiResponse<{ events: Event[] }>> => 
    api.get('/events', { params }).then(res => res.data),
  
  getEvent: (id: string): Promise<ApiResponse<{ event: Event }>> => 
    api.get(`/events/${id}`).then(res => res.data),
  
  createEvent: (data: CreateEventForm): Promise<ApiResponse<{ event: Event }>> => 
    api.post('/events', data).then(res => res.data),
  
  updateEvent: (id: string, data: Partial<CreateEventForm>): Promise<ApiResponse<{ event: Event }>> => 
    api.put(`/events/${id}`, data).then(res => res.data),
  
  deleteEvent: (id: string): Promise<ApiResponse<void>> => 
    api.delete(`/events/${id}`).then(res => res.data),
};

export const commentAPI = {
  getComments: (eventId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ 
    comments: Comment[]; 
    pagination: { total: number; page: number; pages: number } 
  }>> => 
    api.get(`/comments/event/${eventId}`, { params }).then(res => res.data),
  
  createComment: (eventId: string, data: { content: string; images?: any[]; parentComment?: string }): Promise<ApiResponse<{ comment: Comment }>> => 
    api.post(`/comments/event/${eventId}`, data).then(res => res.data),
  
  updateComment: (commentId: string, data: { content: string; images?: any[] }): Promise<ApiResponse<{ comment: Comment }>> => 
    api.put(`/comments/${commentId}`, data).then(res => res.data),
  
  deleteComment: (commentId: string): Promise<ApiResponse<void>> => 
    api.delete(`/comments/${commentId}`).then(res => res.data),
  
  toggleLike: (commentId: string): Promise<ApiResponse<{ likesCount: number; isLiked: boolean }>> => 
    api.post(`/comments/${commentId}/like`).then(res => res.data),
};

export default api;