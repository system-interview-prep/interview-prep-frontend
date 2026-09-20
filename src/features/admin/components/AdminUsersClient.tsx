"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Search, Shield, UserCheck, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  adminUsersApi,
  type AdminUser,
  type CreateAdminUserPayload,
  type UserRole,
  USER_ROLES,
} from "@features/admin/services/adminUsers.service";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  CANDIDATE: "Candidate",
  QUESTION_AUTHOR: "Question author",
  QUESTION_REVIEWER: "Question reviewer",
  DATA_CURATOR: "Data curator",
  QUESTION_BANK_ADMIN: "Question bank admin",
};

const emptyCreateForm: CreateAdminUserPayload = {
  name: "",
  email: "",
  temporaryPassword: "",
  roles: ["CANDIDATE"],
  phone: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", { dateStyle: "medium" });
}

function RolePicker({ value, onChange }: { value: UserRole[]; onChange: (roles: UserRole[]) => void }) {
  const toggle = (role: UserRole) => {
    const next = value.includes(role) ? value.filter((item) => item !== role) : [...value, role];
    if (next.length) onChange(next);
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {USER_ROLES.map((role) => (
        <label key={role} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#DCE4F3] p-2 text-xs text-[#14244B]">
          <input type="checkbox" checked={value.includes(role)} onChange={() => toggle(role)} />
          {ROLE_LABELS[role]}
        </label>
      ))}
    </div>
  );
}

