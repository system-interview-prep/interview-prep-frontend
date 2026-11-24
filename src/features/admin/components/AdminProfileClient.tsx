"use client";

import { type ChangeEvent, type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Camera, KeyRound, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatUserRole } from "@/i18n/roles";
import { apiClient, userApi, type UserProfile } from "@/lib/apiClient";
import { readAuthProfile, writeAuthProfile } from "@features/auth/services/auth.service";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import AdminEmptyState from "./primitives/AdminEmptyState";
import { adminErrorCode } from "@features/admin/services/adminOps.service";
import { tr } from "@features/admin/pipeline/utils/pipelineFormat";

const INPUT =
  "w-full rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm text-[#14244B] focus:border-[#204195] focus:outline-none";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function syncStoredProfile(profile: UserProfile) {
  const existing = readAuthProfile();
  writeAuthProfile({
    email: profile.email ?? existing?.email ?? null,
    name: profile.name ?? existing?.name ?? null,
    picture: profile.picture ?? profile.avatar ?? existing?.picture ?? null,
    roles: profile.roles ?? existing?.roles ?? [],
  });
}

/** Change-password dialog; the backend checks the current password. */
function PasswordDialog({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const titleId = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const panelRef = useDialogA11y<HTMLDivElement>(true, busy ? undefined : onClose);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (next.length < 8) return setError(t("adminOps.profile.error.too_short"));
    if (next !== confirm) return setError(t("adminOps.profile.error.mismatch"));
    setBusy(true);
    try {
      await apiClient.post("/users/me/password", { currentPassword: current, newPassword: next });
      setDone(true);
    } catch (err) {
      const code = adminErrorCode(err) ?? "unknown";
      setError(tr(t, `adminOps.profile.error.${code}`, t("adminOps.error.unknown")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#14244B]/40" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] ring-1 ring-[#DCE4F3] outline-none"
      >
        <h2 id={titleId} className="text-lg font-semibold text-[#14244B]">
          {t("adminOps.profile.password.title")}
        </h2>
        {done ? (
          <>
            <p className="mt-3 text-sm text-[#1F7A4D]" role="status">
              {t("adminOps.profile.password.done")}
            </p>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={onClose} data-autofocus className="h-10 rounded-full bg-[#204195] px-5 text-sm font-semibold text-white">
                {t("adminOps.profile.close")}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-[#607096]">
              {t("adminOps.profile.password.current")}
              <input type="password" autoComplete="current-password" className={`${INPUT} mt-1`} value={current} onChange={(e) => setCurrent(e.target.value)} required data-autofocus />
            </label>
            <label className="block text-xs font-semibold text-[#607096]">
              {t("adminOps.profile.password.new")}
              <input type="password" autoComplete="new-password" className={`${INPUT} mt-1`} value={next} onChange={(e) => setNext(e.target.value)} required />
            </label>
            <label className="block text-xs font-semibold text-[#607096]">
              {t("adminOps.profile.password.confirm")}
              <input type="password" autoComplete="new-password" className={`${INPUT} mt-1`} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </label>
            {error ? (
              <p className="text-xs font-semibold text-[#C43B3B]" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={busy} className="h-10 rounded-full px-5 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3]">
                {t("adminOps.cancel")}
              </button>
              <button type="submit" disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#204195] px-5 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {t("adminOps.profile.password.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** The signed-in admin's own account: name and avatar can be changed, password for email accounts. */
export default function AdminProfileClient() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setStatus("loading");
    try {
      const { data } = await userApi.getProfile();
      setProfile(data);
      setName(data.name ?? "");
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await userApi.updateProfile({ name: name.trim() });
      setProfile(data);
      syncStoredProfile(data);
      setMessage({ tone: "ok", text: t("adminOps.profile.saved") });
    } catch (err) {
      const code = adminErrorCode(err) ?? "unknown";
      setMessage({ tone: "error", text: tr(t, `adminOps.profile.error.${code}`, t("adminOps.error.unknown")) });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(null);
    try {
      const { data } = await userApi.uploadProfilePicture(file);
      setProfile(data);
      syncStoredProfile(data);
      setMessage({ tone: "ok", text: t("adminOps.profile.avatarSaved") });
    } catch (err) {
      const detail = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage({ tone: "error", text: detail || t("adminOps.error.unknown") });
    }
  };

  const header = (
    <AdminPageHeader
      title={t("admin.profile.adminProfileTitle")}
      description={t("adminOps.profile.subtitle")}
      breadcrumbs={[
        { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
        { label: t("admin.profile.adminProfileTitle") },
      ]}
    />
  );

  if (status !== "ready" || !profile) {
    return (
      <div className="min-w-0 space-y-6">
        {header}
        {status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("admin.common.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState variant="error" title={t("adminOps.profile.loadError")} description="" onRetry={() => void load()} />
        )}
      </div>
    );
  }

  const picture = profile.picture || profile.avatar;
  const isGoogle = (profile.provider ?? "").toLowerCase() === "google";
  const changed = name.trim() !== (profile.name ?? "") && name.trim().length > 0;

  return (
    <div className="min-w-0 space-y-6">
      {header}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <AdminSection title={t("admin.profile.personalInfo")} description={t("adminOps.profile.personalNote")}>
          <div className="flex items-center gap-4 border-b border-[#EAEFF8] pb-5">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#EEF2FD] ring-4 ring-[#EEF2FD]">
                {picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover" alt="" src={picture} />
                ) : (
                  <span className="text-2xl font-black text-[#204195]">{initials(profile.name || profile.email)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#204195] text-white shadow-md hover:bg-[#183377]"
                aria-label={t("adminOps.profile.changeAvatar")}
              >
                <Camera className="size-3.5" aria-hidden="true" />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(e) => void upload(e)} />
            </div>
            <p className="text-xs text-[#607096]">{t("adminOps.profile.avatarHint")}</p>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-xs font-semibold text-[#607096]">
              {t("admin.profile.fullName")}
              <input className={`${INPUT} mt-1`} value={name} maxLength={255} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="text-xs">
              <p className="font-semibold text-[#607096]">{t("admin.profile.emailAddress")}</p>
              <p className="mt-1 text-sm text-[#14244B] [overflow-wrap:anywhere]">{profile.email}</p>
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[#607096]">{t("admin.profile.role")}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(profile.roles ?? []).map((role) => (
                  <span key={role} className="rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[10px] font-bold text-[#204195]">
                    {formatUserRole(role, t)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => void save()}
                disabled={!changed || saving}
                className="inline-flex items-center gap-2 rounded-full bg-[#204195] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                {t("adminOps.profile.save")}
              </button>
              {message ? (
                <span role="status" className={`text-xs font-semibold ${message.tone === "ok" ? "text-[#1F7A4D]" : "text-[#C43B3B]"}`}>
                  {message.text}
                </span>
              ) : null}
            </div>
          </div>
        </AdminSection>

        <AdminSection title={t("admin.profile.accountSecurity")} description={t("adminOps.profile.securityNote")}>
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-[#607096]">{t("adminOps.user.provider")}</dt>
              <dd className="font-semibold text-[#14244B]">
                {tr(t, `fixAdmin.ops.users.provider.${(profile.provider ?? "").toLowerCase()}`, profile.provider ?? "—")}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#607096]">{t("adminOps.user.createdAt")}</dt>
              <dd className="font-semibold text-[#14244B]">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString("vi-VN") : "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAEFF8] bg-[#F8FAFC] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FD] text-[#204195]">
                <KeyRound className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#14244B]">{t("admin.profile.changePassword")}</p>
                <p className="text-[11px] text-[#607096]">
                  {isGoogle ? t("adminOps.profile.password.google") : t("adminOps.profile.password.hint")}
                </p>
              </div>
            </div>
            {isGoogle ? null : (
              <button type="button" onClick={() => setPasswordOpen(true)} className="text-xs font-semibold text-[#204195] hover:underline">
                {t("adminOps.profile.password.open")}
              </button>
            )}
          </div>
        </AdminSection>
      </div>
      {passwordOpen ? <PasswordDialog onClose={() => setPasswordOpen(false)} /> : null}
    </div>
  );
}
