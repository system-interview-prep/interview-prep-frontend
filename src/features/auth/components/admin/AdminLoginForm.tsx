"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { BrandLogo } from "@components/shared/BrandLogo";
import { adminHomePath } from "@features/admin/access";
import {
  INTERNAL_ROLES,
  completeAuthSession,
  getAuthErrorMessage,
  getCookie,
} from "@features/auth/services/auth.service";
import { authApi } from "@lib/apiClient";

export default function AdminLoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoFilled, setDemoFilled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextUrl = useMemo(() => {
    const next = searchParams.get("next");
    if (!next) return "/admin/dashboard";
    // Avoid redirect loops back to /admin/login
    if (next === "/admin/login" || next.startsWith("/admin/login?")) {
      return "/admin/dashboard";
    }
    return next.startsWith("/") && !next.startsWith("//") ? next : "/" + next.replace(/^\/+/, "");
  }, [searchParams]);

  // If already authenticated as admin, redirect to admin dashboard immediately
  useEffect(() => {
    const role = getCookie("role")?.toLowerCase();
    const token =
      getCookie("access_token") ||
      (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

    if (token && role === "admin") {
      router.replace(nextUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage(
        t("admin.login.error.emailRequired") || "Vui lòng nhập email quản trị viên."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        t("admin.login.error.passwordRequired") || "Vui lòng nhập mật khẩu."
      );
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.login(trimmedEmail, password);

      // Any internal actor (ADMIN or a question-bank role) may use the console;
      // completeAuthSession rejects candidates before storing anything.
      const roles = response.data.user.roles;
      if (!roles.some((role) => INTERNAL_ROLES.has(role.toUpperCase()))) {
        setErrorMessage(
          t("admin.login.error.notAdmin") ||
          "Tài khoản này không có quyền truy cập hệ thống quản trị."
        );
        return;
      }

      completeAuthSession(response.data, "ADMIN");
      router.replace(searchParams.get("next") ? nextUrl : adminHomePath(roles));
    } catch (error) {
      const fallback =
        t("admin.login.error.invalidCredentials") ||
        "Email hoặc mật khẩu không chính xác.";
      setErrorMessage(getAuthErrorMessage(error, fallback));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-[#F7F9FD] px-4 py-8 text-[#14244B]">
      {/* Top bar: Back to INTERVIA */}
      <header className="mx-auto flex w-full max-w-[420px] items-center justify-between pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#607096] hover:text-[#204195] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{t("fixAdmin.login.backToIntervia")}</span>
        </Link>

        <span className="inline-flex items-center gap-1 rounded-full border border-[#DCE4F3] bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#204195]">
          <Shield size={12} className="text-[#204195]" />
          <span>{t("admin.login.consoleBadge") || "ADMIN CONSOLE"}</span>
        </span>
      </header>

      {/* Main card */}
      <main className="mx-auto my-auto w-full max-w-[420px]">
        <div className="rounded-3xl border border-[#DCE4F3] bg-white p-7 shadow-[0_12px_40px_rgba(20,36,75,0.06)] sm:p-8">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-2 mb-3">
              <BrandLogo size={38} />
              <span className="font-display text-lg font-bold tracking-[0.08em] text-[#14244B]">
                INTERVIA
              </span>
            </div>

            <h1 className="font-headline text-xl font-bold tracking-tight text-[#14244B] sm:text-2xl">
              {t("admin.login.title") || "Đăng nhập hệ thống quản trị"}
            </h1>
            <p className="mt-1 text-xs text-[#607096]">
              {t("admin.login.subtitle") ||
                "Truy cập giới hạn cho đội ngũ vận hành hệ thống"}
            </p>
          </div>

          {/* Error Message Area */}
          <div className="min-h-[20px] mt-3">
            {errorMessage && (
              <div
                id="admin-login-error"
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-2xl border border-[#C43B3B]/25 bg-[#FDF2F2] p-3 text-xs font-semibold text-[#C43B3B]"
              >
                <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[#C43B3B]" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}
          </div>



          {/* Admin Login Form */}
          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-bold text-[#14244B]"
              >
                {t("admin.login.emailLabel") || "Email"}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A98B8] pointer-events-none"
                />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    t("admin.login.emailPlaceholder") || "admin@intervia.io"
                  }
                  disabled={loading}
                  aria-invalid={!!errorMessage}
                  aria-describedby={errorMessage ? "admin-login-error" : undefined}
                  className="h-[44px] w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] pl-10 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] transition-all focus:border-[#204195] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-bold text-[#14244B]"
              >
                {t("admin.login.passwordLabel") || "Mật khẩu"}
              </label>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A98B8] pointer-events-none"
                />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("admin.login.passwordPlaceholder") || "••••••••"}
                  disabled={loading}
                  aria-invalid={!!errorMessage}
                  aria-describedby={errorMessage ? "admin-login-error" : undefined}
                  className="h-[44px] w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] pl-10 pr-12 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] transition-all focus:border-[#204195] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]/30"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-xs font-bold text-white shadow-xs hover:bg-[#183275] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading && <LoaderCircle className="animate-spin" size={16} />}
              <span>
                {loading
                  ? t("admin.login.submitting") || "Đang đăng nhập..."
                  : t("admin.login.submit") || "Đăng nhập Admin"}
              </span>
            </button>
          </form>

          {/* Demo Account Quick Fill - Only in non-production */}
          {process.env.NODE_ENV !== "production" && (
            <button
              type="button"
              onClick={() => {
                setEmail("admin@intervia.io");
                setPassword("Admin@123456");
                setDemoFilled(true);
              }}
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-3.5 text-left transition-colors hover:border-[#204195]/35 hover:bg-[#EEF3FC] cursor-pointer"
            >
              <div>
                <p className="text-[13px] font-bold text-[#14244B]">
                  {t("admin.login.demoTitle") || "Tài khoản demo"}
                </p>
                <p className="mt-0.5 font-mono text-[13px] font-semibold text-[#204195]">
                  admin@intervia.io
                </p>
                <p className={`mt-1.5 text-[11px] font-medium ${demoFilled ? "text-[#287A4B]" : "text-[#607096]"}`}>
                  {demoFilled ? (t("admin.login.demoFilled") || "✓ Đã điền tài khoản demo") : (t("admin.login.demoPrompt") || "Nhấn để tự động điền thông tin đăng nhập")}
                </p>
              </div>
            </button>
          )}
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="mx-auto w-full max-w-[420px] text-center pt-4">
        <p className="text-[11px] text-[#8A98B8] leading-relaxed">
          {t("admin.login.restrictedNotice") ||
            "Khu vực giới hạn. Mọi phiên truy cập đều được ghi nhật ký audit log."}
        </p>
      </footer>
    </div>
  );
}
