"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Search, Shield, UserCheck, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt, localeOf } from "@/i18n/format";
import { formatUserRole } from "@/i18n/roles";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { StatusNote } from "@components/shared/StatusNote";
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

type Translate = (key: string) => string;

const emptyCreateForm: CreateAdminUserPayload = {
  name: "",
  email: "",
  temporaryPassword: "",
  roles: ["CANDIDATE"],
  phone: "",
};

const inputClass =
  "w-full rounded-xl border border-[#DCE4F3] bg-white p-3 text-sm text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold text-[#14244B]";
const secondaryButton =
  "rounded-full border border-[#DCE4F3] bg-white px-4 py-2 text-sm font-semibold text-[#14244B] hover:bg-[#F8FAFC]";
const primaryButton =
  "rounded-full bg-[#204195] px-4 py-2 text-sm font-bold text-white hover:bg-[#183275] disabled:opacity-60";

/** Translated text, or `fallback` when the key has no translation yet. */
function tOr(t: Translate, key: string, fallback: string) {
  const value = t(key);
  return value && value !== key ? value : fallback;
}

/** Server-provided message when there is one, otherwise a friendly default. */
function errorMessage(cause: unknown, fallback: string) {
  const data = (cause as { response?: { data?: { detail?: unknown; message?: unknown } } })?.response?.data;
  if (typeof data?.detail === "string" && data.detail) return data.detail;
  if (typeof data?.message === "string" && data.message) return data.message;
  return fallback;
}

