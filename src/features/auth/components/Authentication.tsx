"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
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
import { readAuthProfile, writeAuthProfile } from "@features/auth/services/auth.service";
import { authApi, type AuthResponse } from "@lib/apiClient";

type AuthMode = "login" | "signup";

function pickUserPicture(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const value = user as Record<string, unknown>;
  for (const candidate of [value.picture, value.avatar, value.avatarUrl, value.photoURL, value.photo_url, value.image]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error) {
    const value = error as { message?: string; response?: { data?: { message?: string } } };
    return value.response?.data?.message || value.message || fallback;
  }
  return fallback;
}

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

export default function Authentication({ defaultMode = "login" }: { defaultMode?: AuthMode }) {
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
    let score = 0;
    if (ruleLength) score++;
    if (ruleCase) score++;
    if (ruleNumber) score++;
    if (ruleSymbol) score++;
    return score;
  }, [ruleLength, ruleCase, ruleNumber, ruleSymbol]);

  function getCookie(name: string) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setRoleCookie(role: "admin" | "user") {
    document.cookie = "role=" + role + "; Path=/; SameSite=Lax; Max-Age=604800";
  }

  async function completeAuth(data: AuthResponse) {
    const accessToken = data.access_token;
    const picture = pickUserPicture(data.user) || readAuthProfile()?.picture?.trim() || null;
    localStorage.setItem("accessToken", accessToken);
    document.cookie = "access_token=" + accessToken + "; Path=/; SameSite=Lax; Max-Age=604800";
    writeAuthProfile({ email: data.user.email, name: data.user.name, picture, roles: data.user.roles ?? [] });
    const admin = data.user.roles?.includes("ADMIN") ?? false;
    setRoleCookie(admin ? "admin" : "user");
    router.replace(nextUrl ?? (admin ? "/admin/dashboard" : "/dashboard"));
  }

  useEffect(() => {
    const role = getCookie("role")?.toLowerCase();
    if (role === "admin") router.replace(nextUrl ?? "/admin/dashboard");
    if (role === "user") router.replace(nextUrl ?? "/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (token) => {
      try {
        setGoogleLoading(true);
        setFormErrors({});
        const response = await authApi.googleLogin(token.access_token);
        await completeAuth(response.data);
      } catch (error) {
        setFormErrors({ form: errorMessage(error, t("auth.error.googleFailed")) });
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
      await completeAuth(response.data);
    } catch (error) {
      setFormErrors({ form: errorMessage(error, mode === "login" ? t("auth.error.loginFailed") : t("auth.error.signupFailed")) });
    } finally {
      setLoading(false);
    }
  }

  const strengthColor = passwordStrengthScore <= 1 ? "bg-[#EF4444]" : passwordStrengthScore <= 3 ? "bg-[#FCB625]" : "bg-[#10B981]";
  const strengthLabel = passwordStrengthScore <= 1 ? t("auth.strengthWeak") : passwordStrengthScore <= 3 ? t("auth.strengthGood") : t("auth.strengthStrong");

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center items-center bg-white px-4 sm:px-6 py-12 text-[#14244B]">
      {/* TOP NAVIGATION: LOGO (TOP-LEFT) & BACK BUTTON (TOP-RIGHT) */}
      <header className="absolute top-5 sm:top-8 left-5 sm:left-10 right-5 sm:right-10 flex items-center justify-between z-20">
        <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-[#14244B] hover:opacity-90 transition-opacity">
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
          <div className="mb-6 flex w-full gap-1 rounded-xl border border-[#DCE4F3] bg-[#F7F9FD] p-1" role="tablist" aria-label={t("auth.authMode")}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer ${mode === "login"
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
              className={`flex-1 rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer ${mode === "signup"
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
            {googleLoading ? <LoaderCircle className="animate-spin text-[#204195]" size={18} /> : <GoogleMark />}
            <span>{mode === "login" ? t("auth.googleLogin") : t("auth.googleSignup")}</span>
          </button>

          {/* DIVIDER */}
          <div className="relative my-5 flex items-center w-full">
            <span className="w-full border-t border-[#DCE4F3]" />
            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-3 text-xs font-medium text-[#8A9ABA]">
              {t("auth.orEmail")}
            </span>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#14244B]">
                    {t("auth.fullName")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9ABA]" size={18} />
                    <input
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-[50px] w-full rounded-[14px] border border-[#D1DBED] bg-white pl-10 pr-4 text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] focus:border-[#204195]/45 focus:outline-none focus:ring-4 focus:ring-[#204195]/[0.07] transition-all"
                      placeholder={t("auth.namePlaceholder")}
                      aria-invalid={Boolean(formErrors.name)}
                    />
                  </div>
                  {formErrors.name && <p className="mt-1 text-xs font-semibold text-[#EF4444]">{formErrors.name}</p>}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#14244B]">
                  {t("auth.emailAddress")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9ABA]" size={18} />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[50px] w-full rounded-[14px] border border-[#D1DBED] bg-white pl-10 pr-4 text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] focus:border-[#204195]/45 focus:outline-none focus:ring-4 focus:ring-[#204195]/[0.07] transition-all"
                    placeholder={t("auth.emailPlaceholder")}
                    aria-invalid={Boolean(formErrors.email)}
                  />
                </div>
                {formErrors.email && <p className="mt-1 text-xs font-semibold text-[#EF4444]">{formErrors.email}</p>}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-[#14244B]">
                  <span>{t("auth.password")}</span>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9ABA]" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[50px] w-full rounded-[14px] border border-[#D1DBED] bg-white pl-10 pr-11 text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] focus:border-[#204195]/45 focus:outline-none focus:ring-4 focus:ring-[#204195]/[0.07] transition-all"
                    placeholder="••••••••"
                    aria-describedby={mode === "signup" && password ? "password-strength-panel" : undefined}
                    aria-invalid={Boolean(formErrors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#8A9ABA] hover:bg-[#F7F9FD] hover:text-[#14244B] transition-colors cursor-pointer"
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && <p className="mt-1 text-xs font-semibold text-[#EF4444]">{formErrors.password}</p>}
              </div>

              {/* COMPACT PASSWORD STRENGTH (Signup mode only, visible when typing) */}
              {mode === "signup" && password && (
                <div id="password-strength-panel" className="mt-3 rounded-xl border border-[#DCE4F3] bg-[#F7F9FD] p-3 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 gap-1.5">
                      {[1, 2, 3, 4].map((seg) => (
                        <span
                          key={seg}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${seg <= passwordStrengthScore ? strengthColor : "bg-[#D1DBED]"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#14244B] shrink-0" aria-live="polite">
                      {strengthLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-medium text-[#607096]">
                    <div className={`flex items-center gap-1.5 ${ruleLength ? "text-[#10B981] font-bold" : ""}`}>
                      <span className="shrink-0">{ruleLength ? "✓" : "○"}</span>
                      <span>{t("auth.passwordRule.length")}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleCase ? "text-[#10B981] font-bold" : ""}`}>
                      <span className="shrink-0">{ruleCase ? "✓" : "○"}</span>
                      <span>{t("auth.passwordRule.case")}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleNumber ? "text-[#10B981] font-bold" : ""}`}>
                      <span className="shrink-0">{ruleNumber ? "✓" : "○"}</span>
                      <span>{t("auth.passwordRule.number")}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${ruleSymbol ? "text-[#10B981] font-bold" : ""}`}>
                      <span className="shrink-0">{ruleSymbol ? "✓" : "○"}</span>
                      <span>{t("auth.passwordRule.symbol")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TERMS CHECKBOX (Signup mode only) */}
              {mode === "signup" && (
                <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs leading-relaxed text-[#607096]">
                  <div className="relative flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="peer h-4 w-4 appearance-none rounded border border-[#D1DBED] bg-white checked:bg-[#204195] checked:border-[#204195] transition-all cursor-pointer"
                    />
                    <Check
                      size={12}
                      className="pointer-events-none absolute left-0.5 top-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                    />
                  </div>
                  <span>
                    {t("auth.termsAgreePre")}{" "}
                    <Link href="#" className="font-bold text-[#204195] underline underline-offset-2">
                      {t("auth.termsOfService")}
                    </Link>{" "}
                    {t("auth.termsAnd")}{" "}
                    <Link href="#" className="font-bold text-[#204195] underline underline-offset-2">
                      {t("auth.privacyPolicy")}
                    </Link>
                  </span>
                </label>
              )}

              {formErrors.agreed && <p className="text-xs font-semibold text-[#EF4444]">{formErrors.agreed}</p>}
              {formErrors.form && (
                <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-semibold text-[#EF4444]" role="alert">
                  {formErrors.form}
                </div>
              )}
            </div>

            {/* PRIMARY SUBMIT CTA */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-6 flex h-[48px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#204195] px-6 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-[#183275] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin text-white" />
                  <span>{t("auth.submitting")}</span>
                </>
              ) : mode === "login" ? (
                <span>{t("auth.submitLogin")}</span>
              ) : (
                <span>{t("auth.submitSignup")}</span>
              )}
            </button>
          </form>

          {/* SECURITY NOTE BELOW CTA */}
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[#70809F]">
            <ShieldCheck size={15} className="shrink-0 text-[#10B981]" />
            <span>{t("auth.encryptedSession")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
