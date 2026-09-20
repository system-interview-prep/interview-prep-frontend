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

let redirectingAfterUnauthorized = false;

function clearExpiredClientSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('auth.googleProfile');
  document.cookie = 'access_token=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'role=; Path=/; Max-Age=0; SameSite=Lax';
}

function redirectToLoginAfterUnauthorized(): void {
  if (redirectingAfterUnauthorized) return;
  const { pathname, search, hash } = window.location;
  if (pathname === '/login' || pathname === '/signup') return;
  redirectingAfterUnauthorized = true;
  clearExpiredClientSession();
  const next = `${pathname}${search}${hash}`;
  window.location.replace(`/login?next=${encodeURIComponent(next)}`);
}

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
      const url = String(error.config?.url ?? '');
      // Invalid credentials on an auth request must remain on the login form.
      if (!url.startsWith('/auth/')) redirectToLoginAfterUnauthorized();
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
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
    }),
  googleLogin: (token: string) =>
    apiClient.post<AuthResponse>('/auth/google', { accessToken: token, token }),
};

// ── Interview API ──────────────────────────────────────────────────────────────
// NOTE: Routes /interview/start, /interview/{id}, etc. không tồn tại ở BE.
// Dùng /ai/session (sessionsApi) để tạo/quản lý interview sessions.
// Xem: src/lib/aiService.ts → createSession(), closeSession(), getAllSessions()

// ── User API ──────────────────────────────────────────────────────────────────
export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
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
    // BE hỗ trợ cả /users/me/picture và /user/profile/picture (alias)
    return apiClient.post<UserProfile>('/users/me/picture', formData);
  },
};

// ── CV Download API ───────────────────────────────────────────────────────────
/**
 * Download file CV gốc (PDF/DOCX) dưới dạng ArrayBuffer.
 * Khớp với BE: GET /users/me/cvs/{cv_id}/download
 */
export const cvDownloadApi = {
  download: async (cvId: string): Promise<{ buffer: ArrayBuffer; filename?: string }> => {
    const response = await apiClient.get<ArrayBuffer>(
      `/users/me/cvs/${encodeURIComponent(cvId)}/download`,
      { responseType: 'arraybuffer' }
    );
    const disposition = response.headers?.['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename="?([^"\s;]+)/);
    return { buffer: response.data, filename: match?.[1] };
  },
};

export const api = apiClient;
export default apiClient;
