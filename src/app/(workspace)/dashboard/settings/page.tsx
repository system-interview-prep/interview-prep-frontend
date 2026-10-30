"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import WorkspacePageHeader from "@features/resume/components/WorkspacePageHeader";
import StatusNote from "@components/shared/StatusNote";
import ConfirmDialog from "@components/shared/ConfirmDialog";
import { userApi } from "@lib/apiClient";
import { X, Loader2, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

interface UserSettingsState {
  aiVoice: string;
  speechRate: number;
  autoCameraWebRTC: boolean;
  aiTone: "supportive" | "standard" | "strict";
  notifyWeeklyReminder: boolean;
  notifyJobMatch: boolean;
  notifyProgressReport: boolean;
  notifySoundFx: boolean;
}

const DEFAULT_SETTINGS: UserSettingsState = {
  aiVoice: "vi-north-male",
  speechRate: 1.0,
  autoCameraWebRTC: true,
  aiTone: "standard",
  notifyWeeklyReminder: true,
  notifyJobMatch: true,
  notifyProgressReport: true,
  notifySoundFx: true,
};

const STORAGE_KEY = "interview_prep_settings_v1";

const AI_VOICES = [
  {
    id: "vi-north-male",
    lang: "vi",
    nameKey: "settings.page.voice.viNorthMale.name",
    sampleKey: "settings.page.voice.viNorthMale.sample",
  },
  {
    id: "vi-south-female",
    lang: "vi",
    nameKey: "settings.page.voice.viSouthFemale.name",
    sampleKey: "settings.page.voice.viSouthFemale.sample",
  },
  {
    id: "vi-north-female",
    lang: "vi",
    nameKey: "settings.page.voice.viNorthFemale.name",
    sampleKey: "settings.page.voice.viNorthFemale.sample",
  },
  {
    id: "vi-south-male",
    lang: "vi",
    nameKey: "settings.page.voice.viSouthMale.name",
    sampleKey: "settings.page.voice.viSouthMale.sample",
  },
  {
    id: "en-us-pro",
    lang: "en",
    nameKey: "settings.page.voice.enUsPro.name",
    // Spoken by an English voice, so the sample stays English in every UI language.
    sample: "Welcome! I will be your technical interviewer today. Let us begin with your background.",
  },
  {
    id: "en-us-natural",
    lang: "en",
    nameKey: "settings.page.voice.enUsNatural.name",
    // Spoken by an English voice, so the sample stays English in every UI language.
    sample: "Hi there! I'm excited to help you prepare for your upcoming software engineering interview.",
  },
  {
    id: "en-uk-academic",
    lang: "en",
    nameKey: "settings.page.voice.enUkAcademic.name",
    // Spoken by an English voice, so the sample stays English in every UI language.
    sample: "Good day. We shall proceed through structured behavioral and domain-specific questions.",
  },
];

/** Browser and OS ("Chrome", "Windows") from the user agent; null when it can't be told. No IP or location is known. */
function describeThisDevice(ua: string): { browser: string | null; os: string | null } | null {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : null;
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  if (!browser && !os) return null;
  return { browser, os };
}

export default function SettingsPage() {
  const { profile } = useAuthProfile();
  const { t } = useLanguage();
  // Sign-in method comes from the server profile; until it loads, say so.
  const [provider, setProvider] = useState<string | null | undefined>(undefined);
  const [thisDeviceParts, setThisDevice] = useState<{ browser: string | null; os: string | null } | null>(null);
  const thisDevice = thisDeviceParts
    ? thisDeviceParts.browser && thisDeviceParts.os
      ? fmt(t("settings.page.device.browserOnOs"), { browser: thisDeviceParts.browser, os: thisDeviceParts.os })
      : (thisDeviceParts.browser ?? thisDeviceParts.os)
    : null;
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let alive = true;
    userApi
      .getProfile()
      .then(({ data }) => {
        if (alive) setProvider((data.provider || "LOCAL").toUpperCase());
      })
      .catch(() => {
        if (alive) setProvider(null);
      });
    setThisDevice(describeThisDevice(navigator.userAgent));
    return () => {
      alive = false;
    };
  }, []);

  // Settings State
  const [settings, setSettings] = useState<UserSettingsState>(DEFAULT_SETTINGS);
  const [, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // Active Tab Filter
  const [activeTab, setActiveTab] = useState<"all" | "ai" | "notifications" | "security" | "danger">("all");

  // Voice Preview State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Modal: Change Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const isUpdatingPassword = false;

  // Modal: Delete Account
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const isDeletingAccount = false;

  // Unique IDs for accessibility
  const voiceSelectId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const deleteConfirmId = useId();

  // Load initial settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Show toast helper
  const showToast = useCallback((text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Save settings handler
  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      // Preferences live in this browser only; the interview rooms do not
      // read them yet, so say exactly that instead of claiming a saved profile.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast(t("settings.page.toast.savedLocal"), "info");
    } catch {
      showToast(t("settings.page.toast.saveFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  }, [settings, showToast, t]);

  // Reset to default settings
  const handleResetDefaults = useCallback(() => {
    setResetConfirmOpen(false);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      showToast(t("settings.page.toast.resetDone"), "info");
    } catch {
      showToast(t("settings.page.toast.saveFailed"), "error");
    }
  }, [showToast, t]);

  // Voice Preview synthesis
  const handlePreviewVoice = useCallback(() => {
    const selectedVoiceObj = AI_VOICES.find((v) => v.id === settings.aiVoice) || AI_VOICES[0];

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sampleText = selectedVoiceObj.sampleKey ? t(selectedVoiceObj.sampleKey) : (selectedVoiceObj.sample ?? "");
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.rate = settings.speechRate;
      utterance.lang = selectedVoiceObj.lang === "vi" ? "vi-VN" : "en-US";

      utterance.onstart = () => setIsPlayingVoice(true);
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingVoice(true);
      setTimeout(() => setIsPlayingVoice(false), 2200);
      const sampleText = selectedVoiceObj.sampleKey ? t(selectedVoiceObj.sampleKey) : (selectedVoiceObj.sample ?? "");
      showToast(fmt(t("settings.page.toast.voiceSample"), { sample: sampleText }), "info");
    }
  }, [settings.aiVoice, settings.speechRate, showToast, t]);

  // Export User Data
  const handleExportData = useCallback(() => {
    try {
      const exportObject = {
        exportTimestamp: new Date().toISOString(),
        user: {
          name: profile?.name || t("settings.page.export.defaultName"),
          email: profile?.email || t("settings.page.common.unknown"),
          picture: profile?.picture || null,
        },
        settings: settings,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `intervia_settings_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(t("settings.page.toast.exportDone"), "info");
    } catch {
      showToast(t("settings.page.toast.exportFailed"), "error");
    }
  }, [profile, settings, showToast, t]);

  // Submit Change Password
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError(t("settings.page.password.errorCurrentRequired"));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t("settings.page.password.errorMinLength"));
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(t("settings.page.password.errorSameAsOld"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.page.password.errorMismatch"));
      return;
    }

    // No password-change endpoint exists yet: never report a change that did not happen.
    setPasswordError(t("settings.page.password.errorUnsupported"));
  };

  // Submit Delete Account
  const handleDeleteAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    const targetValue = (profile?.email || "delete").toLowerCase().trim();
    if (deleteConfirmationInput.toLowerCase().trim() !== targetValue) {
      setDeleteError(fmt(t("settings.page.delete.errorMismatch"), { target: profile?.email || "DELETE" }));
      return;
    }

    // No account-deletion endpoint exists yet: clearing the browser would only
    // pretend the account and its data were removed.
    setIsDeleteModalOpen(false);
    showToast(t("settings.page.toast.deleteUnsupported"), "error");
  };

  // Password strength meter
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return Math.min(score, 4);
  }, [newPassword]);

  return (
    <UserDashboardShell>
      {/* Toast Notification */}
      {toastMessage && (
        <aside
          aria-atomic="true"
          className="fixed left-4 right-4 top-20 z-50 rounded-2xl bg-white p-3 border border-[#DCE4F3] shadow-[0_18px_40px_-24px_rgba(20,36,75,0.45)] animate-in fade-in slide-in-from-top-3 sm:left-auto sm:w-[26rem] md:right-8"
        >
          <StatusNote
            text={toastMessage.text}
            tone={toastMessage.type}
            onDismiss={() => setToastMessage(null)}
            dismissLabel={t("settings.page.toast.dismiss")}
          />
        </aside>
      )}

      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-16 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1280px] space-y-6">
          {/* HERO: the fox introduces settings and hands over save / reset */}
          <WorkspacePageHeader
            title={t("settings.page.header.title")}
            subtitle={t("settings.page.header.subtitle")}
          >
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:opacity-60"
              aria-label={t("settings.page.header.saveAria")}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                  {t("settings.page.header.saving")}
                </>
              ) : (
                t("settings.page.header.save")
              )}
            </button>

            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex h-10 items-center rounded-xl bg-[#F8FAFC] px-5 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#F0F4FC]"
              aria-label={t("settings.page.header.resetAria")}
            >
              {t("settings.page.header.reset")}
            </button>
          </WorkspacePageHeader>

          {/* QUICK NAV / FILTER TABS (text only) */}
          <nav aria-label={t("settings.page.tabs.aria")} className="flex flex-wrap gap-2">
            {[
              { id: "all", label: t("settings.page.tabs.all") },
              { id: "ai", label: t("settings.page.tabs.ai") },
              { id: "notifications", label: t("settings.page.tabs.notifications") },
              { id: "security", label: t("settings.page.tabs.security") },
              { id: "danger", label: t("settings.page.tabs.danger") },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  aria-pressed={isSelected}
                  className={`inline-flex h-9 items-center rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-[#204195] text-white"
                      : "bg-white text-[#607096] border border-[#DCE4F3] hover:bg-[#F0F4FC] hover:text-[#14244B]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* MAIN SETTINGS GRID */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
            {/* CARD 1: CẤU HÌNH PHỎNG VẤN & AI */}
            {(activeTab === "all" || activeTab === "ai") && (
              <section
                aria-labelledby="heading-ai-settings"
                className="flex min-w-0 flex-col justify-between rounded-2xl bg-white p-5 border border-[#DCE4F3] sm:p-6"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="border-b border-[#EAEFF8] pb-4">
                    <h2 id="heading-ai-settings" className="text-lg font-bold text-[#14244B]">
                      {t("settings.page.ai.title")}
                    </h2>
                    <p className="mt-1 text-sm text-[#607096]">{t("settings.page.ai.subtitle")}</p>
                  </div>

                  {/* Field 1: Giọng đọc AI */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={voiceSelectId} className="text-sm font-semibold text-[#14244B]">
                        {t("settings.page.ai.voiceLabel")}
                      </label>
                      <button
                        type="button"
                        onClick={handlePreviewVoice}
                        className="inline-flex h-9 items-center rounded-xl bg-[#F8FAFC] px-3.5 text-sm font-semibold text-[#204195] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
                        aria-label={t("settings.page.ai.previewAria")}
                      >
                        {isPlayingVoice ? t("settings.page.ai.playing") : t("settings.page.ai.preview")}
                      </button>
                    </div>

                    <div className="relative">
                      <select
                        id={voiceSelectId}
                        value={settings.aiVoice}
                        onChange={(e) => setSettings({ ...settings, aiVoice: e.target.value })}
                        className="w-full appearance-none rounded-xl border-0 bg-[#F8FAFC] px-4 py-2.5 pr-10 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                      >
                        {AI_VOICES.map((v) => (
                          <option key={v.id} value={v.id}>
                            {t(v.nameKey)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Field 2: Tốc độ phản hồi */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#14244B]">
                        {t("settings.page.ai.rateLabel")}
                      </span>
                      <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#204195]">
                        {settings.speechRate.toFixed(1)}x
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { rate: 0.8, label: t("settings.page.ai.rate.slow"), sub: t("settings.page.ai.rate.slowSub") },
                        { rate: 1.0, label: t("settings.page.ai.rate.normal"), sub: t("settings.page.ai.rate.normalSub") },
                        { rate: 1.2, label: t("settings.page.ai.rate.fast"), sub: t("settings.page.ai.rate.fastSub") },
                      ].map((item) => {
                        const isSelected = settings.speechRate === item.rate;
                        return (
                          <button
                            key={item.rate}
                            type="button"
                            onClick={() => setSettings({ ...settings, speechRate: item.rate })}
                            aria-pressed={isSelected}
                            className={`flex min-w-0 flex-col items-center justify-center rounded-2xl p-2.5 text-center transition-colors ${
                              isSelected
                                ? "bg-[#F0F4FC] text-[#14244B] ring-2 ring-[#204195] font-semibold"
                                : "bg-[#F8FAFC] text-[#607096] border border-[#DCE4F3] hover:bg-[#F0F4FC]"
                            }`}
                          >
                            <span className="text-xs font-semibold sm:text-sm">{item.label}</span>
                            <span className="text-xs opacity-80">{item.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 4: Chế độ Camera WebRTC */}
                  <div className="rounded-2xl bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-[#14244B]">
                            {t("settings.page.ai.cameraTitle")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.ai.cameraDesc")}
                        </p>
                      </div>

                      {/* SaaS Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.autoCameraWebRTC}
                        aria-label={t("settings.page.ai.cameraAria")}
                        onClick={() =>
                          setSettings({ ...settings, autoCameraWebRTC: !settings.autoCameraWebRTC })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] focus-visible:ring-offset-2 ${
                          settings.autoCameraWebRTC ? "bg-[#204195]" : "bg-[#C9D7F1]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            settings.autoCameraWebRTC ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#EAEFF8] pt-4 sm:text-right">
                  <span className="text-xs font-medium text-[#607096]">
                    {t("settings.page.ai.footer")}
                  </span>
                </div>
              </section>
            )}

            {/* CARD 2: THÔNG BÁO & EMAIL */}
            {(activeTab === "all" || activeTab === "notifications") && (
              <section
                aria-labelledby="heading-notifications"
                className="flex min-w-0 flex-col justify-between rounded-2xl bg-white p-5 border border-[#DCE4F3] sm:p-6"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="border-b border-[#EAEFF8] pb-4">
                    <h2 id="heading-notifications" className="text-lg font-bold text-[#14244B]">
                      {t("settings.page.notify.title")}
                    </h2>
                    <p className="mt-1 text-sm text-[#607096]">{t("settings.page.notify.subtitle")}</p>
                    <p className="mt-2 inline-flex rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-semibold text-[#8A5A00]">
                      {t("settings.page.notify.inactive")}
                    </p>
                  </div>

                  {/* List of Notification Toggles */}
                  <div className="space-y-3">
                    {/* Toggle 1: Lịch nhắc luyện tập */}
                    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#F8FAFC] p-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-[#14244B]">
                            {t("settings.page.notify.weekly.title")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.notify.weekly.desc")}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled
                        aria-checked={settings.notifyWeeklyReminder}
                        aria-label={t("settings.page.notify.weekly.aria")}
                        onClick={() =>
                          setSettings({ ...settings, notifyWeeklyReminder: !settings.notifyWeeklyReminder })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          settings.notifyWeeklyReminder ? "bg-[#204195]" : "bg-[#C9D7F1]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            settings.notifyWeeklyReminder ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 2: Gợi ý việc làm mới */}
                    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#F8FAFC] p-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-[#14244B]">
                            {t("settings.page.notify.jobMatch.title")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.notify.jobMatch.desc")}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled
                        aria-checked={settings.notifyJobMatch}
                        aria-label={t("settings.page.notify.jobMatch.aria")}
                        onClick={() =>
                          setSettings({ ...settings, notifyJobMatch: !settings.notifyJobMatch })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          settings.notifyJobMatch ? "bg-[#204195]" : "bg-[#C9D7F1]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            settings.notifyJobMatch ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 3: Báo cáo phân tích kỹ năng & tiến độ */}
                    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#F8FAFC] p-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-[#14244B]">
                            {t("settings.page.notify.progress.title")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.notify.progress.desc")}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled
                        aria-checked={settings.notifyProgressReport}
                        aria-label={t("settings.page.notify.progress.aria")}
                        onClick={() =>
                          setSettings({ ...settings, notifyProgressReport: !settings.notifyProgressReport })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          settings.notifyProgressReport ? "bg-[#204195]" : "bg-[#C9D7F1]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            settings.notifyProgressReport ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 4: Âm thanh thông báo tương tác */}
                    <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#F8FAFC] p-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-[#14244B]">
                            {t("settings.page.notify.soundFx.title")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.notify.soundFx.desc")}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        disabled
                        aria-checked={settings.notifySoundFx}
                        aria-label={t("settings.page.notify.soundFx.aria")}
                        onClick={() =>
                          setSettings({ ...settings, notifySoundFx: !settings.notifySoundFx })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          settings.notifySoundFx ? "bg-[#204195]" : "bg-[#C9D7F1]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            settings.notifySoundFx ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#EAEFF8] pt-4 sm:text-right">
                  <p className="min-w-0 text-xs text-[#607096] [overflow-wrap:anywhere]">
                    {t("settings.page.notify.footer")}{" "}
                    <strong className="text-[#14244B]">{profile?.email || t("settings.page.common.unknown")}</strong>
                  </p>
                </div>
              </section>
            )}

            {/* CARD 3: BẢO MẬT & XÁC THỰC */}
            {(activeTab === "all" || activeTab === "security") && (
              <section
                aria-labelledby="heading-security"
                className="flex min-w-0 flex-col justify-between rounded-2xl bg-white p-5 border border-[#DCE4F3] sm:p-6"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="border-b border-[#EAEFF8] pb-4">
                    <h2 id="heading-security" className="text-lg font-bold text-[#14244B]">
                      {t("settings.page.security.title")}
                    </h2>
                    <p className="mt-1 text-sm text-[#607096]">{t("settings.page.security.subtitle")}</p>
                  </div>

                  {/* Section: Linked Accounts */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#14244B]">
                      {t("settings.page.security.signInMethod")}
                    </p>

                    <div className="rounded-2xl bg-[#F8FAFC] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#14244B]">
                            {provider === undefined
                              ? t("settings.page.security.checking")
                              : provider === null
                                ? t("settings.page.security.loadFailed")
                                : provider === "GOOGLE"
                                  ? t("settings.page.security.google")
                                  : provider === "LOCAL"
                                    ? t("settings.page.security.local")
                                    : provider}
                          </p>
                          <p className="break-all text-xs text-[#607096]">{profile?.email || t("settings.page.security.notSynced")}</p>
                        </div>
                        {provider === "GOOGLE" ? (
                          <span className="shrink-0 rounded-full bg-[#EAF5EE] px-2.5 py-0.5 text-xs font-semibold text-[#287A4B]">
                            {t("settings.page.security.googleLinked")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Section: Password Action */}
                  <div className="rounded-2xl bg-[#F8FAFC] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#14244B]">
                          {t("settings.page.security.passwordTitle")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.security.passwordDesc")}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled
                        title={t("settings.page.security.changePasswordTitle")}
                        className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] opacity-60"
                        aria-label={t("settings.page.security.changePasswordAria")}
                      >
                        {t("settings.page.security.changePassword")}
                      </button>
                    </div>
                  </div>

                  {/* Section: Active Sessions */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#14244B]">
                      {t("settings.page.security.currentSession")}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F8FAFC] p-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#14244B]">
                          {thisDevice ? fmt(t("settings.page.security.thisDeviceNamed"), { device: thisDevice }) : t("settings.page.security.thisDevice")}
                        </p>
                        <p className="text-xs text-[#607096]">{t("settings.page.security.readFromBrowser")}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#EAF5EE] px-2.5 py-0.5 text-xs font-semibold text-[#287A4B]">
                        {t("settings.page.security.active")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#EAEFF8] pt-4 sm:text-right">
                  <button
                    type="button"
                    disabled
                    title={t("settings.page.security.signOutOthersTitle")}
                    className="cursor-not-allowed text-sm font-semibold text-[#C43B3B] opacity-60"
                  >
                    {t("settings.page.security.signOutOthers")}
                  </button>
                </div>
              </section>
            )}

            {/* CARD 4: QUẢN LÝ DỮ LIỆU & VÙNG NGUY HIỂM */}
            {(activeTab === "all" || activeTab === "danger") && (
              <section
                aria-labelledby="heading-danger"
                className="flex min-w-0 flex-col justify-between rounded-2xl bg-white p-5 ring-1 ring-[#F5C2C2] sm:p-6"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="border-b border-[#F5C2C2] pb-4">
                    <h2 id="heading-danger" className="text-lg font-bold text-[#C43B3B]">
                      {t("settings.page.danger.title")}
                    </h2>
                    <p className="mt-1 text-sm text-[#607096]">{t("settings.page.danger.subtitle")}</p>
                  </div>

                  {/* Section: Export Data */}
                  <div className="rounded-2xl bg-[#F8FAFC] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-[#14244B]">
                          {t("settings.page.danger.exportTitle")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.danger.exportDesc")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportData}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
                      >
                        {t("settings.page.danger.exportButton")}
                      </button>
                    </div>
                  </div>

                  {/* Section: Delete Account Warning */}
                  <div className="rounded-2xl bg-[#FDF2F2] p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-[#C43B3B]">
                          {t("settings.page.danger.deleteTitle")}
                        </p>
                        <p className="text-xs text-[#607096]">
                          {t("settings.page.danger.deleteDesc")}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled
                        className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#C43B3B] ring-1 ring-[#F5C2C2] opacity-60"
                        aria-label={t("settings.page.danger.deleteAria")}
                      >
                        {t("settings.page.danger.deleteButton")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#F5C2C2] pt-4 sm:text-right">
                  <span className="text-xs font-medium text-[#607096]">
                    {t("settings.page.danger.footer")}
                  </span>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={resetConfirmOpen}
        title={t("settings.page.reset.title")}
        body={t("settings.page.reset.body")}
        confirmLabel={t("settings.page.reset.confirm")}
        cancelLabel={t("settings.page.reset.cancel")}
        onConfirm={handleResetDefaults}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {/* MODAL: ĐỔI MẬT KHẨU */}
      {isPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/40 p-4"
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 border border-[#DCE4F3] shadow-[0_24px_60px_-30px_rgba(20,36,75,0.45)] sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-[#EAEFF8] pb-4">
              <h3 id="password-modal-title" className="text-xl font-semibold text-[#14244B]">
                {t("settings.page.password.title")}
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-full p-1.5 text-[#607096] transition-colors hover:bg-[#F0F4FC]"
                aria-label={t("settings.page.modal.closeAria")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="mt-5 space-y-4">
              {passwordError && <StatusNote text={passwordError} tone="error" />}

              {/* Mật khẩu cũ */}
              <div className="space-y-1.5">
                <label htmlFor={currentPasswordId} className="block text-sm font-semibold text-[#14244B]">
                  {t("settings.page.password.current")}
                </label>
                <input
                  id={currentPasswordId}
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                />
              </div>

              {/* Mật khẩu mới */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={newPasswordId} className="block text-sm font-semibold text-[#14244B]">
                    {t("settings.page.password.new")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-semibold text-[#204195] underline-offset-4 hover:underline"
                  >
                    {showPassword ? t("settings.page.password.hide") : t("settings.page.password.show")}
                  </button>
                </div>
                <input
                  id={newPasswordId}
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("settings.page.password.newPlaceholder")}
                  required
                  className="w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                />

                {/* Password strength bar */}
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex h-1.5 w-full gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full ${
                            passwordStrength >= step
                              ? passwordStrength <= 2
                                ? "bg-[#FCB625]"
                                : "bg-[#287A4B]"
                              : "bg-[#DCE4F3]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-[#607096]">
                      {fmt(t("settings.page.password.strength"), {
                        level: passwordStrength <= 2 ? t("settings.page.password.strengthMedium") : t("settings.page.password.strengthStrong"),
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="space-y-1.5">
                <label htmlFor={confirmPasswordId} className="block text-sm font-semibold text-[#14244B]">
                  {t("settings.page.password.confirm")}
                </label>
                <input
                  id={confirmPasswordId}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("settings.page.password.confirmPlaceholder")}
                  required
                  className="w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 flex flex-wrap justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F8FAFC] px-5 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
                >
                  {t("settings.page.modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:opacity-60"
                >
                  {isUpdatingPassword ? t("settings.page.password.updating") : t("settings.page.password.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÓA TÀI KHOẢN */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/40 p-4"
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 ring-1 ring-[#F5C2C2] shadow-[0_24px_60px_-30px_rgba(20,36,75,0.45)] sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-[#F5C2C2] pb-4">
              <h3 id="delete-modal-title" className="text-xl font-semibold text-[#C43B3B]">
                {t("settings.page.delete.title")}
              </h3>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-full p-1.5 text-[#607096] transition-colors hover:bg-[#FDF2F2]"
                aria-label={t("settings.page.modal.closeAria")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleDeleteAccountSubmit} className="mt-5 space-y-4">
              {deleteError && <StatusNote text={deleteError} tone="error" />}
              <div className="rounded-2xl bg-[#FDF2F2] p-4 text-sm text-[#C43B3B]">
                <p className="font-bold">{t("settings.page.delete.warningTitle")}</p>
                <p className="mt-1">
                  {t("settings.page.delete.warningBody")}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor={deleteConfirmId} className="block text-sm font-medium text-[#14244B]">
                  {t("settings.page.delete.confirmLabelBefore")}<span className="break-all font-mono font-bold text-[#C43B3B]">{profile?.email || "DELETE"}</span>{t("settings.page.delete.confirmLabelAfter")}
                </label>
                <input
                  id={deleteConfirmId}
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={profile?.email || "DELETE"}
                  required
                  className="w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-medium text-[#C43B3B] ring-1 ring-[#F5C2C2] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C43B3B]"
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F8FAFC] px-5 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
                >
                  {t("settings.page.modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeletingAccount ||
                    deleteConfirmationInput.toLowerCase().trim() !== (profile?.email || "delete").toLowerCase().trim()
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#C43B3B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#A93232] disabled:opacity-40"
                >
                  {isDeletingAccount ? t("settings.page.delete.deleting") : t("settings.page.delete.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserDashboardShell>
  );
}
