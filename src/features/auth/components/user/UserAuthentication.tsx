"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import FoxAvatar from "@features/mascot/components/FoxAvatar";
import { StatusNote } from "@components/shared/StatusNote";
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
  // Password reset is not built yet; say so inline instead of a native alert().
  const [showForgotNote, setShowForgotNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Set once the session is stored, so the page can say where it is taking the user.
  const [redirecting, setRedirecting] = useState(false);

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
    setRedirecting(true);
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
    setShowForgotNote(false);
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
      ? "bg-[#C43B3B]"
      : passwordStrengthScore === 2
      ? "bg-[#FCB625]"
      : passwordStrengthScore === 3
      ? "bg-[#204195]"
      : "bg-[#287A4B]";
  const strengthText =
    passwordStrengthScore === 1
      ? "text-[#C43B3B]"
      : passwordStrengthScore === 2
      ? "text-[#14244B]"
      : passwordStrengthScore === 3
      ? "text-[#204195]"
      : "text-[#287A4B]";
  const strengthLabel =
    passwordStrengthScore === 1
      ? t("auth.passwordStrengthWeak") || "Yếu"
      : passwordStrengthScore === 2
      ? t("auth.passwordStrengthFair") || "Khá"
      : passwordStrengthScore === 3
      ? t("auth.passwordStrengthGood") || "Tốt"
      : t("auth.passwordStrengthStrong") || "Mạnh";

  // Plain words for what is happening right now, shown under the submit button.
  const statusText = redirecting
    ? mode === "signup"
      ? t("uxm.auth.signupDone")
      : t("uxm.auth.redirecting")
    : googleLoading
    ? t("uxm.auth.googleWaiting")
    : loading
    ? mode === "login"
      ? t("uxm.auth.checking")
      : t("uxm.auth.creating")
    : "";

  const inputClass = (hasError: boolean) =>
    `h-12 w-full rounded-2xl border-0 bg-[#F7F9FD] px-4 text-sm text-[#14244B] outline-none ring-1 transition placeholder:text-[#8A98B8] focus:bg-white focus:ring-2 focus:ring-[#204195] ${
      hasError ? "ring-[#C43B3B]" : "ring-[#DCE4F3]"
    }`;
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-[#14244B]";
  const fieldErrorClass = "mt-1.5 text-xs font-medium text-[#C43B3B]";

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-[#F7F9FD] px-4 py-6 font-body text-[#14244B] sm:px-6 sm:py-8">
      {/* Top bar: brand + way back home */}
      <header className="relative z-20 mx-auto flex w-full max-w-[480px] items-center justify-between gap-4 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-[#DCE4F3]">
            <FoxAvatar size={38} />
          </span>
          <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-[#14244B]">
            Intervia
          </span>
        </Link>
        <Link
          href="/"
          className="rounded-full px-3 py-2 text-sm font-semibold text-[#607096] transition-colors hover:bg-white hover:text-[#14244B]"
        >
          ← {t("uxm.auth.backHome")}
        </Link>
      </header>

      {/* Main auth card */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-[480px] py-4">
        <div className="w-full rounded-3xl bg-white p-6 shadow-[0_24px_60px_-36px_rgba(20,36,75,0.45)] ring-1 ring-[#DCE4F3] sm:p-8">
          {/* Segmented tab control */}
          <div
            className="mb-6 flex w-full gap-1 rounded-full bg-[#F7F9FD] p-1"
            role="tablist"
            aria-label={t("auth.authMode")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-full py-2.5 text-sm transition-colors ${
                mode === "login"
                  ? "bg-white font-semibold text-[#14244B] shadow-[0_4px_14px_-10px_rgba(20,36,75,0.5)]"
                  : "font-medium text-[#607096] hover:text-[#14244B]"
              }`}
            >
              {t("auth.tabLogin")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-full py-2.5 text-sm transition-colors ${
                mode === "signup"
                  ? "bg-white font-semibold text-[#14244B] shadow-[0_4px_14px_-10px_rgba(20,36,75,0.5)]"
                  : "font-medium text-[#607096] hover:text-[#14244B]"
              }`}
            >
              {t("auth.tabSignup")}
            </button>
          </div>

          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#14244B] sm:text-[30px]">
            {mode === "login" ? t("auth.welcomeBackTitle") : t("auth.signupTitle")}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[#607096]">
            {mode === "login" ? t("auth.welcomeBackSubtitle") : t("auth.signupSubtitle")}
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={googleLoading || loading}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-4 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#F7F9FD] disabled:opacity-60"
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

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#DCE4F3]" />
            <span className="text-xs text-[#607096]">
              {t("auth.orContinueWith")}
            </span>
            <div className="h-px flex-1 bg-[#DCE4F3]" />
          </div>

          {/* Form-level error */}
          {formErrors.form && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-[#C43B3B]/25 bg-[#FDF2F2] p-3.5 text-[13px] font-medium text-[#C43B3B]"
            >
              {formErrors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="user-fullname" className={labelClass}>
                  {t("auth.fullNameLabel")}
                </label>
                <input
                  id="user-fullname"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "user-fullname-error" : undefined}
                  className={inputClass(!!formErrors.name)}
                />
                {formErrors.name && (
                  <p id="user-fullname-error" className={fieldErrorClass}>
                    {formErrors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="user-email" className={labelClass}>
                {t("auth.emailLabel")}
              </label>
              <input
                id="user-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? "user-email-error" : undefined}
                className={inputClass(!!formErrors.email)}
              />
              {formErrors.email && (
                <p id="user-email-error" className={fieldErrorClass}>
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="user-password"
                  className="text-[13px] font-semibold text-[#14244B]"
                >
                  {t("auth.passwordLabel")}
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setShowForgotNote(true)}
                    aria-expanded={showForgotNote}
                    aria-controls="forgot-password-note"
                    className="text-[13px] font-semibold text-[#204195] underline-offset-4 hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                )}
              </div>
              {mode === "login" && showForgotNote && (
                <div id="forgot-password-note" className="mb-2">
                  <StatusNote
                    text={t("fixAdmin.auth.forgotTitle")}
                    hint={t("fixAdmin.auth.forgotHint")}
                    onDismiss={() => setShowForgotNote(false)}
                    dismissLabel={t("fixAdmin.common.close")}
                  />
                </div>
              )}
              <div className="relative">
                <input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  aria-invalid={!!formErrors.password}
                  aria-describedby={
                    formErrors.password ? "user-password-error" : mode === "signup" ? "user-password-help" : undefined
                  }
                  className={`${inputClass(!!formErrors.password)} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[#607096] transition-colors hover:bg-[#EEF3FC] hover:text-[#14244B]"
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
                       className="flex items-center gap-1.5"
                    >
                       {[1, 2, 3, 4].map((level) => (
                         <div
                           key={level}
                           className={`h-[5px] flex-1 rounded-full transition-colors duration-300 ease-out ${
                             passwordStrengthScore >= level ? strengthColor : "bg-[#EEF3FC]"
                           }`}
                         />
                       ))}
                    </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  {formErrors.password ? (
                    <p id="user-password-error" className="flex-1 text-xs font-medium leading-relaxed text-[#C43B3B]">
                      {formErrors.password}
                    </p>
                  ) : mode === "signup" ? (
                    <>
                      <p id="user-password-help" className="flex-1 text-xs leading-relaxed text-[#607096]">
                        {t("auth.passwordHelper") || "Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số."}
                      </p>

                      {passwordStrengthScore > 0 && (
                        <span className={`shrink-0 text-xs font-semibold ${strengthText}`}>
                          {strengthLabel}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>


            {mode === "signup" && (
              <div>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    aria-invalid={!!formErrors.agreed}
                    aria-describedby={formErrors.agreed ? "user-agreed-error" : undefined}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-[#DCE4F3] text-[#204195] focus:ring-[#204195]"
                  />
                  <span className="text-[13px] leading-5 text-[#607096]">
                    {/* No legal pages exist yet, so the terms are named in plain text, not linked. */}
                    {t("auth.termsAgreementPrefix")}{" "}
                    <span className="font-semibold text-[#14244B]">{t("auth.termsOfService")}</span>{" "}
                    {t("auth.andConnector")}{" "}
                    <span className="font-semibold text-[#14244B]">{t("auth.privacyPolicy")}</span>
                  </span>
                </label>
                {formErrors.agreed && (
                  <p id="user-agreed-error" className={fieldErrorClass}>
                    {formErrors.agreed}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(32,65,149,0.8)] transition-colors hover:bg-[#183275] disabled:opacity-60"
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

            <p role="status" aria-live="polite" className="min-h-[1.25rem] text-center text-[13px] font-medium text-[#204195]">
              {statusText}
            </p>
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center text-[13px] text-[#607096]">
            {mode === "login" ? (
              <>
                {t("auth.noAccountPrompt")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-[#204195] underline-offset-4 hover:underline"
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
                  className="font-semibold text-[#204195] underline-offset-4 hover:underline"
                >
                  {t("auth.signInNow")}
                </button>
              </>
            )}
          </div>

          <p className="mt-5 border-t border-[#DCE4F3] pt-4 text-center text-xs text-[#607096]">
            {t("auth.encryptedSession")}
          </p>
        </div>
      </main>

      {/* Footer spacer */}
      <footer className="mx-auto w-full max-w-[480px] text-center" />
    </div>
  );
}
