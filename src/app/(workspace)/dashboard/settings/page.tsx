"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import {
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Settings,
  RotateCcw,
  Loader2,
  Save,
  Sliders,
  Brain,
  Bell,
  Shield,
  AlertTriangle,
  Volume2,
  Play,
  ChevronDown,
  Video,
  BadgeCheck,
  BellRing,
  Calendar,
  Briefcase,
  TrendingUp,
  Key,
  Laptop,
  Download,
  FileDown,
  Trash2,
  Lock,
} from "lucide-react";

interface UserSettingsState {
  aiVoice: string;
  speechRate: number;
  interviewLanguage: "vi" | "en";
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
  interviewLanguage: "vi",
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
    name: "Nam - Miền Bắc (Trầm ấm, Chuyên nghiệp)",
    sample: "Xin chào bạn! Tôi là trợ lý phỏng vấn AI. Chúng ta hãy cùng bắt đầu buổi phỏng vấn hôm nay nhé.",
  },
  {
    id: "vi-south-female",
    lang: "vi",
    name: "Nữ - Miền Nam (Tự nhiên, Truyền cảm)",
    sample: "Chào bạn nhé! Tôi rất vui được đồng hành cùng bạn trong buổi luyện tập phỏng vấn này.",
  },
  {
    id: "vi-north-female",
    lang: "vi",
    name: "Nữ - Miền Bắc (Thanh lịch, Rõ ràng)",
    sample: "Chào bạn! Tôi sẽ đặt các câu hỏi phỏng vấn kỹ thuật và tình huống cho vị trí của bạn.",
  },
  {
    id: "vi-south-male",
    lang: "vi",
    name: "Nam - Miền Nam (Năng động, Hiện đại)",
    sample: "Alo bạn đã sẵn sàng chưa? Mình cùng khởi động với câu hỏi đầu tiên nha!",
  },
  {
    id: "en-us-pro",
    lang: "en",
    name: "English - US Professional (Male)",
    sample: "Welcome! I will be your technical interviewer today. Let us begin with your background.",
  },
  {
    id: "en-us-natural",
    lang: "en",
    name: "English - US Natural (Female)",
    sample: "Hi there! I'm excited to help you prepare for your upcoming software engineering interview.",
  },
  {
    id: "en-uk-academic",
    lang: "en",
    name: "English - UK Academic (Neutral)",
    sample: "Good day. We shall proceed through structured behavioral and domain-specific questions.",
  },
];

