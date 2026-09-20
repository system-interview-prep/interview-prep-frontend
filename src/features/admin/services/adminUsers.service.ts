import api from "@/lib/apiClient";

export const USER_ROLES = [
  "CANDIDATE",
  "QUESTION_AUTHOR",
  "QUESTION_REVIEWER",
  "DATA_CURATOR",
  "QUESTION_BANK_ADMIN",
  "ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  roles: UserRole[];
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  temporaryPassword: string;
  roles: UserRole[];
  phone?: string;
};

export const adminUsersApi = {
  list: (params?: { query?: string; role?: UserRole; active?: boolean; cursor?: string; limit?: number }) =>
    api.get<{ items: AdminUser[]; total: number; nextCursor?: string | null }>("/admin/users", { params }),
  create: (payload: CreateAdminUserPayload) => api.post<AdminUser>("/admin/users", payload),
  replaceRoles: (id: string, roles: UserRole[]) =>
    api.put<{ id: string; roles: UserRole[] }>(`/admin/users/${encodeURIComponent(id)}/roles`, { roles }),
  setStatus: (id: string, isActive: boolean) =>
    api.patch<{ id: string; isActive: boolean }>(`/admin/users/${encodeURIComponent(id)}/status`, { isActive }),
};
