import Link from "next/link";

type InterviewPageProps = {
  searchParams?:
    | { mode?: string | string[] }
    | Promise<{ mode?: string | string[] }>;
};

export default async function InterviewPage({ searchParams }: InterviewPageProps) {
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;
  const modeParam = resolvedSearchParams?.mode;
  const mode = Array.isArray(modeParam) ? modeParam[0] : modeParam;
  const isVoiceMode = mode === "voice";

  if (isVoiceMode) {
    return (
      <div className="min-h-screen overflow-hidden bg-surface font-body text-on-surface">
        <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-surface px-12 py-4">
          <div className="flex items-center gap-8">
            <div className="font-headline text-2xl font-black tracking-tighter text-on-surface">
              Curator AI
            </div>
            <div className="hidden items-center gap-6 font-headline text-lg font-bold tracking-tight md:flex">
              <Link className="text-on-surface-variant transition-colors hover:text-on-surface" href="/interview">
                Interview Mode
              </Link>
              <span className="cursor-default border-b-2 border-primary pb-1 text-primary">
                Live Transcription
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-1.5 text-sm font-medium">
              <span className="text-primary">EN</span>
              <span className="text-outline-variant">|</span>
              <span className="cursor-pointer text-on-surface-variant hover:text-on-surface">
                VN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="rounded-full p-2 transition-colors duration-200 hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-on-surface-variant">
                  language
                </span>
              </button>
              <button className="rounded-full p-2 transition-colors duration-200 hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-on-surface-variant">
                  settings
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex h-[calc(100vh-80px)] overflow-hidden">
          <aside className="hidden h-full w-64 flex-col space-y-8 bg-surface-container-low p-6 lg:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <div>
                <p className="font-headline text-sm font-extrabold leading-tight text-on-surface">
                  Admin Console
                </p>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                  AI Data Management
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link
                className="flex items-center gap-3 rounded-md bg-surface-container-lowest px-4 py-3 font-semibold text-primary shadow-sm"
                href="/interview?mode=voice"
              >
                <span className="material-symbols-outlined">forum</span>
                <span className="text-sm">Interviews</span>
              </Link>
              <Link
                className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
                href="#"
              >
                <span className="material-symbols-outlined">school</span>
                <span className="text-sm">Practice</span>
              </Link>
              <Link
                className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
                href="#"
              >
                <span className="material-symbols-outlined">person</span>
                <span className="text-sm">My Profile</span>
              </Link>
            </nav>

            <div className="mt-auto space-y-1">
              <Link
                className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
                href="#"
              >
                <span className="material-symbols-outlined">help</span>
                <span className="text-sm">Help Center</span>
              </Link>
              <Link
                className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
                href="#"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm">Logout</span>
              </Link>
            </div>
          </aside>

          <section className="relative flex flex-1 flex-col items-center justify-center bg-surface p-12">
            <div className="absolute left-1/2 top-12 flex -translate-x-1/2 items-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-lowest px-4 py-2 shadow-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Live Analysis Active
              </span>
            </div>

            <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-16 md:flex-row md:gap-32">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="pulse-ring absolute inset-0 rounded-full" />
                  <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-tertiary bg-surface-container-lowest p-2 shadow-xl">
                    <img
                      alt="AI Interface Avatar"
                      className="h-full w-full rounded-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBT1OJxkN4jhmiirUeotFmDNYxe41UMT-PY6jn6UHavh1vv-QcjG6YEKbCS0BcZy2-waToX3HVPFwhOp0QXKET8DHLvl264lcDQ-2D_DqvzrrkEcWbn8GSIPEPJZB2H8sDShYtwJQYSgLnfAr9Jh7kiZFdLJeM1lQEip5DM-UYO96_iA9ox4gY4pugfNgqfzm6uhH1NQq_u6M-OfBXibZu7ZGKRI8pXIzbmfBg6LtQvVr6xpjkGhkg3bLOfHHorkERU-JQbZltFlnZ"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-tertiary px-4 py-1 text-[10px] font-bold uppercase tracking-tighter text-white shadow-lg">
                    AI INTERVIEWER
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="h-48 w-48 overflow-hidden rounded-full border-4 border-outline-variant/20 bg-surface-container-lowest p-2">
                    <img
                      alt="User Avatar"
                      className="h-full w-full rounded-full object-cover grayscale opacity-80"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZrjf3NFMaaHwd5FpSVTRCGxi2yZP5UmkvDl7xXUe6Qh3J4VRIl7nwRBVS771uilhYMUFB2DLhjAmIynR71a5D2Pc3sSSUdH6fGoh48eOEZHVsFq-rlfASpdZZ0D8yJPAIxeVkqOil4f_Lzwwn4pxxwqkj12KS6DUifzKBQvXUgQjhb69Y1YaqlNcncLoM8i-kyB7qcazAVeTixzvTUFyPJGdEIctuXZj5hdnIN2BP4yPAftHmEFUbPhwc3y2yOkg_fyWIFOeWz7zc"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-surface-container-highest px-4 py-1 text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                    CANDIDATE
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 flex h-12 items-center gap-1.5">
              <div className="h-4 w-1 rounded-full bg-tertiary/20" />
              <div className="h-8 w-1 rounded-full bg-tertiary/40" />
              <div className="h-12 w-1 rounded-full bg-tertiary/60" />
              <div className="h-10 w-1 rounded-full bg-tertiary/80" />
              <div className="h-14 w-1 rounded-full bg-tertiary" />
              <div className="h-10 w-1 rounded-full bg-tertiary/80" />
              <div className="h-12 w-1 rounded-full bg-tertiary/60" />
              <div className="h-8 w-1 rounded-full bg-tertiary/40" />
              <div className="h-4 w-1 rounded-full bg-tertiary/20" />
            </div>
          </section>

          <aside className="flex w-[400px] flex-col border-l border-outline-variant/10 bg-surface-container-low">
            <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest/70 p-6">
              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  Voice Call Interview
                </span>
                <h2 className="font-headline text-xl font-bold text-on-surface">Live Transcript</h2>
              </div>
              <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                Real-time
              </span>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-tertiary">Curator AI</span>
                  <span className="text-[10px] text-on-surface-variant">10:42 AM</span>
                </div>
                <div className="rounded-xl rounded-tl-none bg-tertiary-fixed p-4 text-sm font-medium leading-relaxed text-on-tertiary-fixed">
                  Welcome to your senior developer interview. To start, could you describe a complex architectural challenge you recently solved?
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[10px] text-on-surface-variant">10:43 AM</span>
                  <span className="text-[10px] font-bold uppercase text-primary">You</span>
                </div>
                <div className="rounded-xl rounded-tr-none border border-outline-variant/10 bg-surface-container-lowest p-4 text-sm leading-relaxed text-on-surface shadow-sm">
                  Certainly. In my last project, we were migrating a monolithic system to microservices while maintaining 99.9% uptime. I spearheaded the transition...
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-tertiary">Curator AI</span>
                  <span className="text-[10px] italic text-on-surface-variant">Transcribing...</span>
                </div>
                <div className="rounded-xl rounded-tl-none bg-tertiary-fixed/60 p-4 text-sm font-medium leading-relaxed text-on-tertiary-fixed">
                  That is an impressive scale. How did you manage the data consistency across those services during the transition phase?
                </div>
              </div>
            </div>

            <div className="bg-surface-container p-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
                Confidence Score: 98.4%
              </p>
            </div>
          </aside>
        </main>

        <nav className="fixed bottom-8 left-1/2 z-50 flex w-fit min-w-[320px] -translate-x-1/2 items-center justify-around gap-6 rounded-full border border-outline-variant/20 bg-tertiary-container/85 px-8 py-3 shadow-[0_40px_60px_rgba(25,28,30,0.04)] backdrop-blur-xl">
          <button className="group flex flex-col items-center gap-1 p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mic
            </span>
            <span className="text-[10px] uppercase tracking-widest">Mic</span>
          </button>
          <button className="group flex flex-col items-center gap-1 rounded-full bg-white/20 p-3 text-white transition-transform hover:scale-110 active:scale-90">
            <span className="material-symbols-outlined">videocam</span>
            <span className="text-[10px] uppercase tracking-widest">Video</span>
          </button>
          <button className="group flex flex-col items-center gap-1 p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90">
            <span className="material-symbols-outlined">history</span>
            <span className="text-[10px] uppercase tracking-widest">History</span>
          </button>
          <div className="mx-2 h-8 w-px bg-white/20" />
          <button className="group flex flex-col items-center gap-1 rounded-full bg-error p-3 text-white transition-all hover:scale-110 hover:bg-red-600 active:scale-90">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              call_end
            </span>
            <span className="text-[10px] uppercase tracking-widest">End</span>
          </button>
        </nav>

        <footer className="fixed bottom-0 left-0 hidden w-full border-t border-outline-variant/20 bg-surface py-3 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-12 text-xs text-on-surface-variant">
            <p>© 2024 Curator AI Platform. Editorial Intelligence for HR.</p>
            <div className="flex gap-6">
              <Link className="transition-colors hover:underline" href="#">
                Privacy Policy
              </Link>
              <Link className="transition-colors hover:underline" href="#">
                Security
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-surface-container-low font-body text-sm font-medium">
        <div className="flex h-full flex-col space-y-8 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-lg bg-primary shadow-sm">
              <img
                alt="Admin Console"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0oSE0vHeDts6CQvF86e8WW6HQ1CGPFOEyqMaaBpYWfltXuArjpxZRG0rVQho7RsNhOTgQpoAYzhqWUS3F4jy-qzTHeV5qJMxlv9eMBGjML9Fx4V8802sPaqfUk0r6GwzKDIP92C0xjJJKGHFmVC2QGPMQJXSTt8RUqGGRZVzIPZ69k1EgfTh_1z2imqedsVjJ-xe8tTSLC_Yk0kc6e-_DMSBovOxUWT40kZed1LzDRMsMRVDbZPh0lKy-lZ8E41f92LQs4IOec0-q"
              />
            </div>
            <div>
              <h1 className="font-headline font-extrabold leading-tight text-on-surface">
                Admin Console
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                AI Data Management
              </p>
            </div>
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary-container active:scale-95">
            <span className="material-symbols-outlined text-sm">add</span>
            New Interview
          </button>

          <nav className="flex-1 space-y-2">
            <div className="mb-4 px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Main Menu
            </div>
            <Link
              className="group flex items-center gap-3 px-3 py-2.5 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="#"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md bg-surface-container-lowest px-3 py-2.5 font-semibold text-primary shadow-sm"
              href="/interview"
            >
              <span className="material-symbols-outlined">forum</span>
              <span>Interviews</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="#"
            >
              <span className="material-symbols-outlined">school</span>
              <span>Practice</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="#"
            >
              <span className="material-symbols-outlined">person</span>
              <span>My Profile</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant"
              href="#"
            >
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </Link>
          </nav>

          <div className="space-y-2 border-t border-outline-variant/20 pt-6">
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant transition-all hover:bg-surface-variant"
              href="#"
            >
              <span className="material-symbols-outlined">help</span>
              <span>Help Center</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-on-surface-variant transition-all hover:bg-error-container/20 hover:text-error"
              href="#"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex h-full flex-1 flex-col bg-surface">
        <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-surface px-12 py-4">
          <div className="flex items-center gap-8">
            <span className="font-headline text-2xl font-black tracking-tighter text-on-surface">
              Curator AI
            </span>
            <div className="hidden items-center gap-6 font-headline text-lg font-bold tracking-tight md:flex">
              <span className="cursor-default border-b-2 border-primary pb-1 text-primary">
                Interview Mode
              </span>
              <Link className="cursor-pointer text-on-surface-variant transition-colors hover:text-on-surface" href="/interview?mode=voice">
                Live Transcription
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg bg-surface-container p-1">
              <button className="rounded-md bg-surface-container-lowest px-3 py-1 text-xs font-bold text-primary shadow-sm">
                EN
              </button>
              <button className="rounded-md px-3 py-1 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high">
                VN
              </button>
            </div>
            <button className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-on-surface-variant transition-all hover:bg-surface-container-low active:scale-95">
              <span className="material-symbols-outlined text-[20px]">language</span>
            </button>
            <button className="rounded-xl border-2 border-error/20 px-6 py-2 font-bold text-error transition-all hover:bg-error-container/30 active:scale-95">
              Exit Interview
            </button>
          </div>
        </header>

        <section className="mx-auto w-full max-w-5xl flex-1 space-y-12 overflow-y-auto px-12 py-10">
          <div className="flex max-w-[85%] gap-6">
            <div className="flex-shrink-0">
              <div className="ai-gradient-bg flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg">
                <span
                  className="material-symbols-outlined text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <span className="font-headline text-lg font-bold">Curator AI</span>
                <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
                  Interviewer
                </span>
              </div>
              <div className="rounded-bl-3xl rounded-br-3xl rounded-tr-3xl border-l-4 border-primary/20 bg-surface-container-low p-6 text-lg leading-relaxed text-on-surface">
                Welcome to the senior product design interview. To start, could you describe a time you had to pivot a product strategy based on user data? What was the catalyst, and how did you manage the transition?
              </div>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span>10:42 AM</span>
                <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-primary">
                  <span className="material-symbols-outlined text-sm">volume_up</span>
                  <span>Listen</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex max-w-[85%] flex-row-reverse gap-6">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-primary/10">
                <img
                  alt="User Profile"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuANxLApOHiowhCsioppvGgOxOSILLf4zYRMsffPPCl4hkxCPz9RPnPvOho6bVVoWFvtoiH9KvrMS8pzEBjmq0wFMAjHqUAd-EkN05TTwGQ_dlWJGRjuesDHFfSd5iqLZSFbd5UAD56n36FgAZsp0wlXjHmSvyyJOdiuXQRAibdi_CTrdBc8nh1cwjmXH812AfEj9a_Vcgx29noqRFGxVHF7SrSeqvehmlobibXUTmHazzv5cdQxLQHR0ZzQJ1ZeiKVolMfG4jlymYWQ"
                />
              </div>
            </div>
            <div className="space-y-3 pt-1 text-right">
              <div className="flex items-center justify-end gap-3">
                <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Candidate
                </span>
                <span className="font-headline text-lg font-bold">Alex Chen</span>
              </div>
              <div className="rounded-bl-3xl rounded-br-3xl rounded-tl-3xl bg-primary p-6 text-lg leading-relaxed text-white shadow-sm">
                Great question. At my last role, we were building a social discovery app. The initial data showed that while users were signing up, they were not completing the onboarding. We realized the flow was too friction-heavy...
              </div>
              <span className="block text-xs text-on-surface-variant">10:45 AM • Delivered</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container">
              <div className="h-3 w-3 animate-pulse rounded-full bg-tertiary" />
            </div>
            <div className="animate-pulse italic text-on-surface-variant">
              Curator is analyzing your response...
            </div>
          </div>
        </section>

        <footer className="bg-surface-bright/50 p-8 backdrop-blur-md">
          <div className="group relative mx-auto w-full max-w-5xl">
            <div className="absolute -top-12 left-0 flex items-center gap-3 rounded-t-xl border-x border-t border-outline-variant/10 bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-tertiary">mic</span>
              AI is currently listening for voice input
            </div>

            <div className="flex items-end gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-2 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-surface-tint/20">
              <textarea
                className="min-h-[100px] flex-1 resize-none border-none bg-transparent p-4 text-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0"
                placeholder="Type your answer here..."
              />
              <div className="flex flex-col gap-2 p-2">
                <button className="group flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary-container active:scale-90">
                  <span className="material-symbols-outlined text-[28px] transition-transform group-hover:translate-x-0.5">
                    send
                  </span>
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition-all hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-[24px]">mic</span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <div className="flex gap-6">
                <span>Press Enter to send</span>
                <span>Shift + Enter for new line</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Secure &amp; Private Interview
              </div>
            </div>
          </div>
        </footer>
      </main>

      <nav className="fixed bottom-8 left-1/2 z-50 flex w-fit min-w-[320px] -translate-x-1/2 items-center justify-around gap-6 rounded-full border border-outline-variant/20 bg-tertiary-container/85 px-8 py-3 shadow-[0_40px_60px_rgba(25,28,30,0.04)] backdrop-blur-xl md:hidden">
        <Link className="p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90" href="#">
          <span className="material-symbols-outlined">mic</span>
        </Link>
        <Link className="p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90" href="#">
          <span className="material-symbols-outlined">videocam</span>
        </Link>
        <Link className="p-3 text-white/70 transition-transform hover:scale-110 hover:text-white active:scale-90" href="#">
          <span className="material-symbols-outlined">history</span>
        </Link>
        <Link className="rounded-full bg-white/20 p-3 text-white transition-transform hover:scale-110 active:scale-90" href="#">
          <span className="material-symbols-outlined">call_end</span>
        </Link>
      </nav>
    </div>
  );
}
