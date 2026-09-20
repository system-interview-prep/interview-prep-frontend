export type AuthRole = 'CANDIDATE' | 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'CANDIDATE' | 'ADMIN' | string;
  provider?: string;
  picture?: string | null;
  avatar?: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface AuthProfile {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  role?: string | null;
}
