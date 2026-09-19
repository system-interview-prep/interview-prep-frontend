import axios from 'axios';
import { API_BASE_URL } from '@/constants';

function readAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('accessToken') ?? readAccessTokenFromCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      const h = config.headers as Record<string, unknown> & { delete?: (n: string) => void };
      if (typeof h.delete === 'function') h.delete('Content-Type');
      else delete h['Content-Type'];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Handle 401 unauthorized session gracefully
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
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
    apiClient.post<AuthResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, phone?: string) =>
    apiClient.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
      phone: phone || undefined,
      role: 'CANDIDATE',
    }),
  googleLogin: (token: string) =>
    apiClient.post<AuthResponse>('/auth/google', { accessToken: token, token }),
};

// ── Interview API ─────────────────────────────────────────────────────────────
export const interviewApi = {
  start: (topic: string, language: string) =>
    apiClient.post('/interview/start', { topic, language }),
  get: (id: string) =>
    apiClient.get(`/interview/${id}`),
  end: (id: string) =>
    apiClient.post(`/interview/${id}/end`),
  list: () =>
    apiClient.get('/interview'),
};

// ── User API ──────────────────────────────────────────────────────────────────
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
    apiClient.get<UserProfile>('/user/profile'),
  updateProfile: (data: UpdateUserProfilePayload) =>
    apiClient.patch<UserProfile>('/user/profile', data),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<UserProfile>('/user/profile/picture', formData);
  },
};

export const api = apiClient;
export default apiClient;