export default function AdminUsersClient() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | UserRole>("all");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminUserPayload>(emptyCreateForm);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const cursor = cursorStack.at(-1);
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminUsersApi.list({
        query: query.trim() || undefined,
        role: role === "all" ? undefined : role,
        active: active === "all" ? undefined : active === "active",
        cursor,
        limit: 25,
      });
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [active, cursor, query, role]);

  useEffect(() => {
    const id = window.setTimeout(() => void loadUsers(), 300);
    return () => window.clearTimeout(id);
  }, [loadUsers]);

  const visibleUsers = users;
  const adminCount = users.filter((user) => user.roles.includes("ADMIN")).length;
  const activeCount = users.filter((user) => user.is_active).length;

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(null);
    try {
      await adminUsersApi.create({ ...createForm, phone: createForm.phone?.trim() || undefined });
      setCreateForm(emptyCreateForm); setShowCreate(false); await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo người dùng.");
    } finally { setSaving(false); }
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true); setError(null);
    try {
      await adminUsersApi.replaceRoles(selected.id, selected.roles);
      await adminUsersApi.setStatus(selected.id, selected.is_active);
      setSelected(null); await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể cập nhật người dùng.");
    } finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <AdminPageHeader
      title={t("admin.users.title") || "Quản lý người dùng"}
      description={t("admin.users.subtitle") || "Quản lý tài khoản, trạng thái và tập quyền đa vai trò."}
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: t("admin.sidebar.users") || "Người dùng" }]}
      statusBadge={<AdminStatusBadge status="healthy" label="Live API" />}
      primaryAction={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-3.5 py-2 text-xs font-bold text-white"><Plus className="size-4" />Tạo người dùng</button>}
    />

    <div className="grid gap-4 sm:grid-cols-3">
      <AdminMetricCard title="Tổng người dùng" value={loading ? null : total} subtitle="Theo bộ lọc tìm kiếm" icon={Users} isPending={loading} />
      <AdminMetricCard title="Đang hoạt động" value={loading ? null : activeCount} subtitle="Có thể đăng nhập" icon={UserCheck} isPending={loading} />
      <AdminMetricCard title="Quản trị viên" value={loading ? null : adminCount} subtitle="Có role ADMIN" icon={Shield} isPending={loading} />
    </div>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:flex-row">
      <label className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" /><input value={query} onChange={(e) => { setQuery(e.target.value); setCursorStack([undefined]); }} placeholder="Tìm theo tên hoặc email" className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-3 text-sm" /></label>
      <select value={role} onChange={(e) => { setRole(e.target.value as "all" | UserRole); setCursorStack([undefined]); }} className="rounded-xl border border-[#DCE4F3] px-3 text-sm"><option value="all">Mọi vai trò</option>{USER_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select>
      <select value={active} onChange={(e) => { setActive(e.target.value as typeof active); setCursorStack([undefined]); }} className="rounded-xl border border-[#DCE4F3] px-3 text-sm"><option value="all">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Đã vô hiệu hóa</option></select>
      <button onClick={() => void loadUsers()} aria-label="Làm mới" className="rounded-xl border border-[#DCE4F3] p-2 text-[#204195]"><RefreshCw className="size-4" /></button>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-[#DCE4F3] bg-white"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[#F8FAFC] text-xs uppercase text-[#607096]"><tr><th className="p-4">Tài khoản</th><th className="p-4">Roles</th><th className="p-4">Provider</th><th className="p-4">Trạng thái</th><th className="p-4">Tạo lúc</th><th className="p-4" /></tr></thead><tbody className="divide-y divide-[#EAEFF8]">
      {!loading && visibleUsers.map((user) => <tr key={user.id}><td className="p-4"><p className="font-semibold text-[#14244B]">{user.name}</p><p className="text-xs text-[#607096]">{user.email}</p></td><td className="p-4"><div className="flex flex-wrap gap-1">{user.roles.map((item) => <span key={item} className="rounded-full bg-[#EEF2FD] px-2 py-1 text-[10px] font-bold text-[#204195]">{ROLE_LABELS[item] ?? item}</span>)}</div></td><td className="p-4 text-xs">{user.provider}</td><td className="p-4"><AdminStatusBadge status={user.is_active ? "healthy" : "unavailable"} label={user.is_active ? "Active" : "Inactive"} size="sm" /></td><td className="p-4 text-xs">{formatDate(user.created_at)}</td><td className="p-4 text-right"><button onClick={() => setSelected({ ...user, roles: [...user.roles] })} className="font-semibold text-[#204195]">Quản lý</button></td></tr>)}
      {!loading && !visibleUsers.length && <tr><td colSpan={6}><AdminEmptyState variant="empty" title="Không có người dùng phù hợp" description="Thử thay đổi bộ lọc hoặc tạo người dùng mới." /></td></tr>}
      {loading && <tr><td colSpan={6} className="p-8 text-center text-[#607096]">Đang tải...</td></tr>}
    </tbody></table><div className="flex items-center justify-between border-t border-[#EAEFF8] px-4 py-3 text-xs text-[#607096]"><span>Hiển thị {users.length} / {total} người dùng</span><div className="flex gap-2"><button disabled={loading || cursorStack.length === 1} onClick={() => setCursorStack((items) => items.slice(0, -1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Trước</button><button disabled={loading || !nextCursor} onClick={() => nextCursor && setCursorStack((items) => [...items, nextCursor])} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Sau</button></div></div></div>

    {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"><form onSubmit={createUser} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold">Tạo người dùng</h2><p className="mt-1 text-xs text-[#607096]">Mật khẩu tạm chỉ được gửi một lần qua kênh an toàn.</p><div className="mt-4 grid gap-3"><input required placeholder="Họ tên" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="rounded-xl border p-3" /><input required type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="rounded-xl border p-3" /><input required minLength={8} type="password" placeholder="Mật khẩu tạm" value={createForm.temporaryPassword} onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })} className="rounded-xl border p-3" /><input placeholder="Số điện thoại (tuỳ chọn)" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="rounded-xl border p-3" /><RolePicker value={createForm.roles} onChange={(roles) => setCreateForm({ ...createForm, roles })} /></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border px-4 py-2 text-sm">Hủy</button><button disabled={saving} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-bold text-white">{saving ? "Đang lưu..." : "Tạo tài khoản"}</button></div></form></div>}
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"><section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold">Quản lý {selected.name}</h2><p className="mb-4 text-sm text-[#607096]">{selected.email}</p><RolePicker value={selected.roles} onChange={(roles) => setSelected({ ...selected, roles })} /><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.is_active} onChange={(e) => setSelected({ ...selected, is_active: e.target.checked })} />Tài khoản đang hoạt động</label><p className="mt-3 text-xs text-[#607096]">Các thao tác nguy hiểm (tự bỏ ADMIN, tự vô hiệu hóa, hoặc bỏ ADMIN cuối cùng) sẽ bị backend từ chối.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setSelected(null)} className="rounded-xl border px-4 py-2 text-sm">Hủy</button><button disabled={saving} onClick={() => void saveSelected()} className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-bold text-white">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div></section></div>}
  </div>;
}
