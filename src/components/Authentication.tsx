"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useGoogleLogin } from "@react-oauth/google";
import { readAuthProfile, writeAuthProfile } from "../auth/authProfile";
import { authApi, type AuthResponse } from "../services/api";

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
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.59 6.59 0 0 1-9.87-3.47H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09A6.5 6.5 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.95 10.95 0 0 0 2.18 7.07l3.66 2.84A6.58 6.58 0 0 1 12 5.38Z" fill="#EA4335"/>
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

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

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
    writeAuthProfile({ email: data.user.email, name: data.user.name, picture });
    const admin = data.user.role === "ADMIN";
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
    if (mode === "signup" && !name.trim()) errors.name = "Vui lòng nhập họ và tên.";
    if (!email.trim()) errors.email = "Vui lòng nhập email.";
    if (!password) errors.password = "Vui lòng nhập mật khẩu.";
    if (mode === "signup" && !(password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password))) errors.password = "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.";
    if (mode === "signup" && !agreed) errors.agreed = "Bạn cần đồng ý với điều khoản và cam kết bảo mật.";
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
      setFormErrors({ form: errorMessage(error, mode === "login" ? "Đăng nhập thất bại." : "Không thể tạo tài khoản.") });
    } finally {
      setLoading(false);
    }
  }

  const strengthColor = passwordStrength <= 1 ? "bg-[#D32F2F]" : passwordStrength <= 3 ? "bg-[#FCB625]" : "bg-[#2E7D32]";
  const strengthLabel = passwordStrength <= 1 ? "Yếu" : passwordStrength <= 3 ? "Tốt" : "Mạnh";

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white text-[#234196] font-sans lg:grid-cols-12">
      {/* CỘT TRÁI: BẰNG CHỨNG GIÁ TRỊ & CAM KẾT BẢO MẬT */}
      <section className="relative flex flex-col justify-between overflow-hidden border-b-2 border-[#234196] bg-[#F0F4FC] p-7 sm:p-10 lg:col-span-5 lg:border-b-0 lg:border-r-2 lg:p-12 xl:p-16">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2.5 font-serif text-2xl font-bold tracking-tight text-[#234196]">
            <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#234196] bg-[#FCB625] shadow-[2px_2px_0_#234196]">
              <Sparkles size={18} className="text-[#234196]" />
            </span>
            Career · Studio
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#5A6B8F] hover:text-[#234196] transition-colors">
            <ArrowLeft size={14} /> Trang chủ
          </Link>
        </div>

        <div className="my-10 lg:my-8">
          <span className="inline-flex items-center gap-1.5 -rotate-2 rounded-lg border-2 border-[#234196] bg-[#FCB625] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#234196] shadow-[2px_2px_0_#234196]">
            <Sparkles size={14} /> Gia nhập 15.000+ ứng viên đã tối ưu CV
          </span>
          <h1 className="mt-6 max-w-2xl font-serif text-3xl font-extrabold leading-[1.1] tracking-normal text-[#234196] sm:text-4xl xl:text-5xl">
            Rèn luyện phản xạ phỏng vấn thực chất và mở khóa tiềm năng nghề nghiệp.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5A6B8F]">
            Không chiêu trò qua mặt, không mẹo rập khuôn. Chỉ có sự chuẩn bị kỹ lưỡng và năng lực thật được thể hiện đúng cách.
          </p>

          <article className="relative my-7 rounded-2xl border-2 border-[#234196] bg-white p-5 shadow-[5px_5px_0_#234196] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="inline-flex -rotate-1 rounded-md border-2 border-[#234196] bg-[#FEF9EE] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#234196]">
                Senior Data Analyst
              </span>
              <span className="inline-flex rotate-1 rounded-md border-2 border-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#2E7D32]">
                88% Đạt chuẩn ATS
              </span>
            </div>
            <blockquote className="mt-5 font-serif text-lg leading-relaxed text-[#234196]">
              “Hệ thống chỉ ra đúng 3 lỗ hổng số liệu trong CV. Sau 2 buổi mock voice, mình tự tin hơn hẳn và đã pass offer tại Tech Corp.”
            </blockquote>
            <p className="mt-4 font-mono text-[11px] font-bold text-[#5A6B8F]">
              Minh Trang · Chuyển việc thành công sau 3 tuần
            </p>
          </article>

          <div className="flex flex-wrap gap-2">
            {[
              "100% Bảo mật CV",
              "Không lưu file ghi âm",
              "Không cần thẻ tín dụng"
            ].map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1 rounded-lg border-2 border-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 font-mono text-[11px] font-bold text-[#2E7D32] shadow-[2px_2px_0_#2E7D32]">
                <Check size={13} /> {badge}
              </span>
            ))}
          </div>
        </div>

        <p className="font-mono text-xs text-[#5A6B8F]">© 2026 Intervia · Luyện thật, tiến xa</p>
      </section>

      {/* CỘT PHẢI: FORM XÁC THỰC TỐI GIẢN */}
      <section className="flex items-center justify-center bg-white p-6 sm:p-10 lg:col-span-7 lg:p-12 xl:p-16">
        <div className="w-full max-w-[440px]">
          {/* TAB CHUYỂN ĐỔI CHẾ ĐỘ DẬP NỔI */}
          <div className="mb-8 flex w-full gap-1 rounded-xl border-2 border-[#234196] bg-[#FEF9EE] p-1 shadow-[3px_3px_0_#234196]" role="tablist" aria-label="Chế độ xác thực">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                mode === "login"
                  ? "border-2 border-[#234196] bg-[#FCB625] text-[#234196] shadow-[2px_2px_0_#234196]"
                  : "border-2 border-transparent text-[#5A6B8F] hover:text-[#234196]"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                mode === "signup"
                  ? "border-2 border-[#234196] bg-[#FCB625] text-[#234196] shadow-[2px_2px_0_#234196]"
                  : "border-2 border-transparent text-[#5A6B8F] hover:text-[#234196]"
              }`}
            >
              Tạo tài khoản
            </button>
          </div>

          <h2 className="font-serif text-3xl font-extrabold tracking-normal text-[#234196] sm:text-4xl">
            {mode === "login" ? "Chào mừng bạn trở lại." : "Bắt đầu chiến dịch mới."}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6B8F]">
            {mode === "login" ? "Không gian luyện tập của bạn đang sẵn sàng." : "Nhận 3 lượt quét CV đối soát miễn phí, không cần thẻ."}
          </p>

          {/* NÚT GOOGLE CHUNKY ĐÃ FIX TOÀN DIỆN */}
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={googleLoading || loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#234196] bg-white py-3.5 px-4 font-bold text-[#234196] shadow-[3px_3px_0_#234196] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#F0F4FC] hover:shadow-[4px_4px_0_#234196] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? <LoaderCircle className="animate-spin text-[#FCB625]" size={20} /> : <GoogleMark />}
            <span>{mode === "login" ? "Tiếp tục với Google" : "Đăng ký nhanh với Google"}</span>
          </button>

          <div className="relative my-7 flex items-center">
            <span className="w-full border-t-2 border-dashed border-[#234196]/30" />
            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-[#234196]/20 bg-white px-3 py-0.5 font-mono text-[11px] font-bold text-[#5A6B8F]">
              hoặc dùng email
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-[#234196]">Họ và tên</span>
                  <span className="relative block">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B8F]" size={18} />
                    <input
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-xl border-2 border-[#234196] bg-white py-3 pl-11 pr-4 text-sm font-medium text-[#234196] placeholder:text-[#5A6B8F]/70 focus:outline-none focus:shadow-[4px_4px_0_#234196] transition-all"
                      placeholder="Nguyễn Minh Anh"
                      aria-invalid={Boolean(formErrors.name)}
                    />
                  </span>
                  {formErrors.name && <span className="mt-1 block text-xs font-bold text-[#D32F2F]">{formErrors.name}</span>}
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-[#234196]">Email công việc hoặc cá nhân</span>
                <span className="relative block">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B8F]" size={18} />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border-2 border-[#234196] bg-white py-3 pl-11 pr-4 text-sm font-medium text-[#234196] placeholder:text-[#5A6B8F]/70 focus:outline-none focus:shadow-[4px_4px_0_#234196] transition-all"
                    placeholder="ban@congty.com"
                    aria-invalid={Boolean(formErrors.email)}
                  />
                </span>
                {formErrors.email && <span className="mt-1 block text-xs font-bold text-[#D32F2F]">{formErrors.email}</span>}
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-bold text-[#234196]">
                  <span>Mật khẩu</span>
                  {mode === "login" && (
                    <Link href="#" className="text-xs font-semibold text-[#234196] underline decoration-[#FCB625] decoration-2 underline-offset-4 hover:text-[#D97757]">
                      Quên mật khẩu?
                    </Link>
                  )}
                </span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B8F]" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border-2 border-[#234196] bg-white py-3 pl-11 pr-12 text-sm font-medium text-[#234196] placeholder:text-[#5A6B8F]/70 focus:outline-none focus:shadow-[4px_4px_0_#234196] transition-all"
                    placeholder="••••••••"
                    aria-invalid={Boolean(formErrors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#5A6B8F] hover:bg-[#F0F4FC] hover:text-[#234196] transition-colors"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
                {formErrors.password && <span className="mt-1 block text-xs font-bold text-[#D32F2F]">{formErrors.password}</span>}
              </label>

              {mode === "signup" && (
                <div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((segment) => (
                      <span
                        key={segment}
                        className={`h-2 flex-1 rounded-full border border-[#234196] transition-all ${
                          segment <= passwordStrength ? strengthColor : "bg-white"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] font-bold text-[#5A6B8F]">Độ mạnh mật khẩu: {strengthLabel}</p>
                </div>
              )}

              {mode === "signup" && (
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#5A6B8F]">
                  <div className="relative flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                      className="peer h-5 w-5 appearance-none rounded-md border-2 border-[#234196] bg-white checked:bg-[#FCB625] transition-all cursor-pointer"
                    />
                    <Check
                      size={14}
                      className="pointer-events-none absolute left-0.5 top-1 text-[#234196] opacity-0 peer-checked:opacity-100 transition-opacity"
                    />
                  </div>
                  <span>
                    Tôi đồng ý với{" "}
                    <Link href="#" className="font-bold text-[#234196] underline decoration-1 underline-offset-2">
                      Điều khoản Dịch vụ
                    </Link>{" "}
                    và Cam kết Bảo mật Dữ liệu Tuyển dụng.
                  </span>
                </label>
              )}

              {formErrors.agreed && <p className="text-xs font-bold text-[#D32F2F]">{formErrors.agreed}</p>}
              {formErrors.form && (
                <div className="rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-xs font-bold text-[#D32F2F]" role="alert">
                  {formErrors.form}
                </div>
              )}
            </div>

            {/* NÚT SUBMIT CHUNKY ĐÃ ĐƯỢC TỐI ƯU RESPONSIVE */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#234196] bg-[#FCB625] py-3.5 px-4 font-serif text-base font-bold text-[#234196] shadow-[4px_4px_0_#234196] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#234196] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <LoaderCircle size={20} className="animate-spin text-[#234196]" />
                  <span>Đang mở không gian…</span>
                </>
              ) : mode === "login" ? (
                <>
                  <span>Đăng Nhập Vào Không Gian Làm Việc</span>
                  <Sparkles size={16} />
                </>
              ) : (
                <>
                  <span>Tạo Tài Khoản & Nhận 3 Lượt Quét</span>
                  <Sparkles size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-[#5A6B8F]">
            <ShieldCheck size={16} className="shrink-0 text-[#2E7D32]" />
            <span>Mã hóa SSL 256-bit chuẩn ngân hàng. Dữ liệu CV của bạn chỉ thuộc về bạn.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