function RolePicker({
  value,
  onChange,
  t,
  legend,
}: {
  value: UserRole[];
  onChange: (roles: UserRole[]) => void;
  t: Translate;
  legend: string;
}) {
  const toggle = (role: UserRole) => {
    const next = value.includes(role) ? value.filter((item) => item !== role) : [...value, role];
    if (next.length) onChange(next);
  };
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {USER_ROLES.map((role) => (
          <label key={role} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#DCE4F3] p-2 text-xs text-[#14244B]">
            <input type="checkbox" checked={value.includes(role)} onChange={() => toggle(role)} className="accent-[#204195]" />
            {formatUserRole(role, t)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function AdminUsersClient() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | UserRole>("all");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminUserPayload>(emptyCreateForm);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const closeCreate = useCallback(() => {
    setShowCreate(false);
    setCreateError(null);
  }, []);
  const closeManage = useCallback(() => {
    setSelected(null);
    setManageError(null);
  }, []);
  const createRef = useDialogA11y<HTMLDivElement>(showCreate, closeCreate);
  const manageRef = useDialogA11y<HTMLDivElement>(selected !== null, closeManage);

  const cursor = cursorStack.at(-1);
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setListError(null);
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
      setListError(t("fixAdmin.ops.users.loadError"));
    } finally {
      setLoading(false);
    }
  }, [active, cursor, query, role, t]);

  useEffect(() => {
    const id = window.setTimeout(() => void loadUsers(), 300);
    return () => window.clearTimeout(id);
  }, [loadUsers]);

  const adminCount = users.filter((user) => user.roles.includes("ADMIN")).length;
  const activeCount = users.filter((user) => user.is_active).length;

  const formatDate = (value: string) => new Date(value).toLocaleDateString(localeOf(lang), { dateStyle: "medium" });
  const providerLabel = (provider: string) =>
    tOr(t, `fixAdmin.ops.users.provider.${provider?.toLowerCase()}`, provider || "—");

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setCreateError(null);
    try {
      await adminUsersApi.create({ ...createForm, phone: createForm.phone?.trim() || undefined });
      setCreateForm(emptyCreateForm);
      setShowCreate(false);
      await loadUsers();
    } catch (cause) {
      setCreateError(errorMessage(cause, t("fixAdmin.ops.users.createError")));
    } finally {
      setSaving(false);
    }
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    setManageError(null);
    try {
      await adminUsersApi.replaceRoles(selected.id, selected.roles);
      await adminUsersApi.setStatus(selected.id, selected.is_active);
      setSelected(null);
      await loadUsers();
    } catch (cause) {
      setManageError(errorMessage(cause, t("fixAdmin.ops.users.updateError")));
    } finally {
      setSaving(false);
    }
  }

  const resetPaging = () => setCursorStack([undefined]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.users.title")}
        description={t("admin.users.subtitle")}
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: t("admin.sidebar.users") }]}
        statusBadge={<AdminStatusBadge status="healthy" label={t("fixAdmin.ops.users.liveBadge")} />}
        primaryAction={
          <button
            type="button"
            onClick={() => { setCreateError(null); setShowCreate(true); }}
            className="inline-flex items-center gap-2 rounded-full bg-[#204195] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#183275]"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("fixAdmin.ops.users.create")}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.ops.users.stat.total")}
          value={loading ? null : total}
          subtitle={t("fixAdmin.ops.users.stat.totalSub")}
          icon={Users}
          isPending={loading}
          pendingText={t("admin.common.loading")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ops.users.stat.activeOnPage")}
          value={loading ? null : activeCount}
          subtitle={t("fixAdmin.ops.users.stat.activeOnPageSub")}
          icon={UserCheck}
          isPending={loading}
          pendingText={t("admin.common.loading")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ops.users.stat.adminsOnPage")}
          value={loading ? null : adminCount}
          subtitle={t("fixAdmin.ops.users.stat.adminsOnPageSub")}
          icon={Shield}
          isPending={loading}
          pendingText={t("admin.common.loading")}
        />
      </div>

      {listError && (
        <StatusNote
          tone="error"
          text={listError}
          onDismiss={() => setListError(null)}
          dismissLabel={t("fixAdmin.ops.common.dismiss")}
        />
      )}

      <div className="flex flex-col gap-3 rounded-3xl border border-[#DCE4F3] bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="admin-users-search" className="sr-only">{t("fixAdmin.ops.users.searchLabel")}</label>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
          <input
            id="admin-users-search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetPaging(); }}
            placeholder={t("fixAdmin.ops.users.searchPlaceholder")}
            className="w-full rounded-full border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-3 text-sm text-[#14244B] focus:border-[#204195] focus:bg-white focus:outline-none"
          />
        </div>
        <label htmlFor="admin-users-role" className="sr-only">{t("fixAdmin.ops.users.roleFilterLabel")}</label>
        <select
          id="admin-users-role"
          value={role}
          onChange={(e) => { setRole(e.target.value as "all" | UserRole); resetPaging(); }}
          className="rounded-full border border-[#DCE4F3] bg-white px-3 py-2 text-sm text-[#14244B]"
        >
          <option value="all">{t("fixAdmin.ops.users.allRoles")}</option>
          {USER_ROLES.map((item) => <option key={item} value={item}>{formatUserRole(item, t)}</option>)}
        </select>
        <label htmlFor="admin-users-status" className="sr-only">{t("fixAdmin.ops.users.statusFilterLabel")}</label>
        <select
          id="admin-users-status"
          value={active}
          onChange={(e) => { setActive(e.target.value as typeof active); resetPaging(); }}
          className="rounded-full border border-[#DCE4F3] bg-white px-3 py-2 text-sm text-[#14244B]"
        >
          <option value="all">{t("fixAdmin.ops.users.allStatuses")}</option>
          <option value="active">{t("fixAdmin.ops.users.status.active")}</option>
          <option value="inactive">{t("fixAdmin.ops.users.status.inactive")}</option>
        </select>
        <button
          type="button"
          onClick={() => void loadUsers()}
          aria-label={t("admin.common.refresh")}
          title={t("admin.common.refresh")}
          className="grid size-10 place-items-center rounded-full border border-[#DCE4F3] text-[#204195] hover:bg-[#F8FAFC]"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-[#DCE4F3] bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs uppercase text-[#607096]">
            <tr>
              <th className="p-4">{t("fixAdmin.ops.users.table.account")}</th>
              <th className="p-4">{t("fixAdmin.ops.users.table.roles")}</th>
              <th className="p-4">{t("fixAdmin.ops.users.table.provider")}</th>
              <th className="p-4">{t("fixAdmin.ops.users.table.status")}</th>
              <th className="p-4">{t("fixAdmin.ops.users.table.createdAt")}</th>
              <th className="p-4"><span className="sr-only">{t("admin.common.actions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8]">
            {!loading && users.map((user) => (
              <tr key={user.id}>
                <td className="p-4">
                  <p className="font-semibold text-[#14244B]">{user.name}</p>
                  <p className="text-xs text-[#607096]">{user.email}</p>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((item) => (
                      <span key={item} className="rounded-full bg-[#EEF2FD] px-2 py-1 text-[10px] font-bold text-[#204195]">
                        {formatUserRole(item, t)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-xs text-[#14244B]">{providerLabel(user.provider)}</td>
                <td className="p-4">
                  <AdminStatusBadge
                    status={user.is_active ? "healthy" : "unavailable"}
                    label={user.is_active ? t("fixAdmin.ops.users.status.active") : t("fixAdmin.ops.users.status.inactive")}
                    size="sm"
                  />
                </td>
                <td className="p-4 text-xs text-[#14244B]">{formatDate(user.created_at)}</td>
                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={() => { setManageError(null); setSelected({ ...user, roles: [...user.roles] }); }}
                    className="rounded-full px-3 py-1 font-semibold text-[#204195] hover:bg-[#F0F4FC]"
                  >
                    {t("fixAdmin.ops.users.manage")}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !users.length && (
              <tr>
                <td colSpan={6}>
                  <AdminEmptyState
                    variant="empty"
                    title={t("fixAdmin.ops.users.emptyTitle")}
                    description={t("fixAdmin.ops.users.emptyDesc")}
                  />
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#607096]">{t("fixAdmin.ops.users.loading")}</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#EAEFF8] px-4 py-3 text-xs text-[#607096]">
          <span>{fmt(t("fixAdmin.ops.users.showing"), { count: users.length, total })}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || cursorStack.length === 1}
              onClick={() => setCursorStack((items) => items.slice(0, -1))}
              className="rounded-full border border-[#DCE4F3] px-3 py-1.5 text-[#14244B] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              {t("fixAdmin.ops.common.prev")}
            </button>
            <button
              type="button"
              disabled={loading || !nextCursor}
              onClick={() => nextCursor && setCursorStack((items) => [...items, nextCursor])}
              className="rounded-full border border-[#DCE4F3] px-3 py-1.5 text-[#14244B] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              {t("fixAdmin.ops.common.next")}
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#14244B]/40 p-4">
          <div
            ref={createRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-create-user-title"
            tabIndex={-1}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl focus:outline-none"
          >
            <form onSubmit={createUser}>
              <h2 id="admin-create-user-title" className="text-lg font-bold text-[#14244B]">{t("fixAdmin.ops.users.create")}</h2>
              <p className="mt-1 text-xs text-[#607096]">{t("fixAdmin.ops.users.form.passwordNote")}</p>
              <div className="mt-4 grid gap-3">
                <div>
                  <label htmlFor="admin-create-name" className={labelClass}>{t("fixAdmin.ops.users.form.name")}</label>
                  <input id="admin-create-name" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="admin-create-email" className={labelClass}>{t("fixAdmin.ops.users.form.email")}</label>
                  <input id="admin-create-email" required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="admin-create-password" className={labelClass}>{t("fixAdmin.ops.users.form.password")}</label>
                  <input id="admin-create-password" required minLength={8} type="password" aria-describedby="admin-create-password-hint" value={createForm.temporaryPassword} onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })} className={inputClass} />
                  <p id="admin-create-password-hint" className="mt-1 text-[11px] text-[#607096]">{t("fixAdmin.ops.users.form.passwordHint")}</p>
                </div>
                <div>
                  <label htmlFor="admin-create-phone" className={labelClass}>{t("fixAdmin.ops.users.form.phone")}</label>
                  <input id="admin-create-phone" type="tel" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={inputClass} />
                </div>
                <RolePicker legend={t("fixAdmin.ops.users.form.roles")} value={createForm.roles} onChange={(roles) => setCreateForm({ ...createForm, roles })} t={t} />
              </div>
              {createError && <StatusNote tone="error" text={createError} className="mt-4" />}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={closeCreate} className={secondaryButton}>{t("admin.common.cancel")}</button>
                <button type="submit" disabled={saving} className={primaryButton}>
                  {saving ? t("fixAdmin.ops.common.saving") : t("fixAdmin.ops.users.form.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#14244B]/40 p-4">
          <div
            ref={manageRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-manage-user-title"
            tabIndex={-1}
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl focus:outline-none"
          >
            <h2 id="admin-manage-user-title" className="text-lg font-bold text-[#14244B]">
              {fmt(t("fixAdmin.ops.users.manageTitle"), { name: selected.name })}
            </h2>
            <p className="mb-4 text-sm text-[#607096]">{selected.email}</p>
            <RolePicker legend={t("fixAdmin.ops.users.form.roles")} value={selected.roles} onChange={(roles) => setSelected({ ...selected, roles })} t={t} />
            <label htmlFor="admin-manage-active" className="mt-4 flex items-center gap-2 text-sm text-[#14244B]">
              <input id="admin-manage-active" type="checkbox" checked={selected.is_active} onChange={(e) => setSelected({ ...selected, is_active: e.target.checked })} className="accent-[#204195]" />
              {t("fixAdmin.ops.users.activeToggle")}
            </label>
            <p className="mt-3 text-xs text-[#607096]">{t("fixAdmin.ops.users.dangerNote")}</p>
            {manageError && <StatusNote tone="error" text={manageError} className="mt-4" />}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeManage} className={secondaryButton}>{t("admin.common.cancel")}</button>
              <button type="button" disabled={saving} onClick={() => void saveSelected()} className={primaryButton}>
                {saving ? t("fixAdmin.ops.common.saving") : t("fixAdmin.ops.users.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
