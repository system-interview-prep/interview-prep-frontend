"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LanguageToggleButton from "../src/components/LanguageToggleButton";
import { useLanguage } from "../src/i18n/LanguageProvider";
import { useGoogleLogin } from "@react-oauth/google";
import { writeAuthProfile } from "../src/auth/authProfile";

export default function Authentication({ defaultMode = "login" }: { defaultMode?: "login" | "signup" }) {
  const { t, lang } = useLanguage();
  const isLogin = defaultMode === "login";
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupDob, setSignupDob] = useState("");
  const [signupType, setSignupType] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const nextUrl = useMemo(() => {
    const next = searchParams.get("next");
    if (!next) return null;
    return next.startsWith("/") ? next : `/${next}`;
  }, [searchParams]);

  const ADMIN_EMAIL = "admin@curator.ai";
  const ADMIN_PASSWORD = "Admin@123";

  function getCookie(name: string) {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setRoleCookie(role: "admin" | "user") {
    // Frontend-only demo auth: set cookie for middleware checks.
    // NOTE: in production, role should come from backend/session.
    document.cookie = `role=${role}; Path=/; SameSite=Lax; Max-Age=31536000`;
  }

  useEffect(() => {
    const role = getCookie("role");
    if (role?.toLowerCase() === "admin") {
      router.replace(nextUrl ?? "/admin/dashboard");
      return;
    }
    if (role?.toLowerCase() === "user") {
      router.replace(nextUrl ?? "/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      try {
        setGoogleError(null);
        setGoogleLoading(true);

        const r = await fetch("http://localhost:5000/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });
        
        if (!r.ok) {
           const errData = await r.json();
           throw new Error(errData.message || "Google Auth Failed");
        }
        
        const data = await r.json();

        if (data.access_token) {
          localStorage.setItem("accessToken", data.access_token);
        }
        if (data?.user) {
          writeAuthProfile({
            email: data.user.email ?? null,
            name: data.user.name ?? null,
            picture: data.user.picture ?? null,
          });
        }
        document.cookie = `access_token=${data.access_token}; Path=/; SameSite=Lax; Max-Age=31536000`;
        setRoleCookie(String(data.user.role ?? "").toUpperCase() === "ADMIN" ? "admin" : "user");

        router.replace(nextUrl ?? (String(data.user.role ?? "").toUpperCase() === "ADMIN" ? "/admin/dashboard" : "/dashboard"));
      } catch (err: any) {
        setGoogleError(err.message || t("auth.error.googleFailed"));
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setGoogleError(t("auth.error.googleFailed"));
      setGoogleLoading(false);
    },
  });

  function onGoogleClick() {
    if (!googleConfigured) {
      setGoogleError(t("auth.error.googleNotConfigured"));
      return;
    }
    setGoogleError(null);
    setGoogleLoading(true);
    startGoogleLogin();
  }

  async function onLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const email = loginEmail.trim().toLowerCase();
      const password = loginPassword;

      if (!email || !password) {
        setLoginError(t("auth.error.requiredEmailPassword"));
        return;
      }

      const r = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (!r.ok) {
         const errData = await r.json();
         throw new Error(errData.message || "Login Failed");
      }

      const data = await r.json();
      if (data.access_token) {
        localStorage.setItem("accessToken", data.access_token);
      }
      if (data?.user) {
        writeAuthProfile({
          email: data.user.email ?? null,
          name: data.user.name ?? null,
          picture: data.user.picture ?? null,
        });
      }
      document.cookie = `access_token=${data.access_token}; Path=/; SameSite=Lax; Max-Age=31536000`;
      setRoleCookie(String(data.user.role ?? "").toUpperCase() === "ADMIN" ? "admin" : "user");

      router.replace(nextUrl ?? (String(data.user.role ?? "").toUpperCase() === "ADMIN" ? "/admin/dashboard" : "/dashboard"));
    } catch (err: any) {
      setLoginError(err.message || "Failed to login");
    } finally {
      setLoginLoading(false);
    }
  }

  async function onSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);

    try {
      const email = signupEmail.trim().toLowerCase();
      const password = signupPassword;
      const name = signupName.trim();

      if (!email || !password || !name) {
        setSignupError("Please fill required fields");
        return;
      }

      const r = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, dob: signupDob, role: signupType || 'CANDIDATE' }),
      });
      
      if (!r.ok) {
         const errData = await r.json();
         throw new Error(errData.message || "Registration Failed");
      }

      // Instead of forcing login again, maybe redirect to login page.
      window.location.href = '/login';
    } catch (err: any) {
      setSignupError(err.message || "Failed to register");
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface font-body text-on-surface antialiased overflow-x-hidden">
      {/* Left Side: Editorial Branding & AI Visualization */}
      <section className="hidden md:flex md:w-1/2 ai-gradient-bg relative flex-col justify-between p-16 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <img
            alt=""
            className="w-full h-full object-cover mix-blend-overlay"
            data-alt="Abstract fluid 3D shapes with iridescent metallic texture, glowing neon highlights in deep blue and purple hues, cinematic studio lighting"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRYp_T0XcVsv9CPN1X1QOwg4uFeV4VVy7eHB8eKVmZgvyVoK5EQ8J09FGqK2-Wsk534JIRCCfPRbJfwkeAmeyMVbUOyNbQNzTVNN5tMdajhfZHzaloIM2rVvCkoC4SvUiYyJyatceB76t-X300mIMa30wC6ZN8nahSsuxK627ojP4L0TQYsB3zXddtld6Q8BgvLd0eQWIr4tjsxCZLeeicGQ87RCbgDeSjpbwpoP_gO2qbnlsh8BZIDm1RCFsFrbE3VERdY2_4v8eO"
          />
        </div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-lg flex items-center justify-center">
              <img src="/logo.jpg" alt="INTERVIA Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-headline font-black text-white text-4xl tracking-tighter">
              INTERVIA
            </h1>
          </Link>
          <p className="text-on-primary-container/80 mt-2 font-medium tracking-wide">
            {t("auth.brandTagline")}
          </p>
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <span className="inline-block w-12 h-1 bg-tertiary-fixed mb-6"></span>
            <h2 className="font-headline font-extrabold text-white text-5xl leading-tight tracking-tight">
              {t("auth.heroTitle.line1")} <br />
              {t("auth.heroTitle.line2")} <br />
              {t("auth.heroTitle.line3")}
            </h2>
            <p className="text-white/70 mt-6 text-lg leading-relaxed">
              {t("auth.heroDesc")}
            </p>
          </div>
          {/* Bento-style feature highlight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-xl border border-outline-variant/20">
              <span
                className="material-symbols-outlined text-white mb-3"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
              <p className="text-white font-bold text-sm">{t("auth.feature.aiInsights.title")}</p>
              <p className="text-white/60 text-xs mt-1">
                {t("auth.feature.aiInsights.desc")}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10">
              <span
                className="material-symbols-outlined text-white mb-3"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                database
              </span>
              <p className="text-white font-bold text-sm">{t("auth.feature.smartCuration.title")}</p>
              <p className="text-white/60 text-xs mt-1">{t("auth.feature.smartCuration.desc")}</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          {t("auth.rights")}
        </div>
      </section>

      {/* Right Side: Forms Container */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-24 bg-surface">
        <div className="w-full max-w-md space-y-12">
          {/* Toggle Navigation */}
          <div className="flex space-x-8 border-b border-outline-variant/20">
            <Link
              href="/login"
              className={`pb-4 font-headline text-lg tracking-tight ${
                isLogin
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-on-surface-variant font-medium hover:text-on-surface transition-colors"
              }`}
            >
              {t("auth.tab.login")}
            </Link>
            <Link
              href="/signup"
              className={`pb-4 font-headline text-lg tracking-tight ${
                !isLogin
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-on-surface-variant font-medium hover:text-on-surface transition-colors"
              }`}
            >
              {t("auth.tab.signup")}
            </Link>
            <div className="ml-auto pb-3">
              <LanguageToggleButton />
            </div>
          </div>

          {/* Login Form Section */}
          {isLogin && (
            <div className="space-y-8 animate-in fade-in" id="login-section">
              <div>
                <h3 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                  {t("auth.welcomeBack")}
                </h3>
                <p className="text-on-surface-variant text-sm mt-1">
                  {t("auth.welcomeBack.subtitle")}
                </p>
                <div className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-xs text-on-surface-variant">
                  <p className="font-bold text-on-surface">{t("auth.adminPreset")}</p>
                  <p className="mt-1">
                    Email: <span className="font-mono text-on-surface">{ADMIN_EMAIL}</span>
                    {" • "}
                    Password: <span className="font-mono text-on-surface">{ADMIN_PASSWORD}</span>
                  </p>
                </div>
              </div>
              <form className="space-y-6" onSubmit={onLoginSubmit}>
                <div className="space-y-4">
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="login-email"
                    >
                      {t("auth.email")}
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="login-email"
                      placeholder="name@company.com"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label
                        className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1"
                        htmlFor="login-password"
                      >
                        {t("auth.password")}
                      </label>
                      <Link
                        className="text-xs font-semibold text-primary hover:underline"
                        href="#"
                      >
                        {t("auth.forgotPassword")}
                      </Link>
                    </div>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="login-password"
                      placeholder="••••••••"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>
                {loginError ? (
                  <div className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
                    {loginError}
                  </div>
                ) : null}
                {googleError ? (
                  <div className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
                    {googleError}
                  </div>
                ) : null}
                <button
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading ? t("auth.signingIn") : t("auth.signIn")}
                </button>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-tighter">
                    {t("auth.orContinueWith")}
                  </span>
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                </div>
                <button
                  className="w-full py-4 flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-semibold rounded-xl hover:bg-surface-container-low active:scale-[0.98] transition-all"
                  type="button"
                  onClick={onGoogleClick}
                  disabled={googleLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  {googleLoading ? t("auth.signingInWithGoogle") : t("auth.loginWithGoogle")}
                </button>
              </form>
            </div>
          )}

          {/* Sign Up Form Section */}
          {!isLogin && (
            <div
              className="space-y-8 animate-in fade-in"
              id="signup-section"
            >
              <div>
                <h3 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                  {t("auth.createAccount")}
                </h3>
                <p className="text-on-surface-variant text-sm mt-1">
                  {t("auth.createAccount.subtitle")}
                </p>
              </div>
              <form className="space-y-6" onSubmit={onSignupSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-name"
                    >
                      {t("auth.fullName")}
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="signup-name"
                      placeholder="John Doe"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                    />
                  </div>
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-email"
                    >
                      {t("auth.email")}
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="signup-email"
                      placeholder="name@company.com"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-dob"
                    >
                      {t("auth.dateOfBirth")}
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="signup-dob"
                      type="date"
                      value={signupDob}
                      onChange={(e) => setSignupDob(e.target.value)}
                    />
                  </div>
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-type"
                    >
                      {t("auth.userType")}
                    </label>
                    <select
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none appearance-none cursor-pointer"
                      id="signup-type"
                      value={signupType}
                      onChange={(e) => setSignupType(e.target.value)}
                    >
                      <option disabled value="">
                        {t("auth.userType.placeholder")}
                      </option>
                      <option value="student">{t("auth.userType.student")}</option>
                      <option value="candidate">{t("auth.userType.candidate")}</option>
                      <option value="employed">{t("auth.userType.employed")}</option>
                    </select>
                  </div>
                </div>

                <div className="group">
                  <label
                    className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                    htmlFor="signup-password"
                  >
                    {t("auth.password")}
                  </label>
                  <input
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                    id="signup-password"
                    placeholder={t("auth.passwordHint")}
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                {signupError ? (
                  <div className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
                    {signupError}
                  </div>
                ) : null}
                <button
                  className="w-full py-4 bg-tertiary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-tertiary/10"
                  type="submit"
                  disabled={signupLoading}
                >
                  {signupLoading ? "Signing Up..." : t("auth.createAccount.cta")}
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-tighter">
                    {t("auth.orContinueWith")}
                  </span>
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                </div>
                {googleError ? (
                  <div className="rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm text-error">
                    {googleError}
                  </div>
                ) : null}

                <button
                  className="w-full py-4 flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-semibold rounded-xl hover:bg-surface-container-low active:scale-[0.98] transition-all"
                  type="button"
                  onClick={onGoogleClick}
                  disabled={googleLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  {googleLoading ? t("auth.signingInWithGoogle") : t("auth.signUpWithGoogle")}
                </button>
              </form>
            </div>
          )}

          {/* Subtle Help Footer */}
          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              {t("auth.byContinuing")}{" "}
              <Link
                href="#"
                className="text-primary font-semibold hover:underline"
              >
                {t("footer.terms")}
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="text-primary font-semibold hover:underline"
              >
                {t("footer.privacy")}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Floating Branding Anchor (Mobile Only) */}
      <div className="md:hidden fixed top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 overflow-hidden rounded-lg flex items-center justify-center">
            <img src="/logo.jpg" alt="INTERVIA Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-headline font-black text-primary text-2xl tracking-tighter">
            INTERVIA
          </h1>
        </Link>
      </div>
    </div>
  );
}
