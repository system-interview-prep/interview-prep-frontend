"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import LanguageToggleButton from "../../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { userApi, type UserProfile } from "../../../services/api";
import { readAuthProfile, writeAuthProfile } from "../../../auth/authProfile";

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

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function readApiError(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message[0]) return String(message[0]);
    if (error.response?.status) return `Request failed (${error.response.status})`;
  }
  return "Something went wrong. Please try again.";
}

export default function UserProfilePage() {
  const { t } = useLanguage();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isAvatarPickerOpeningRef = useRef(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<EditState>({ name: "", dob: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarCacheKey, setAvatarCacheKey] = useState<number>(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const roleLabel = t("userDash.roleFallback");

  const currentDisplayName = useMemo(() => {
    const name = profile?.name?.trim();
    if (name) return name;
    const email = profile?.email?.trim();
    if (!email) return "—";
    return email.split("@")[0] || "—";
  }, [profile?.email, profile?.name]);

  const displayedAvatar = useMemo(() => {
    if (avatarPreviewUrl) return avatarPreviewUrl;
    if (!profile?.picture) return "";
    const joiner = profile.picture.includes("?") ? "&" : "?";
    return `${profile.picture}${joiner}v=${avatarCacheKey}`;
  }, [avatarCacheKey, avatarPreviewUrl, profile?.picture]);

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
      setProfile(data);
      setAvatarCacheKey(Date.now());
      setForm({
        name: data.name || "",
        dob: normalizeDobForInput(data.dob),
      });

      const local = readAuthProfile();
      writeAuthProfile({
        email: data.email || local?.email || null,
        name: data.name || local?.name || null,
        picture: data.picture || local?.picture || null,
      });
    } catch (error) {
      setErrorMessage(readApiError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
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
      const response = await userApi.uploadProfilePicture(file);
      const updated = response.data;
      URL.revokeObjectURL(previewUrl);
      setAvatarPreviewUrl(null);
      setAvatarCacheKey(Date.now());
      setProfile(updated);
      setForm({
        name: updated.name || "",
        dob: normalizeDobForInput(updated.dob),
      });
      writeAuthProfile({
        email: updated.email || null,
        name: updated.name || null,
        picture: updated.picture || null,
      });
      setSuccessMessage(t("profile.avatarSuccess"));
    } catch (error) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setAvatarPreviewUrl(null);
      setErrorMessage(readApiError(error));
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
      setErrorMessage(readApiError(error));
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
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 pb-28 pt-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <header className="mb-8 flex flex-col gap-5 border-b-2 border-[#234196] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="sticker -rotate-1 bg-[#FCB625] text-[10px] text-[#234196]">
                {t("profile.settingsBadge")}
              </span>
              <h1 className="mt-3 font-headline text-3xl font-extrabold tracking-tight text-[#234196] sm:text-4xl md:text-5xl">
                {t("profile.title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#5A6B8F] sm:text-base">
                {t("profile.subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <LanguageToggleButton className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-white text-[#234196] shadow-[2px_2px_0_#234196] transition-all hover:bg-[#F0F4FC] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none" />
              <Link
                href="/dashboard"
                className="chunky-secondary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-bold"
                aria-label={t("interview.select.backDashboard")}
                title={t("interview.select.backDashboard")}
              >
                <span className="material-symbols-outlined select-none text-[18px] leading-none" aria-hidden="true">
                  arrow_back
                </span>
                <span>{t("interview.select.backDashboard")}</span>
              </Link>
            </div>
          </header>

          {/* Feedback alerts */}
          {errorMessage && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] p-4 text-sm text-[#8F1D1D] shadow-[3px_3px_0_#D32F2F]"
              role="alert"
            >
              <span className="material-symbols-outlined shrink-0 text-xl text-[#D32F2F]" aria-hidden="true">
                error
              </span>
              <div className="min-w-0 flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="shrink-0 text-[#8F1D1D] transition-opacity hover:opacity-75"
                aria-label="Dismiss error"
              >
                <span className="material-symbols-outlined text-lg leading-none" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-[3px_3px_0_#059669]"
              role="status"
            >
              <span className="material-symbols-outlined shrink-0 text-xl text-emerald-600" aria-hidden="true">
                check_circle
              </span>
              <div className="min-w-0 flex-1 font-medium">{successMessage}</div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="shrink-0 text-emerald-900 transition-opacity hover:opacity-75"
                aria-label="Dismiss success"
              >
                <span className="material-symbols-outlined text-lg leading-none" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
          )}

          {/* Main content area */}
          {loading ? (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]" role="status" aria-label={t("profile.loading")}>
              <div className="animate-pulse rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196]">
                <div className="mx-auto h-24 w-24 rounded-full bg-[#E8EDF8]" />
                <div className="mx-auto mt-4 h-6 w-36 rounded-lg bg-[#E8EDF8]" />
                <div className="mx-auto mt-2 h-4 w-24 rounded-lg bg-[#E8EDF8]" />
                <div className="mt-8 space-y-4">
                  <div className="h-8 rounded-lg bg-[#F0F4FC]" />
                  <div className="h-8 rounded-lg bg-[#F0F4FC]" />
                  <div className="h-8 rounded-lg bg-[#F0F4FC]" />
                </div>
              </div>
              <div className="animate-pulse rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196]">
                <div className="h-7 w-40 rounded-lg bg-[#E8EDF8]" />
                <div className="mt-2 h-4 w-64 rounded-lg bg-[#E8EDF8]" />
                <div className="mt-8 space-y-6">
                  <div className="h-11 rounded-xl bg-[#F0F4FC]" />
                  <div className="h-11 rounded-xl bg-[#F0F4FC]" />
                  <div className="h-11 rounded-xl bg-[#F0F4FC]" />
                  <div className="h-11 w-32 rounded-xl bg-[#E8EDF8]" />
                </div>
              </div>
            </section>
          ) : !profile ? (
            <section
              className="rounded-2xl border-2 border-[#D32F2F] bg-[#FFEBEE] p-8 text-center text-[#8F1D1D] shadow-[4px_4px_0_#D32F2F]"
              role="alert"
            >
              <span className="material-symbols-outlined text-4xl text-[#D32F2F]" aria-hidden="true">
                cloud_off
              </span>
              <h2 className="mt-2 font-headline text-xl font-bold">{t("profile.loadError")}</h2>
              <button
                type="button"
                onClick={loadProfile}
                className="chunky-primary mt-4 px-5 py-2.5 text-sm"
              >
                Thử lại
              </button>
            </section>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Cột trái: Identity & Avatar Card */}
              <section className="rounded-2xl border-2 border-[#234196] bg-white shadow-[4px_4px_0_#234196] overflow-hidden">
                <div className="border-b-2 border-[#234196] bg-[#F0F4FC] p-6 text-center sm:p-7">
                  <div className="relative mx-auto inline-block">
                    {/* Avatar Container 24x24 (96px) */}
                    <div
                      className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#234196] bg-[#E8EDF8] shadow-[2px_2px_0_#234196]"
                      aria-label="User avatar"
                    >
                      {displayedAvatar ? (
                        <img
                          alt={currentDisplayName}
                          className="h-full w-full object-cover"
                          src={displayedAvatar}
                        />
                      ) : (
                        <span className="font-headline text-3xl font-extrabold tracking-wider text-[#234196]">
                          {currentDisplayName !== "—" ? initialsFromName(currentDisplayName) : "?"}
                        </span>
                      )}

                      {/* Uploading indicator overlay */}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#234196]/50 text-white">
                          <span className="material-symbols-outlined animate-spin text-2xl" aria-hidden="true">
                            progress_activity
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Camera action badge button */}
                    <button
                      type="button"
                      onClick={openAvatarPicker}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#234196] bg-[#FCB625] text-[#234196] shadow-[2px_2px_0_#234196] transition-transform hover:scale-110 hover:bg-[#ffc33f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={t("profile.avatarChange")}
                      title={t("profile.avatarChange")}
                    >
                      <span className="material-symbols-outlined text-[19px] leading-none" aria-hidden="true">
                        photo_camera
                      </span>
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

                  <h2 className="mt-4 truncate font-headline text-2xl font-bold text-[#234196]">
                    {currentDisplayName}
                  </h2>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="sticker bg-white text-[9px] text-[#234196]">
                      {profile.role || roleLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#5A6B8F]">
                    {uploadingAvatar ? t("profile.avatarUploading") : t("profile.avatarHint")}
                  </p>
                </div>

                {/* Key-Value Details */}
                <div className="p-6">
                  <h3 className="mb-3 font-headline text-xs font-bold uppercase tracking-wider text-[#5A6B8F]">
                    {t("profile.accountDetails")}
                  </h3>
                  <div className="divide-y divide-[#E8EDF8] rounded-xl border-2 border-[#234196]/20 bg-[#FEF9EE]/50">
                    <div className="flex items-center justify-between gap-4 p-3.5 text-sm">
                      <span className="flex items-center gap-2 font-medium text-[#5A6B8F]">
                        <span className="material-symbols-outlined text-[18px] text-[#234196]" aria-hidden="true">
                          mail
                        </span>
                        {t("profile.field.email")}
                      </span>
                      <span className="text-right font-semibold text-[#234196] break-all">
                        {profile.email || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5 text-sm">
                      <span className="flex items-center gap-2 font-medium text-[#5A6B8F]">
                        <span className="material-symbols-outlined text-[18px] text-[#234196]" aria-hidden="true">
                          badge
                        </span>
                        {t("profile.field.role")}
                      </span>
                      <span className="text-right font-semibold text-[#234196]">
                        {profile.role || roleLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5 text-sm">
                      <span className="flex items-center gap-2 font-medium text-[#5A6B8F]">
                        <span className="material-symbols-outlined text-[18px] text-[#234196]" aria-hidden="true">
                          key
                        </span>
                        {t("profile.field.provider")}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-[#234196] bg-white px-2 py-0.5 text-xs font-bold uppercase text-[#234196]">
                        {profile.provider || "LOCAL"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3.5 text-sm">
                      <span className="flex items-center gap-2 font-medium text-[#5A6B8F]">
                        <span className="material-symbols-outlined text-[18px] text-[#234196]" aria-hidden="true">
                          event
                        </span>
                        {t("profile.field.joined")}
                      </span>
                      <span className="text-right font-semibold text-[#234196]">
                        {formatDate(profile.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cột phải: Form cập nhật thông tin (Edit Profile Card) */}
              <section className="rounded-2xl border-2 border-[#234196] bg-white p-6 sm:p-7 shadow-[4px_4px_0_#234196]">
                <div className="mb-6 border-b-2 border-[#234196]/15 pb-4">
                  <h2 className="font-headline text-2xl font-bold text-[#234196]">
                    {t("profile.editTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-[#5A6B8F]">
                    {t("profile.editHint")}
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                  {/* Họ và tên */}
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#234196]">
                      {t("profile.field.name")}
                    </span>
                    <div className="relative flex items-center">
                      <span
                        className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-[#5A6B8F]"
                        aria-hidden="true"
                      >
                        person
                      </span>
                      <input
                        id="profile-name-input"
                        type="text"
                        className="h-11 w-full rounded-xl border-2 border-[#234196] bg-white pl-11 pr-4 text-sm font-medium text-[#234196] placeholder:text-[#8DA3D2] transition-colors focus:border-[#234196] focus:outline-none focus:ring-2 focus:ring-[#FCB625]"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder={t("profile.field.namePlaceholder")}
                      />
                    </div>
                  </label>

                  {/* Ngày sinh */}
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#234196]">
                      {t("profile.field.dob")}
                    </span>
                    <div className="relative flex items-center">
                      <span
                        className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-[#5A6B8F]"
                        aria-hidden="true"
                      >
                        calendar_month
                      </span>
                      <input
                        id="profile-dob-input"
                        type="date"
                        className="h-11 w-full rounded-xl border-2 border-[#234196] bg-white pl-11 pr-4 text-sm font-medium text-[#234196] transition-colors focus:border-[#234196] focus:outline-none focus:ring-2 focus:ring-[#FCB625]"
                        value={form.dob}
                        onChange={(e) => setField("dob", e.target.value)}
                      />
                    </div>
                  </label>

                  {/* Email (Read-only) */}
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5A6B8F]">
                      {t("profile.field.emailReadonly")}
                    </span>
                    <div className="relative flex items-center">
                      <span
                        className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-[#5A6B8F]"
                        aria-hidden="true"
                      >
                        mail
                      </span>
                      <input
                        id="profile-email-input"
                        type="email"
                        className="h-11 w-full cursor-not-allowed rounded-xl border-2 border-[#234196]/40 bg-[#F0F4FC] pl-11 pr-4 text-sm font-medium text-[#5A6B8F] select-none"
                        value={profile.email || ""}
                        readOnly
                        aria-readonly="true"
                      />
                    </div>
                    <p className="text-[11px] text-[#5A6B8F]">
                      Tài khoản được liên kết với email này và không thể sửa đổi trực tiếp.
                    </p>
                  </label>

                  {/* Form actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t-2 border-[#234196]/10">
                    <button
                      type="submit"
                      disabled={saving || !isDirty}
                      className="chunky-primary min-h-11 px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">
                            progress_activity
                          </span>
                          <span>{t("profile.saving")}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                            save
                          </span>
                          <span>{t("profile.save")}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving || !isDirty}
                      className="chunky-secondary min-h-11 px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                        restart_alt
                      </span>
                      <span>{t("profile.reset")}</span>
                    </button>

                    {isDirty && (
                      <span className="sticker ml-auto bg-[#FCB625] text-[9px] text-[#234196]">
                        Có thay đổi chưa lưu
                      </span>
                    )}
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </main>
    </UserDashboardShell>
  );
}