export default function SettingsPage() {
  const { profile } = useAuthProfile();

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
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Modal: Delete Account
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Unique IDs for accessibility
  const voiceSelectId = useId();
  const languageViId = useId();
  const languageEnId = useId();
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
      // Simulate network persistence / save to localStorage
      await new Promise((res) => setTimeout(res, 500));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast("Đã lưu tất cả cài đặt thành công! 🎉", "success");
    } catch {
      showToast("Lỗi khi lưu cài đặt. Vui lòng thử lại!", "error");
    } finally {
      setIsSaving(false);
    }
  }, [settings, showToast]);

  // Reset to default settings
  const handleResetDefaults = useCallback(() => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục toàn bộ cài đặt về trạng thái mặc định ban đầu?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      showToast("Đã khôi phục cài đặt mặc định!", "info");
    }
  }, [showToast]);

  // Voice Preview synthesis
  const handlePreviewVoice = useCallback(() => {
    const selectedVoiceObj = AI_VOICES.find((v) => v.id === settings.aiVoice) || AI_VOICES[0];

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(selectedVoiceObj.sample);
      utterance.rate = settings.speechRate;
      utterance.lang = selectedVoiceObj.lang === "vi" ? "vi-VN" : "en-US";

      utterance.onstart = () => setIsPlayingVoice(true);
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingVoice(true);
      setTimeout(() => setIsPlayingVoice(false), 2200);
      showToast(`Mẫu giọng: "${selectedVoiceObj.sample}"`, "info");
    }
  }, [settings.aiVoice, settings.speechRate, showToast]);

  // Export User Data
  const handleExportData = useCallback(() => {
    try {
      const exportObject = {
        exportTimestamp: new Date().toISOString(),
        user: {
          name: profile?.name || "Người dùng",
          email: profile?.email || "Chưa xác định",
          picture: profile?.picture || null,
        },
        settings: settings,
        interviewHistory: (() => {
          try {
            return JSON.parse(localStorage.getItem("demo.sessions") || "[]");
          } catch {
            return [];
          }
        })(),
        cvDocuments: (() => {
          try {
            return JSON.parse(localStorage.getItem("demo.cvFiles") || "[]");
          } catch {
            return [];
          }
        })(),
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `interview_prep_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast("Đã tải về tệp dữ liệu sao lưu thành công (.json)!", "success");
    } catch {
      showToast("Không thể xuất dữ liệu. Vui lòng thử lại!", "error");
    }
  }, [profile, settings, showToast]);

  // Submit Change Password
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Mật khẩu mới không được trùng với mật khẩu cũ.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Đổi mật khẩu thành công! Hãy dùng mật khẩu mới trong lần đăng nhập tiếp theo.", "success");
    }, 800);
  };

  // Submit Delete Account
  const handleDeleteAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetValue = (profile?.email || "delete").toLowerCase().trim();
    if (deleteConfirmationInput.toLowerCase().trim() !== targetValue) {
      alert(`Vui lòng nhập chính xác "${profile?.email || "DELETE"}" để xác nhận xóa.`);
      return;
    }

    setIsDeletingAccount(true);
    setTimeout(() => {
      localStorage.clear();
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
      window.location.href = "/";
    }, 1200);
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
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed right-4 top-20 z-50 flex items-center gap-3 rounded-xl border border-[#DCE4F3] bg-white px-5 py-3.5 font-medium text-[#14244B] shadow-lg transition-all animate-in fade-in slide-in-from-top-3 md:right-8"
        >
          {toastMessage.type === "error" ? (
            <AlertCircle className="size-5 shrink-0 text-red-600" />
          ) : toastMessage.type === "info" ? (
            <Info className="size-5 shrink-0 text-[#204195]" />
          ) : (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 rounded-lg p-1 text-[#607096] hover:bg-[#F8FAFC]"
            aria-label="Đóng thông báo"
          >
            <X className="size-4" />
          </button>
        </aside>
      )}

      <div className="min-h-full bg-[#F8FAFC] p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* HEADER SECTION */}
          <header className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3 py-1 text-xs font-semibold text-[#204195]">
                  <Settings className="size-3.5 leading-none shrink-0" />
                  HỆ THỐNG &amp; TÀI KHOẢN
                </div>

                {/* H1 Title */}
                <h1 className="text-2xl font-bold tracking-tight text-[#14244B] sm:text-3xl">
                  Cài đặt &amp; Tùy chọn
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-[#607096]">
                  Quản lý hành vi người phỏng vấn AI, tần suất thông báo, tăng cường bảo mật phiên đăng nhập và bảo lưu dữ liệu cá nhân.
                </p>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-4 py-2.5 text-xs font-semibold text-[#607096] transition-colors hover:bg-[#F8FAFC] hover:text-[#14244B] sm:text-sm"
                  aria-label="Khôi phục cài đặt gốc"
                >
                  <RotateCcw className="size-4 shrink-0" />
                  Mặc định
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#183275] disabled:opacity-60 sm:text-sm"
                  aria-label="Lưu tất cả thay đổi cài đặt"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="size-4 shrink-0" />
                      Lưu cài đặt
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QUICK NAV / FILTER TABS */}
            <nav aria-label="Bộ lọc cài đặt" className="mt-8 flex flex-wrap gap-2 border-t border-[#EAEFF8] pt-5">
              {[
                { id: "all", label: "Tất cả mục", icon: Sliders },
                { id: "ai", label: "Cấu hình AI & Giọng nói", icon: Brain },
                { id: "notifications", label: "Thông báo & Email", icon: Bell },
                { id: "security", label: "Bảo mật & Phiên", icon: Shield },
                { id: "danger", label: "Vùng nguy hiểm & Dữ liệu", icon: AlertTriangle },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                      isSelected
                        ? "bg-[#204195] text-white shadow-xs"
                        : "text-[#607096] hover:bg-[#F0F4FC] hover:text-[#204195]"
                    }`}
                  >
                    <IconComp className="size-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </header>

          {/* MAIN SETTINGS GRID */}
          <main className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* CARD 1: CẤU HÌNH PHỎNG VẤN & AI */}
            {(activeTab === "all" || activeTab === "ai") && (
              <section
                aria-labelledby="heading-ai-settings"
                className="flex flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-7"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-[#EAEFF8] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4FC] text-[#204195]">
                        <Brain className="size-5 shrink-0" />
                      </div>
                      <div>
                        <h2 id="heading-ai-settings" className="text-lg font-bold text-[#14244B]">
                          Cấu hình Phỏng vấn &amp; AI
                        </h2>
                        <p className="text-xs text-[#607096]">Giọng đọc, tốc độ và giao thức kết nối phòng WebRTC</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-2.5 py-0.5 text-[10px] font-semibold text-[#204195]">
                      AI PREFERENCES
                    </span>
                  </div>

                  {/* Field 1: Giọng đọc AI */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={voiceSelectId} className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                        Giọng đọc AI mặc định:
                      </label>
                      <button
                        type="button"
                        onClick={handlePreviewVoice}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DCE4F3] bg-white px-2.5 py-1 text-xs font-semibold text-[#204195] transition-colors hover:bg-[#F0F4FC]"
                        aria-label="Nghe thử giọng đọc AI hiện tại"
                      >
                        {isPlayingVoice ? (
                          <Volume2 className="size-3.5 shrink-0" />
                        ) : (
                          <Play className="size-3.5 shrink-0" />
                        )}
                        {isPlayingVoice ? "Đang phát..." : "Nghe thử"}
                      </button>
                    </div>

                    <div className="relative">
                      <select
                        id={voiceSelectId}
                        value={settings.aiVoice}
                        onChange={(e) => setSettings({ ...settings, aiVoice: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-[#DCE4F3] bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[#14244B] transition-colors focus:border-[#204195] focus:outline-none focus:ring-1 focus:ring-[#204195]"
                      >
                        {AI_VOICES.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" />
                    </div>
                  </div>

                  {/* Field 2: Tốc độ phản hồi */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                        Tốc độ phản hồi giọng nói:
                      </span>
                      <span className="rounded-md border border-[#C9D7F1] bg-[#F0F4FC] px-2 py-0.5 font-mono text-xs font-semibold text-[#204195]">
                        {settings.speechRate.toFixed(1)}x
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { rate: 0.8, label: "Chậm (0.8x)", sub: "Luyện nghe" },
                        { rate: 1.0, label: "Chuẩn (1.0x)", sub: "Tự nhiên" },
                        { rate: 1.2, label: "Nhanh (1.2x)", sub: "Áp lực cao" },
                      ].map((item) => {
                        const isSelected = settings.speechRate === item.rate;
                        return (
                          <button
                            key={item.rate}
                            type="button"
                            onClick={() => setSettings({ ...settings, speechRate: item.rate })}
                            aria-pressed={isSelected}
                            className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all text-center ${
                              isSelected
                                ? "border-[#204195] bg-[#F0F4FC] text-[#204195] ring-1 ring-[#204195] font-semibold"
                                : "border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <span className="text-xs font-semibold sm:text-sm">{item.label}</span>
                            <span className="text-[10px] opacity-75">{item.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 3: Ngôn ngữ phỏng vấn ưu tiên */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                      Ngôn ngữ phỏng vấn ưu tiên:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        htmlFor={languageViId}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                          settings.interviewLanguage === "vi"
                            ? "border-[#204195] bg-[#F0F4FC] font-semibold text-[#204195] ring-1 ring-[#204195]"
                            : "border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40"
                        }`}
                      >
                        <input
                          id={languageViId}
                          type="radio"
                          name="interviewLanguage"
                          value="vi"
                          checked={settings.interviewLanguage === "vi"}
                          onChange={() => setSettings({ ...settings, interviewLanguage: "vi" })}
                          className="h-4 w-4 accent-[#204195]"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-[#14244B]">Tiếng Việt</p>
                          <p className="text-[10px] text-[#607096]">Doanh nghiệp nội địa</p>
                        </div>
                      </label>

                      <label
                        htmlFor={languageEnId}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                          settings.interviewLanguage === "en"
                            ? "border-[#204195] bg-[#F0F4FC] font-semibold text-[#204195] ring-1 ring-[#204195]"
                            : "border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40"
                        }`}
                      >
                        <input
                          id={languageEnId}
                          type="radio"
                          name="interviewLanguage"
                          value="en"
                          checked={settings.interviewLanguage === "en"}
                          onChange={() => setSettings({ ...settings, interviewLanguage: "en" })}
                          className="h-4 w-4 accent-[#204195]"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-[#14244B]">English</p>
                          <p className="text-[10px] text-[#607096]">Global / Multi-national</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Field 4: Chế độ Camera WebRTC */}
                  <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Video className="size-4 text-[#204195]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                            Tự động bật Camera khi vào phòng WebRTC
                          </span>
                        </div>
                        <p className="text-xs text-[#607096]">
                          Phân tích ánh mắt, biểu cảm khuôn mặt để nâng cao điểm đánh giá tự tin.
                        </p>
                      </div>

                      {/* SaaS Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.autoCameraWebRTC}
                        aria-label="Tự động bật Camera phòng phỏng vấn"
                        onClick={() =>
                          setSettings({ ...settings, autoCameraWebRTC: !settings.autoCameraWebRTC })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.autoCameraWebRTC ? "bg-[#204195]" : "bg-gray-300"
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

                <div className="mt-6 border-t border-[#EAEFF8] pt-4 text-right">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#607096]">
                    <BadgeCheck className="size-4 text-emerald-600" />
                    Tự động đồng bộ với phòng phỏng vấn Mock Interview
                  </span>
                </div>
              </section>
            )}

            {/* CARD 2: THÔNG BÁO & EMAIL */}
            {(activeTab === "all" || activeTab === "notifications") && (
              <section
                aria-labelledby="heading-notifications"
                className="flex flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-7"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-[#EAEFF8] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4FC] text-[#204195]">
                        <BellRing className="size-5 shrink-0" />
                      </div>
                      <div>
                        <h2 id="heading-notifications" className="text-lg font-bold text-[#14244B]">
                          Cài đặt Thông báo
                        </h2>
                        <p className="text-xs text-[#607096]">Quản lý nhắc lịch luyện tập và bản tin tiến độ</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-2.5 py-0.5 text-[10px] font-semibold text-[#204195]">
                      ALERTS &amp; EMAIL
                    </span>
                  </div>

                  {/* List of Notification Toggles */}
                  <div className="space-y-4">
                    {/* Toggle 1: Lịch nhắc luyện tập */}
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#DCE4F3] bg-white p-3.5 transition-colors hover:bg-[#F8FAFC]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-[#204195]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                            Nhắc nhở lịch luyện tập hàng tuần
                          </span>
                        </div>
                        <p className="text-xs text-[#607096]">
                          Nhận email vào đầu tuần để duy trì thói quen trả lời câu hỏi và kiểm tra độ phản xạ.
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.notifyWeeklyReminder}
                        aria-label="Nhận email nhắc nhở lịch luyện tập"
                        onClick={() =>
                          setSettings({ ...settings, notifyWeeklyReminder: !settings.notifyWeeklyReminder })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.notifyWeeklyReminder ? "bg-[#204195]" : "bg-gray-300"
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
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#DCE4F3] bg-white p-3.5 transition-colors hover:bg-[#F8FAFC]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-4 text-[#204195]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                            Gợi ý việc làm mới phù hợp (Job Match)
                          </span>
                        </div>
                        <p className="text-xs text-[#607096]">
                          Thông báo ngay khi có Job mở tuyển dụng phù hợp với kết quả phỏng vấn và CV của bạn.
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.notifyJobMatch}
                        aria-label="Thông báo khi có việc làm mới phù hợp"
                        onClick={() =>
                          setSettings({ ...settings, notifyJobMatch: !settings.notifyJobMatch })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.notifyJobMatch ? "bg-[#204195]" : "bg-gray-300"
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
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#DCE4F3] bg-white p-3.5 transition-colors hover:bg-[#F8FAFC]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="size-4 text-[#204195]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                            Báo cáo phân tích tiến độ định kỳ
                          </span>
                        </div>
                        <p className="text-xs text-[#607096]">
                          Gửi bảng phân tích chỉ số STAR, tỷ lệ trả lời đúng và các điểm yếu cần khắc phục qua email.
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.notifyProgressReport}
                        aria-label="Báo cáo phân tích kỹ năng và tiến độ định kỳ"
                        onClick={() =>
                          setSettings({ ...settings, notifyProgressReport: !settings.notifyProgressReport })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.notifyProgressReport ? "bg-[#204195]" : "bg-gray-300"
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
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#DCE4F3] bg-white p-3.5 transition-colors hover:bg-[#F8FAFC]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Volume2 className="size-4 text-[#204195]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                            Hiệu ứng âm thanh bài làm (Sound FX)
                          </span>
                        </div>
                        <p className="text-xs text-[#607096]">
                          Tiếng chuông đếm ngược 10 giây cuối và tiếng xác nhận khi hoàn thành câu hỏi trắc nghiệm.
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.notifySoundFx}
                        aria-label="Hiệu ứng âm thanh khi làm bài"
                        onClick={() =>
                          setSettings({ ...settings, notifySoundFx: !settings.notifySoundFx })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.notifySoundFx ? "bg-[#204195]" : "bg-gray-300"
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

                <div className="mt-6 border-t border-[#EAEFF8] pt-4 text-right">
                  <span className="text-xs text-[#607096]">
                    Gửi tới: <strong className="text-[#14244B]">{profile?.email || "Chưa xác định"}</strong>
                  </span>
                </div>
              </section>
            )}

            {/* CARD 3: BẢO MẬT & XÁC THỰC */}
            {(activeTab === "all" || activeTab === "security") && (
              <section
                aria-labelledby="heading-security"
                className="flex flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-7"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-[#EAEFF8] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4FC] text-[#204195]">
                        <Shield className="size-5 shrink-0" />
                      </div>
                      <div>
                        <h2 id="heading-security" className="text-lg font-bold text-[#14244B]">
                          Bảo mật &amp; Xác thực
                        </h2>
                        <p className="text-xs text-[#607096]">Đổi mật khẩu, liên kết SSO và kiểm soát phiên</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-2.5 py-0.5 text-[10px] font-semibold text-[#204195]">
                      ACCOUNT SECURITY
                    </span>
                  </div>

                  {/* Section: Linked Accounts */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                      Tài khoản liên kết:
                    </span>

                    <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE4F3] bg-white font-bold text-[#14244B] shadow-2xs">
                            G
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#14244B]">Google Account</p>
                            <p className="text-[11px] text-[#607096]">{profile?.email || "Chưa đồng bộ"}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Đã liên kết
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section: Password Action */}
                  <div className="rounded-xl border border-[#DCE4F3] bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                          Mật khẩu đăng nhập
                        </p>
                        <p className="text-xs text-[#607096]">
                          Cập nhật mật khẩu thường xuyên để tăng cường an toàn thông tin.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-xs font-semibold text-[#14244B] transition-colors hover:bg-[#F8FAFC]"
                        aria-label="Mở cửa sổ đổi mật khẩu"
                      >
                        <Key className="size-3.5 shrink-0 text-[#204195]" />
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>

                  {/* Section: Active Sessions */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                      Phiên đăng nhập hiện tại:
                    </span>
                    <div className="flex items-center justify-between rounded-xl border border-[#DCE4F3] bg-white p-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Laptop className="size-4 text-[#204195]" />
                        <div>
                          <p className="font-semibold text-[#14244B]">Chrome trên Windows (Thiết bị này)</p>
                          <p className="text-[10px] text-[#607096]">IP: 14.232.188.xxx • Việt Nam</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#EAEFF8] pt-4 text-right">
                  <button
                    type="button"
                    onClick={() => showToast("Đã đăng xuất khỏi tất cả các thiết bị khác!", "info")}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Đăng xuất khỏi các thiết bị khác
                  </button>
                </div>
              </section>
            )}

            {/* CARD 4: QUẢN LÝ DỮ LIỆU & VÙNG NGUY HIỂM */}
            {(activeTab === "all" || activeTab === "danger") && (
              <section
                aria-labelledby="heading-danger"
                className="flex flex-col justify-between rounded-2xl border border-red-200 bg-white p-6 shadow-xs sm:p-7"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-red-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <AlertTriangle className="size-5 shrink-0" />
                      </div>
                      <div>
                        <h2 id="heading-danger" className="text-lg font-bold text-red-700">
                          Quản lý dữ liệu &amp; Vùng nguy hiểm
                        </h2>
                        <p className="text-xs text-[#607096]">Xuất hồ sơ phỏng vấn hoặc hủy kích hoạt tài khoản</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold text-red-700">
                      DANGER ZONE
                    </span>
                  </div>

                  {/* Section: Export Data */}
                  <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Download className="size-4 text-[#204195]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#14244B]">
                            Tải về toàn bộ dữ liệu phỏng vấn
                          </span>
                        </div>
                        <p className="text-xs text-[#607096]">
                          Xuất toàn bộ phiên luyện tập, phân tích STAR và danh sách CV sang tệp định dạng JSON.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleExportData}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-xs font-semibold text-[#14244B] transition-colors hover:bg-[#F8FAFC]"
                        aria-label="Tải về dữ liệu lịch sử phỏng vấn"
                      >
                        <FileDown className="size-3.5 shrink-0 text-[#204195]" />
                        Export Data
                      </button>
                    </div>
                  </div>

                  {/* Section: Delete Account Warning */}
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                          Xóa tài khoản vĩnh viễn
                        </p>
                        <p className="text-xs text-[#607096]">
                          Hành động này sẽ xóa toàn bộ lịch sử luyện tập, CV đã tải lên và không thể hoàn tác lại.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmationInput("");
                          setIsDeleteModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                        aria-label="Xác nhận xóa tài khoản vĩnh viễn"
                      >
                        <Trash2 className="size-4 shrink-0" />
                        Xóa tài khoản vĩnh viễn
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-red-100 pt-4 text-right">
                  <span className="text-[11px] font-medium text-[#607096]">
                    Tuân thủ tiêu chuẩn quyền riêng tư GDPR &amp; bảo mật dữ liệu cá nhân
                  </span>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* MODAL: ĐỔI MẬT KHẨU */}
      {isPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-[#EAEFF8] pb-4">
              <div className="flex items-center gap-2.5">
                <Lock className="size-5 text-[#204195]" />
                <h3 id="password-modal-title" className="text-base font-bold text-[#14244B]">
                  Đổi mật khẩu tài khoản
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-lg p-1 text-[#607096] transition-colors hover:bg-[#F8FAFC]"
                aria-label="Đóng cửa sổ"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="mt-5 space-y-4">
              {passwordError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {passwordError}
                </div>
              )}

              {/* Mật khẩu cũ */}
              <div className="space-y-1.5">
                <label htmlFor={currentPasswordId} className="text-xs font-semibold uppercase text-[#14244B]">
                  Mật khẩu hiện tại:
                </label>
                <input
                  id={currentPasswordId}
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-[#DCE4F3] px-3.5 py-2.5 text-sm font-medium text-[#14244B] transition-colors focus:border-[#204195] focus:outline-none focus:ring-1 focus:ring-[#204195]"
                />
              </div>

              {/* Mật khẩu mới */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={newPasswordId} className="text-xs font-semibold uppercase text-[#14244B]">
                    Mật khẩu mới:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-semibold text-[#204195] hover:underline"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
                <input
                  id={newPasswordId}
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  className="w-full rounded-xl border border-[#DCE4F3] px-3.5 py-2.5 text-sm font-medium text-[#14244B] transition-colors focus:border-[#204195] focus:outline-none focus:ring-1 focus:ring-[#204195]"
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
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-medium text-[#607096]">
                      Độ mạnh: {passwordStrength <= 2 ? "Trung bình" : "Mạnh & An toàn"}
                    </p>
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="space-y-1.5">
                <label htmlFor={confirmPasswordId} className="text-xs font-semibold uppercase text-[#14244B]">
                  Xác nhận mật khẩu mới:
                </label>
                <input
                  id={confirmPasswordId}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full rounded-xl border border-[#DCE4F3] px-3.5 py-2.5 text-sm font-medium text-[#14244B] transition-colors focus:border-[#204195] focus:outline-none focus:ring-1 focus:ring-[#204195]"
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-xs font-semibold text-[#607096] transition-colors hover:bg-[#F8FAFC]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#183275] disabled:opacity-60"
                >
                  {isUpdatingPassword ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-red-100 pb-4">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="size-5 shrink-0" />
                <h3 id="delete-modal-title" className="text-base font-bold text-red-700">
                  Xác nhận xóa tài khoản vĩnh viễn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg p-1 text-[#607096] transition-colors hover:bg-red-50"
                aria-label="Đóng cửa sổ"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleDeleteAccountSubmit} className="mt-5 space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                <p className="font-bold">CẢNH BÁO NGUY HIỂM:</p>
                <p className="mt-1">
                  Mọi buổi phỏng vấn mô phỏng, kết quả phân tích AI và CV đã lưu trữ sẽ bị hủy hoàn toàn ngay lập tức.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor={deleteConfirmId} className="text-xs font-medium text-[#14244B]">
                  Vui lòng nhập lại email của bạn (<span className="font-mono font-bold text-red-600">{profile?.email || "DELETE"}</span>) để xác nhận:
                </label>
                <input
                  id={deleteConfirmId}
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={profile?.email || "DELETE"}
                  required
                  className="w-full rounded-xl border border-red-300 px-3.5 py-2.5 text-sm font-medium text-red-700 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-xs font-semibold text-[#607096] transition-colors hover:bg-[#F8FAFC]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeletingAccount ||
                    deleteConfirmationInput.toLowerCase().trim() !== (profile?.email || "delete").toLowerCase().trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-red-700 disabled:opacity-40"
                >
                  {isDeletingAccount ? "Đang xóa tài khoản..." : "Xác nhận xóa vĩnh viễn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserDashboardShell>
  );
}
