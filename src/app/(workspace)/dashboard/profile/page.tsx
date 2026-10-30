"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt, localeOf } from "@/i18n/format";
import { formatUserRole } from "@/i18n/roles";
import { userApi, type UserProfile } from "@lib/apiClient";
import { readAuthProfile, writeAuthProfile } from "@features/auth/services/auth.service";
import { API_BASE_URL } from "@/constants";
import WorkspacePageHeader from "@features/resume/components/WorkspacePageHeader";
import StatusNote from "@components/shared/StatusNote";
import { Loader2, Camera } from "lucide-react";

const ALLOWED_AVATAR_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

type EditState = {
  name: string;
  dob: string;
};

function normalizeDobForInput(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  const ymd = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (ymd) return ymd[1];
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

function formatDate(value: string | undefined, lang: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(localeOf(lang), {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function readApiError(error: unknown, t: (key: string) => string) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message[0]) return String(message[0]);
    if (error.response?.status) return fmt(t("fixApp.error.requestFailed"), { status: error.response.status });
  }
  return t("fixApp.error.generic");
}

/** "Google" / "Email và mật khẩu" instead of the raw provider code. */
function providerLabel(provider: string | undefined, t: (key: string) => string) {
  const code = (provider || "LOCAL").toUpperCase();
  if (code === "GOOGLE") return t("fixApp.profile.provider.google");
  if (code === "LOCAL") return t("fixApp.profile.provider.local");
  return code;
}

export default function UserProfilePage() {
  const { t, lang } = useLanguage();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isAvatarPickerOpeningRef = useRef(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<EditState>({ name: "", dob: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarCacheKey, setAvatarCacheKey] = useState<number>(Date.now());
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const roleLabel = t("userDash.roleFallback");
  const formattedRoles = useMemo(() => {
    if (!profile?.roles || profile.roles.length === 0) {
      return roleLabel;
    }
    return profile.roles.map((r) => formatUserRole(r, t)).join(", ");
  }, [profile?.roles, roleLabel, t]);

  const currentDisplayName = useMemo(() => {
    const name = profile?.name?.trim();
    if (name) return name;
    const email = profile?.email?.trim();
    if (!email) return "—";
    return email.split("@")[0] || "—";
  }, [profile?.email, profile?.name]);

  const displayedAvatar = useMemo(() => {
    if (avatarPreviewUrl) return avatarPreviewUrl;
    const raw =
      profile?.picture ||
      profile?.avatar ||
      readAuthProfile()?.picture ||
      "";
    if (!raw || typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";

    // Data URI hoặc Blob URL: hiển thị trực tiếp
    if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
      return trimmed;
    }

    // Google CDN avatar: KHÔNG chèn query cache parameter (Google CDN sẽ trả về 400/404 nếu có query lạ)
    if (trimmed.includes("googleusercontent.com") || trimmed.includes("google.com")) {
      return trimmed;
    }

    // Xử lý relative path từ backend
    const fullUrl = trimmed.startsWith("http")
      ? trimmed
      : `${API_BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
    const joiner = fullUrl.includes("?") ? "&" : "?";
    return `${fullUrl}${joiner}v=${avatarCacheKey}`;
  }, [avatarCacheKey, avatarPreviewUrl, profile?.avatar, profile?.picture]);

  // Reset load error whenever displayedAvatar changes
  useEffect(() => {
    setAvatarLoadError(false);
  }, [displayedAvatar]);

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.name !== (profile.name || "") ||
      form.dob !== normalizeDobForInput(profile.dob)
    );
  }, [form.dob, form.name, profile]);

  async function loadProfile() {
    try {
      setErrorMessage(null);
      setLoading(true);
      const response = await userApi.getProfile();
      const data = response.data;
      const avatarUrl = data.picture || data.avatar || null;
      setProfile({
        ...data,
        picture: avatarUrl ?? undefined,
        avatar: avatarUrl ?? undefined,
      });
      setAvatarCacheKey(Date.now());
      setForm({
        name: data.name || "",
        dob: normalizeDobForInput(data.dob),
      });

      const local = readAuthProfile();
      writeAuthProfile({
        email: data.email || local?.email || null,
        name: data.name || local?.name || null,
        picture: avatarUrl || local?.picture || null,
      });
    } catch (error) {
      setErrorMessage(readApiError(error, t));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // Load once on mount; loadProfile only reads `t` for error text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onFocus() {
      if (isAvatarPickerOpeningRef.current) {
        isAvatarPickerOpeningRef.current = false;
        return;
      }
      loadProfile();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // Subscribe once; the handler always calls the latest loadProfile via closure on re-mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField<K extends keyof EditState>(key: K, value: EditState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    isAvatarPickerOpeningRef.current = false;
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME.has(file.type.toLowerCase())) {
      setErrorMessage(t("profile.avatarTypeError"));
      e.target.value = "";
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(t("profile.avatarSizeError"));
      e.target.value = "";
      return;
    }

    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(previewUrl);
      setErrorMessage(null);
      setSuccessMessage(null);
      setUploadingAvatar(true);

      // A failed upload must not look saved: the error below says the old avatar stays.
      const response = await userApi.uploadProfilePicture(file);
      const updatedUser: UserProfile | null = response.data ?? null;
      const finalAvatarUrl = updatedUser?.picture || updatedUser?.avatar || null;

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setAvatarPreviewUrl(null);
      setAvatarCacheKey(Date.now());
      setAvatarLoadError(false);

      if (updatedUser) {
        setProfile(updatedUser);
      } else if (profile && finalAvatarUrl) {
        setProfile({ ...profile, picture: finalAvatarUrl, avatar: finalAvatarUrl });
      }

      writeAuthProfile({
        email: updatedUser?.email || profile?.email || null,
        name: updatedUser?.name || profile?.name || null,
        picture: finalAvatarUrl || profile?.picture || null,
      });

      setSuccessMessage(t("profile.avatarSuccess"));
    } catch (error) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setAvatarPreviewUrl(null);
      setErrorMessage(`${t("fixApp.profile.avatarUploadFailed")} ${readApiError(error, t)}`);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }


  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;

    const payload: Partial<Pick<UserProfile, "name" | "dob">> = {};
    if (form.name !== (profile.name || "")) payload.name = form.name;
    if (form.dob !== normalizeDobForInput(profile.dob)) payload.dob = form.dob;

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSaving(true);
      const response = await userApi.updateProfile(payload);
      const updated = response.data;
      setProfile(updated);
      setForm({
        name: updated.name || "",
        dob: normalizeDobForInput(updated.dob),
      });
      writeAuthProfile({
        email: updated.email || profile.email || null,
        name: updated.name || null,
        picture: updated.picture || null,
      });
      setSuccessMessage(t("profile.updateSuccess"));
    } catch (error) {
      setErrorMessage(readApiError(error, t));
    } finally {
      setSaving(false);
    }
  }

  function openAvatarPicker() {
    isAvatarPickerOpeningRef.current = true;
    avatarInputRef.current?.click();
  }

  function resetForm() {
    if (!profile) return;
    setForm({
      name: profile.name || "",
      dob: normalizeDobForInput(profile.dob),
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-16 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <WorkspacePageHeader
            title={t("profile.title")}
            subtitle={t("profile.subtitle")}
          />

          {/* Feedback from the fox (shown here until the profile form is available) */}
          {!profile && errorMessage && (
            <StatusNote
              text={errorMessage}
              tone="error"
              onDismiss={() => setErrorMessage(null)}
              dismissLabel={t("fixApp.common.dismissError")}
            />
          )}

          {/* Main content area */}
          {loading ? (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]" role="status" aria-label={t("profile.loading")}>
              <div className="animate-pulse rounded-2xl bg-white p-6 border border-[#DCE4F3]">
                <div className="mx-auto h-24 w-24 rounded-full bg-[#F0F4FC]" />
                <div className="mx-auto mt-4 h-6 w-36 rounded-lg bg-[#F0F4FC]" />
                <div className="mx-auto mt-2 h-4 w-24 rounded-lg bg-[#F0F4FC]" />
                <div className="mt-8 space-y-4">
                  <div className="h-8 rounded-lg bg-[#F8FAFC]" />
                  <div className="h-8 rounded-lg bg-[#F8FAFC]" />
                  <div className="h-8 rounded-lg bg-[#F8FAFC]" />
                </div>
              </div>
              <div className="animate-pulse rounded-2xl bg-white p-6 border border-[#DCE4F3]">
                <div className="h-7 w-40 rounded-lg bg-[#F0F4FC]" />
                <div className="mt-2 h-4 w-64 max-w-full rounded-lg bg-[#F0F4FC]" />
                <div className="mt-8 space-y-6">
                  <div className="h-10 rounded-2xl bg-[#F8FAFC]" />
                  <div className="h-10 rounded-2xl bg-[#F8FAFC]" />
                  <div className="h-10 rounded-2xl bg-[#F8FAFC]" />
                  <div className="h-10 w-32 rounded-xl bg-[#F0F4FC]" />
                </div>
              </div>
            </section>
          ) : !profile ? (
            <section
              className="flex flex-col items-center rounded-2xl bg-white p-8 text-center border border-[#DCE4F3]"
              role="alert">
              <h2 className="mt-3 text-xl font-semibold text-[#14244B]">{t("profile.loadError")}</h2>
              <button
                type="button"
                onClick={loadProfile}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                {t("profile.retry")}
              </button>
            </section>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Cột trái: Identity & Avatar Card */}
              <section className="min-w-0 overflow-hidden rounded-2xl bg-white border border-[#DCE4F3]">
                <div className="border-b border-[#EAEFF8] bg-[#F8FAFC] p-6 text-center sm:p-7">
                  <div className="relative mx-auto inline-block">
                    {/* Avatar Container 24x24 (96px) */}
                    <div
                      className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#F0F4FC] shadow-sm"
                      aria-label={t("fixApp.profile.avatarAria")}
                    >
                      {displayedAvatar && !avatarLoadError ? (
                        <img
                          alt={currentDisplayName}
                          className="h-full w-full object-cover"
                          src={displayedAvatar}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarLoadError(true)}
                        />
                      ) : (
                        <span className="text-2xl font-bold tracking-wider text-[#204195]">
                          {currentDisplayName !== "—" ? initialsFromName(currentDisplayName) : "?"}
                        </span>
                      )}

                      {/* Uploading indicator overlay */}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#14244B]/60 text-white">
                          <Loader2 className="animate-spin size-6" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {/* Camera action badge button */}
                    <button
                      type="button"
                      onClick={openAvatarPicker}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#204195] text-white shadow-sm transition-transform hover:scale-105 hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={t("profile.avatarChange")}
                      title={t("profile.avatarChange")}
                    >
                      <Camera className="size-4" aria-hidden="true" />
                    </button>

                    {/* Hidden input file */}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onClick={(e) => {
                        isAvatarPickerOpeningRef.current = true;
                        e.currentTarget.value = "";
                      }}
                      onChange={onAvatarFileChange}
                    />
                  </div>

                  <h2 className="mt-4 line-clamp-2 break-words text-lg font-bold text-[#14244B]" title={currentDisplayName}>
                    {currentDisplayName}
                  </h2>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-xs font-semibold text-[#204195]">
                      {formattedRoles}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#607096]">
                    {uploadingAvatar ? t("profile.avatarUploading") : t("profile.avatarHint")}
                  </p>
                </div>

                {/* Key-Value Details */}
                <div className="p-6">
                  <h3 className="mb-3 text-sm font-semibold text-[#204195]">
                    {t("profile.accountDetails")}
                  </h3>
                  <div className="divide-y divide-[#EAEFF8] rounded-2xl bg-[#F8FAFC] border border-[#DCE4F3]">
                    <div className="flex flex-col gap-1 p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <span className="shrink-0 font-medium text-[#607096]">
                        {t("profile.field.email")}
                      </span>
                      <span className="min-w-0 font-semibold text-[#14244B] [overflow-wrap:anywhere] sm:text-right">
                        {profile.email || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5 text-sm">
                      <span className="shrink-0 font-medium text-[#607096]">
                        {t("profile.field.role")}
                      </span>
                      <span className="min-w-0 text-right font-semibold text-[#14244B]">
                        {formattedRoles}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5 text-sm">
                      <span className="shrink-0 font-medium text-[#607096]">
                        {t("profile.field.provider")}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#14244B] border border-[#DCE4F3]">
                        {providerLabel(profile.provider, t)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5 text-sm">
                      <span className="shrink-0 font-medium text-[#607096]">
                        {t("profile.field.joined")}
                      </span>
                      <span className="min-w-0 text-right font-semibold text-[#14244B]">
                        {formatDate(profile.created_at, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cột phải: Form cập nhật thông tin (Edit Profile Card) */}
              <section className="min-w-0 rounded-2xl bg-white p-5 border border-[#DCE4F3] sm:p-6">
                <div className="mb-6 border-b border-[#EAEFF8] pb-4">
                  <h2 className="text-lg font-bold text-[#14244B]">
                    {t("profile.editTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-[#607096]">
                    {t("profile.editHint")}
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                  {/* Họ và tên */}
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[#14244B]">
                      {t("profile.field.name")}
                    </span>
                    <div className="relative flex items-center">
                      <input
                        id="profile-name-input"
                        type="text"
                        className="h-11 w-full rounded-2xl border-0 bg-[#F8FAFC] px-4 text-sm font-medium text-[#14244B] border border-[#DCE4F3] placeholder:text-[#607096]/60 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder={t("profile.field.namePlaceholder")}
                      />
                    </div>
                  </label>

                  {/* Ngày sinh */}
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[#14244B]">
                      {t("profile.field.dob")}
                    </span>
                    <div className="relative flex items-center">
                      <input
                        id="profile-dob-input"
                        type="date"
                        className="h-11 w-full rounded-2xl border-0 bg-[#F8FAFC] px-4 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                        value={form.dob}
                        onChange={(e) => setField("dob", e.target.value)}
                      />
                    </div>
                  </label>

                  {/* Email (Read-only) */}
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[#607096]">
                      {t("profile.field.emailReadonly")}
                    </span>
                    <div className="relative flex items-center">
                      <input
                        id="profile-email-input"
                        type="email"
                        className="h-11 w-full cursor-not-allowed rounded-2xl border-0 bg-[#F0F4FC] px-4 text-sm font-medium text-[#607096] border border-[#DCE4F3] select-none"
                        value={profile.email || ""}
                        readOnly
                        aria-readonly="true"
                      />
                    </div>
                    <p className="text-xs text-[#607096]">
                      {t("profile.emailReadonlyNotice")}
                    </p>
                  </label>

                  {/* Form actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#EAEFF8]">
                    <button
                      type="submit"
                      disabled={saving || !isDirty}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin size-4" aria-hidden="true" />
                          <span>{t("profile.saving")}</span>
                        </>
                      ) : (
                        <span>{t("profile.save")}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving || !isDirty}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#F8FAFC] px-5 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#F0F4FC] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>{t("profile.reset")}</span>
                    </button>

                    {isDirty && (
                      <span className="ml-auto rounded-full bg-[#FFF8E6] px-2.5 py-0.5 text-xs font-semibold text-[#8A5A00]">
                        {t("profile.unsavedChanges")}
                      </span>
                    )}
                  </div>

                  {/* The fox reacts to save / avatar results right next to the actions */}
                  {errorMessage && (
                    <StatusNote
                      text={errorMessage}
                      tone="error"
                      onDismiss={() => setErrorMessage(null)}
                      dismissLabel={t("fixApp.common.dismissError")}
                    />
                  )}
                  {successMessage && (
                    <StatusNote
                      text={successMessage}
                      tone="success"
                      onDismiss={() => setSuccessMessage(null)}
                      dismissLabel={t("fixApp.common.dismissNotice")}
                    />
                  )}
                </form>
              </section>
            </div>
          )}
        </div>
      </main>
    </UserDashboardShell>
  );
}
