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
  }

  async function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    isAvatarPickerOpeningRef.current = false;
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME.has(file.type.toLowerCase())) {
      setErrorMessage("Only jpeg, jpg, png, gif, and webp images are supported.");
      e.target.value = "";
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage("Image is too large. Please choose a file smaller than 5MB.");
      e.target.value = "";
      return;
    }

    try {
      const previewUrl = URL.createObjectURL(file);
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
      setSuccessMessage("Avatar updated successfully.");
    } catch (error) {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
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
    if (form.dob !== (profile.dob || "")) payload.dob = form.dob;

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
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setErrorMessage(readApiError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-surface p-6 pb-28 md:p-12 md:pb-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest text-tertiary">
              {t("profile.eyebrow")}
            </span>
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface md:text-4xl">
              {t("profile.title")}
            </h1>
            <p className="mt-2 text-on-surface-variant">{t("profile.subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageToggleButton />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface transition-transform hover:-translate-y-0.5"
              aria-label={t("interview.select.backDashboard")}
              title={t("interview.select.backDashboard")}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{t("interview.select.backDashboard")}</span>
            </Link>
          </div>
        </header>

        {loading ? (
          <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 text-on-surface-variant">
            Loading profile...
          </section>
        ) : !profile ? (
          <section className="rounded-2xl border border-error/20 bg-error-container/10 p-6 text-error">
            {errorMessage || "Could not load profile."}
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
              <div className="rounded-t-2xl bg-gradient-to-br from-primary to-tertiary p-6 text-white">
                <div className="flex items-center gap-4">
                  <div
                    className="group relative h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-white/15"
                    aria-label="Change avatar"
                    title="Change avatar"
                  >
                    {displayedAvatar ? (
                      <img
                        alt=""
                        className="h-16 w-16 object-cover"
                        src={displayedAvatar}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center font-headline text-xl font-black">
                        {currentDisplayName !== "—" ? initialsFromName(currentDisplayName) : "?"}
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="material-symbols-outlined text-lg text-white">photo_camera</span>
                    </span>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                      onClick={(e) => {
                        isAvatarPickerOpeningRef.current = true;
                        e.currentTarget.value = "";
                      }}
                      onChange={onAvatarFileChange}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
                      {t("profile.identityTitle")}
                    </p>
                    <h2 className="truncate font-headline text-2xl font-bold">{currentDisplayName}</h2>
                    <p className="mt-1 text-xs text-white/80">{roleLabel}</p>
                    <p className="mt-1 text-[11px] text-white/75">
                      {uploadingAvatar ? "Uploading avatar..." : "Click avatar to change photo"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Email</span>
                  <span className="text-right font-semibold text-on-surface">{profile.email || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Role</span>
                  <span className="text-right font-semibold text-on-surface">{profile.role || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Provider</span>
                  <span className="text-right font-semibold text-on-surface">{profile.provider || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-on-surface-variant">Created at</span>
                  <span className="text-right font-semibold text-on-surface">{formatDate(profile.created_at)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="font-headline text-xl font-bold text-on-surface">Edit profile</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Edit basic profile info. Change avatar directly by clicking your photo.
              </p>

              {errorMessage ? (
                <div className="mt-4 rounded-lg border border-error/30 bg-error-container/15 px-3 py-2 text-sm text-error">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {successMessage}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Name</span>
                  <input
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Your full name"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date of birth</span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    value={form.dob}
                    onChange={(e) => setField("dob", e.target.value)}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email (read-only)</span>
                  <input
                    className="w-full cursor-not-allowed rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface-variant"
                    value={profile.email || ""}
                    readOnly
                    aria-readonly="true"
                  />
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </UserDashboardShell>
  );
}
