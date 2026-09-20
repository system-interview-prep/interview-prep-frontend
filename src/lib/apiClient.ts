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

// ── Interview API ──────────────────────────────────────────────────────────────
// NOTE: Routes /interview/start, /interview/{id}, etc. không tồn tại ở BE.
// Dùng /ai/session (sessionsApi) để tạo/quản lý interview sessions.
// Xem: src/lib/aiService.ts → createSession(), closeSession(), getAllSessions()

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
    // BE hỗ trợ cả /users/me/picture và /user/profile/picture (alias)
    return apiClient.post<UserProfile>('/users/me/picture', formData);
  },
};

// ── Admin Portal API ──────────────────────────────────────────────────────────
export type AdminOverviewData = {
  totalCandidates: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  averageScore: number;
  averageTurnaround: number;
  sentimentScore: number;
  monthlyTrend: Array<{ month: string; count: number }>;
  modes: {
    chat: number;
    voice: number;
    video: number;
  };
  cohorts: Array<{
    id: string;
    name: string;
    engagement: string;
    avgScore: string;
    growth: string;
    status: 'optimized' | 'monitored';
  }>;
  aiEngineStatus: string;
  updatedAt: string;
};

export type AdminSessionItem = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateInitials: string;
  position: string;
  teamAndLocation: string;
  type: 'video' | 'chat' | 'voice';
  aiScore: number | null;
  dateLabel: string;
  timeLabel: string;
  status: 'completed' | 'scheduled' | 'action_needed';
  actionLabel: string;
};

export const adminApi = {
  getOverview: () =>
    apiClient.get<{ success: boolean; overview: AdminOverviewData }>('/admin/overview'),
  getSessions: (params?: { mode?: string; search?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ success: boolean; total: number; sessions: AdminSessionItem[] }>('/admin/sessions', {
      params,
    }),
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
