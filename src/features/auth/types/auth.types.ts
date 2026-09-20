export type AuthRole =
  | 'CANDIDATE'
  | 'ADMIN'
  | 'QUESTION_AUTHOR'
  | 'QUESTION_REVIEWER'
  | 'DATA_CURATOR'
  | 'QUESTION_BANK_ADMIN'
  | string;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: AuthRole[];
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
  roles?: AuthRole[];
}
