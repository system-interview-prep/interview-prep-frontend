"use client";

import Link from "next/link";

export default function Authentication({ defaultMode = "login" }: { defaultMode?: "login" | "signup" }) {
  const isLogin = defaultMode === "login";

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
          <Link href="/">
            <h1 className="font-headline font-black text-white text-4xl tracking-tighter">
              Curator AI
            </h1>
          </Link>
          <p className="text-on-primary-container/80 mt-2 font-medium tracking-wide">
            Editorial Intelligence for HR.
          </p>
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <span className="inline-block w-12 h-1 bg-tertiary-fixed mb-6"></span>
            <h2 className="font-headline font-extrabold text-white text-5xl leading-tight tracking-tight">
              Transforming <br />
              the talent <br />
              landscape.
            </h2>
            <p className="text-white/70 mt-6 text-lg leading-relaxed">
              Join the next generation of recruitment. Our AI-driven platform
              helps you identify, curate, and hire the world's best talent with
              editorial precision.
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
              <p className="text-white font-bold text-sm">AI Insights</p>
              <p className="text-white/60 text-xs mt-1">
                Deep behavioral analysis
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-outline-variant/10">
              <span
                className="material-symbols-outlined text-white mb-3"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                database
              </span>
              <p className="text-white font-bold text-sm">Smart Curation</p>
              <p className="text-white/60 text-xs mt-1">Dynamic talent pools</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          © 2024 Curator AI Platform. All rights reserved.
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
              Login
            </Link>
            <Link
              href="/signup"
              className={`pb-4 font-headline text-lg tracking-tight ${
                !isLogin
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-on-surface-variant font-medium hover:text-on-surface transition-colors"
              }`}
            >
              Sign Up
            </Link>
          </div>

          {/* Login Form Section */}
          {isLogin && (
            <div className="space-y-8 animate-in fade-in" id="login-section">
              <div>
                <h3 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                  Welcome back
                </h3>
                <p className="text-on-surface-variant text-sm mt-1">
                  Please enter your details to sign in to your account.
                </p>
              </div>
              <form className="space-y-6">
                <div className="space-y-4">
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="login-email"
                    >
                      Email
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="login-email"
                      placeholder="name@company.com"
                      type="email"
                    />
                  </div>
                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label
                        className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1"
                        htmlFor="login-password"
                      >
                        Password
                      </label>
                      <Link
                        className="text-xs font-semibold text-primary hover:underline"
                        href="#"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="login-password"
                      placeholder="••••••••"
                      type="password"
                    />
                  </div>
                </div>
                <button
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
                  type="submit"
                >
                  Sign In
                </button>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-tighter">
                    or continue with
                  </span>
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                </div>
                <button
                  className="w-full py-4 flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-semibold rounded-xl hover:bg-surface-container-low active:scale-[0.98] transition-all"
                  type="button"
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
                  Login with Google
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
                  Create an account
                </h3>
                <p className="text-on-surface-variant text-sm mt-1">
                  Start your journey with Curator AI intelligence.
                </p>
              </div>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-name"
                    >
                      Full Name
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="signup-name"
                      placeholder="John Doe"
                      type="text"
                    />
                  </div>
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-email"
                    >
                      Email
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="signup-email"
                      placeholder="name@company.com"
                      type="email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-dob"
                    >
                      Date of Birth
                    </label>
                    <input
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                      id="signup-dob"
                      type="date"
                    />
                  </div>
                  <div className="group">
                    <label
                      className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                      htmlFor="signup-type"
                    >
                      User Type
                    </label>
                    <select
                      className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none appearance-none cursor-pointer"
                      id="signup-type"
                      defaultValue=""
                    >
                      <option disabled value="">
                        Select type...
                      </option>
                      <option value="student">Student</option>
                      <option value="candidate">Candidate</option>
                      <option value="employed">Employed</option>
                    </select>
                  </div>
                </div>

                <div className="group">
                  <label
                    className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1"
                    htmlFor="signup-password"
                  >
                    Password
                  </label>
                  <input
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint focus:bg-surface-container-lowest transition-all outline-none"
                    id="signup-password"
                    placeholder="Minimum 8 characters"
                    type="password"
                  />
                </div>
                <button
                  className="w-full py-4 bg-tertiary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-tertiary/10"
                  type="submit"
                >
                  Create Account
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-tighter">
                    or continue with
                  </span>
                  <div className="flex-grow border-t border-outline-variant/30"></div>
                </div>

                <button
                  className="w-full py-4 flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-semibold rounded-xl hover:bg-surface-container-low active:scale-[0.98] transition-all"
                  type="button"
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
                  Sign up with Google
                </button>
              </form>
            </div>
          )}

          {/* Subtle Help Footer */}
          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              By continuing, you agree to our{" "}
              <Link
                href="#"
                className="text-primary font-semibold hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="text-primary font-semibold hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Floating Branding Anchor (Mobile Only) */}
      <div className="md:hidden fixed top-6 left-6 z-50">
        <Link href="/">
          <h1 className="font-headline font-black text-primary text-2xl tracking-tighter">
            Curator AI
          </h1>
        </Link>
      </div>
    </div>
  );
}
