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

function readAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Attach auth token: localStorage (needed for cross-origin API :5000 — cookies stay on :3000)
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('accessToken') ?? readAccessTokenFromCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set multipart boundary for CV upload
    if (config.data instanceof FormData && config.headers) {
      const h = config.headers as Record<string, unknown> & { delete?: (n: string) => void };
      if (typeof h.delete === 'function') h.delete('Content-Type');
      else delete h['Content-Type'];
    }
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'CANDIDATE' | 'ADMIN';
  provider: string;
  picture: string | null;
  avatar: string | null;
};

export type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, phone?: string) =>
    api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
      phone: phone || undefined,
      role: 'CANDIDATE',
    }),
  googleLogin: (token: string) =>
    api.post<AuthResponse>('/auth/google', { token }),
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
export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  provider?: string;
  dob?: string;
  picture?: string;
  avatar?: string;
  credits?: { cvScansRemaining: number; mockSessionsRemaining: number };
  created_at?: string;
};

export type UpdateUserProfilePayload = Partial<
  Pick<UserProfile, 'name' | 'dob'>
>;

export const userApi = {
  getProfile: () =>
    api.get<UserProfile>('/user/profile'),
  updateProfile: (data: UpdateUserProfilePayload) =>
    api.patch<UserProfile>('/user/profile', data),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<UserProfile>('/user/profile/picture', formData);
  },
};

export default api;
