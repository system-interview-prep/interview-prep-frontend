"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Home,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useGoogleLogin } from "@react-oauth/google";
import {
  completeAuthSession,
  getAuthErrorMessage,
  getCookie,
} from "@features/auth/services/auth.service";
import { authApi, type AuthResponse } from "@lib/apiClient";

export type AuthMode = "login" | "signup";

function GoogleMark() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.59 6.59 0 0 1-9.87-3.47H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09A6.5 6.5 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.95 10.95 0 0 0 2.18 7.07l3.66 2.84A6.58 6.58 0 0 1 12 5.38Z" fill="#EA4335" />
    </svg>
  );
}

export default function UserAuthentication({ defaultMode = "login" }: { defaultMode?: AuthMode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const nextUrl = useMemo(() => {
    const next = searchParams.get("next");
    if (!next) return null;
    return next.startsWith("/") && !next.startsWith("//") ? next : "/" + next.replace(/^\/+/, "");
  }, [searchParams]);

  // Password rule checks
  const ruleLength = password.length >= 8;
  const ruleCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const ruleNumber = /\d/.test(password);
  const ruleSymbol = /[^A-Za-z0-9]/.test(password);

  const passwordStrengthScore = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (ruleLength) score++;
    if (ruleCase) score++;
    if (ruleNumber) score++;
    if (ruleSymbol) score++;
    
    return Math.max(1, score);
  }, [password, ruleLength, ruleCase, ruleNumber, ruleSymbol]);

  async function handleCompleteAuth(data: AuthResponse) {
    const { isAdmin } = completeAuthSession(data);
    router.replace(nextUrl ?? (isAdmin ? "/admin/dashboard" : "/dashboard"));
  }

  useEffect(() => {
    const role = getCookie("role")?.toLowerCase();
    const token = getCookie("access_token") || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
    if (token) {
      if (role === "admin") router.replace(nextUrl ?? "/admin/dashboard");
      else router.replace(nextUrl ?? "/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (token) => {
      try {
        setGoogleLoading(true);
        setFormErrors({});
        const response = await authApi.googleLogin(token.access_token);
        await handleCompleteAuth(response.data);
      } catch (error) {
        setFormErrors({ form: getAuthErrorMessage(error, t("auth.error.googleFailed")) });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setFormErrors({ form: t("auth.error.googleFailed") });
      setGoogleLoading(false);
    },
  });

  function switchMode(next: AuthMode) {
    setMode(next);
    setFormErrors({});
    window.history.replaceState(null, "", next === "login" ? "/login" : "/signup");
  }

  function onGoogleClick() {
    if (!googleConfigured) {
      setFormErrors({ form: t("auth.error.googleNotConfigured") });
      return;
    }
    setGoogleLoading(true);
    startGoogleLogin();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (mode === "signup" && !name.trim()) errors.name = t("auth.error.nameRequired");
    if (!email.trim()) errors.email = t("auth.error.emailRequired");
    if (!password) errors.password = t("auth.error.passwordRequired");
    if (mode === "signup" && !(ruleLength && ruleCase && ruleNumber)) {
      errors.password = t("auth.error.passwordRequirements");
    }
    if (mode === "signup" && !agreed) errors.agreed = t("auth.error.agreeRequired");

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setFormErrors({});
      const normalizedEmail = email.trim().toLowerCase();
      const response =
        mode === "signup"
          ? await authApi.register(name.trim(), normalizedEmail, password)
          : await authApi.login(normalizedEmail, password);
      await handleCompleteAuth(response.data);
    } catch (error) {
      setFormErrors({
        form: getAuthErrorMessage(
          error,
          mode === "login" ? t("auth.error.loginFailed") : t("auth.error.signupFailed")
        ),
      });
    } finally {
      setLoading(false);
    }
  }

  const strengthColor =
    passwordStrengthScore === 1
      ? "bg-[#EF5A67]"
      : passwordStrengthScore === 2
      ? "bg-[#FCB625]"
      : passwordStrengthScore === 3
      ? "bg-[#4D73D9]"
      : "bg-[#16A34A]";
  const strengthLabel =
    passwordStrengthScore === 1
      ? t("auth.passwordStrengthWeak") || "Yếu"
      : passwordStrengthScore === 2
      ? t("auth.passwordStrengthFair") || "Khá"
      : passwordStrengthScore === 3
      ? t("auth.passwordStrengthGood") || "Tốt"
      : t("auth.passwordStrengthStrong") || "Mạnh";

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center items-center bg-white px-4 sm:px-6 py-12 text-[#14244B]">
      {/* TOP NAVIGATION: LOGO (TOP-LEFT) & BACK BUTTON (TOP-RIGHT) */}
      <header className="absolute top-5 sm:top-8 left-5 sm:left-10 right-5 sm:right-10 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-[#14244B] hover:opacity-90 transition-opacity"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#204195] text-[#FCB625] shadow-xs">
            <Sparkles size={18} />
          </span>
          <span>INTERVIA</span>
        </Link>
        <Link
          href="/"
          aria-label="Home"
          className="grid h-9 w-9 place-items-center rounded-xl border border-[#DCE4F3] bg-white text-[#607096] hover:bg-[#F7F9FD] hover:text-[#204195] transition-colors shadow-xs"
        >
          <Home size={18} />
        </Link>
      </header>

      <div className="relative z-10 w-full max-w-[480px] my-auto flex flex-col items-center pt-12 sm:pt-4">
        {/* SINGLE CENTERED AUTH CARD */}
        <div className="w-full rounded-[26px] border border-[#DCE4F3] bg-white p-6 sm:p-8 md:p-9 shadow-[0_20px_60px_rgba(20,36,75,0.06)]">
          {/* SEGMENTED TAB CONTROL */}
          <div
            className="mb-6 flex w-full gap-1 rounded-xl border border-[#DCE4F3] bg-[#F7F9FD] p-1"
            role="tablist"
            aria-label={t("auth.authMode")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer ${
                mode === "login"
                  ? "bg-white text-[#204195] font-extrabold shadow-xs"
                  : "text-[#607096] hover:text-[#14244B] font-semibold"
              }`}
            >
              {t("auth.tabLogin")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-[#204195] font-extrabold shadow-xs"
                  : "text-[#607096] hover:text-[#14244B] font-semibold"
              }`}
            >
              {t("auth.tabSignup")}
            </button>
          </div>

          <h1 className="text-[26px] sm:text-[28px] font-extrabold tracking-[-0.03em] text-[#14244B]">
            {mode === "login" ? t("auth.welcomeBackTitle") : t("auth.signupTitle")}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[#607096]">
            {mode === "login" ? t("auth.welcomeBackSubtitle") : t("auth.signupSubtitle")}
          </p>

          {/* GOOGLE OAUTH BUTTON */}
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={googleLoading || loading}
            className="mt-6 flex h-[48px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#DCE4F3] bg-white px-4 font-bold text-sm text-[#14244B] shadow-xs hover:bg-[#F7F9FD] transition-all disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <LoaderCircle className="animate-spin text-[#204195]" size={18} />
            ) : (
              <GoogleMark />
            )}
            <span>
              {mode === "login" ? t("auth.googleSignIn") : t("auth.googleSignUp")}
            </span>
          </button>

          {/* OR DIVIDER */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#EAEFF8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A98B8]">
              {t("auth.orContinueWith")}
            </span>
            <div className="h-px flex-1 bg-[#EAEFF8]" />
          </div>

          {/* FORM ROOT ERROR */}
          {formErrors.form && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs font-semibold text-red-700"
            >
              {formErrors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="user-fullname"
                  className="mb-1.5 block text-xs font-bold text-[#14244B]"
                >
                  {t("auth.fullNameLabel")}
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A98B8]"
                  />
                  <input
                    id="user-fullname"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.fullNamePlaceholder")}
                    className={`h-[46px] w-full rounded-[14px] border bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-all ${
                      formErrors.name ? "border-red-400" : "border-[#DCE4F3]"
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {formErrors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="user-email"
                className="mb-1.5 block text-xs font-bold text-[#14244B]"
              >
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A98B8]"
                />
                <input
                  id="user-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className={`h-[46px] w-full rounded-[14px] border bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-all ${
                    formErrors.email ? "border-red-400" : "border-[#DCE4F3]"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="user-password"
                  className="text-xs font-bold text-[#14244B]"
                >
                  {t("auth.passwordLabel")}
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        t("auth.forgotPasswordAlert") || "Tính năng khôi phục mật khẩu đang được phát triển. Vui lòng liên hệ support@intervia.io."
                      );
                    }}
                    className="text-xs font-semibold text-[#204195] hover:underline cursor-pointer"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                )}
              </div>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A98B8]"
                />
                <input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className={`h-[46px] w-full rounded-[14px] border bg-[#F8FAFC] pl-10 pr-10 text-sm text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-all ${
                    formErrors.password ? "border-red-400" : "border-[#DCE4F3]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A98B8] hover:text-[#14244B] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {mode === "signup" && (
                    <div 
                       role="progressbar"
                       aria-valuemin={0}
                       aria-valuemax={4}
                       aria-valuenow={passwordStrengthScore}
                       aria-label={passwordStrengthScore > 0 ? strengthLabel : (t("auth.passwordStrength") || "Password strength")}
                       className="flex items-center gap-2"
                    >
                       {[1, 2, 3, 4].map((level) => (
                         <div
                           key={level}
                           className={`h-[5px] flex-1 rounded-full transition-all duration-300 ease-out ${
                             passwordStrengthScore >= level
                               ? `${strengthColor} ${passwordStrengthScore === level ? 'scale-x-[1.03]' : ''}`
                               : "bg-[#E8EDF6]"
                           }`}
                         />
                       ))}
                    </div>
                )}
                    
                <div className="flex items-center justify-between gap-4">
                  {formErrors.password ? (
                    <p className="text-xs text-red-600 font-medium leading-relaxed flex-1">
                      {formErrors.password}
                    </p>
                  ) : mode === "signup" ? (
                    <>
                      <p className="text-xs text-[#607096] leading-relaxed flex-1">
                        {t("auth.passwordHelper") || "Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số."}
                      </p>
                      
                      {passwordStrengthScore > 0 && (
                        <div className={`flex items-center gap-1.5 shrink-0 text-xs font-bold ${
                          passwordStrengthScore === 1 ? "text-[#EF5A67]" :
                          passwordStrengthScore === 2 ? "text-[#FCB625]" :
                          passwordStrengthScore === 3 ? "text-[#4D73D9]" :
                          "text-[#16A34A]"
                        }`}>
                          <span>{strengthLabel}</span>
                          {passwordStrengthScore === 4 && (
                            <Sparkles size={14} className="text-[#FCB625]" />
                          )}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>


            {mode === "signup" && (
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-[#DCE4F3] text-[#204195] focus:ring-[#204195]"
                  />
                  <span className="text-xs text-[#607096]">
                    {t("auth.termsAgreementPrefix")}{" "}
                    <Link
                      href="/terms"
                      className="font-bold text-[#204195] hover:underline"
                    >
                      {t("auth.termsOfService")}
                    </Link>{" "}
                    {t("auth.andConnector")}{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-[#204195] hover:underline"
                    >
                      {t("auth.privacyPolicy")}
                    </Link>
                  </span>
                </label>
                {formErrors.agreed && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {formErrors.agreed}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#204195] px-6 text-sm font-bold text-white shadow-xs hover:bg-[#183377] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading && <LoaderCircle className="animate-spin" size={18} />}
              <span>
                {loading
                  ? mode === "login"
                    ? t("auth.signingIn")
                    : t("auth.signingUp")
                  : mode === "login"
                  ? t("auth.signInButton")
                  : t("auth.createAccountButton")}
              </span>
            </button>
          </form>

          {/* FOOTER SWITCH */}
          <div className="mt-6 text-center text-xs text-[#607096]">
            {mode === "login" ? (
              <>
                {t("auth.noAccountPrompt")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-extrabold text-[#204195] hover:underline cursor-pointer"
                >
                  {t("auth.signUpNow")}
                </button>
              </>
            ) : (
              <>
                {t("auth.haveAccountPrompt")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-extrabold text-[#204195] hover:underline cursor-pointer"
                >
                  {t("auth.signInNow")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* SECURITY BADGE BELOW CARD */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-[#8A98B8]">
          <ShieldCheck size={14} className="text-[#204195]" />
          <span>{t("auth.encryptedSession")}</span>
        </div>
      </div>
    </div>
  );
}
