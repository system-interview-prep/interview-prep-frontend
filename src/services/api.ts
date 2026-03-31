import axios from 'axios';
import { API_BASE_URL } from '../constants';

/**
 * api.ts – Axios instance for all HTTP calls to the NestJS backend.
 * Automatically attaches the JWT token from localStorage.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use(config => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
};

// ── Interview ─────────────────────────────────────────────────────────────────
export const interviewApi = {
  start: (topic: string, language: string) =>
    api.post('/interview/start', { topic, language }),
  get: (id: string) =>
    api.get(`/interview/${id}`),
  end: (id: string) =>
    api.post(`/interview/${id}/end`),
  list: () =>
    api.get('/interview'),
};

// ── User ──────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () =>
    api.get('/user/profile'),
  updateProfile: (data: Record<string, any>) =>
    api.patch('/user/profile', data),
};

export default api;
