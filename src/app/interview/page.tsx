import Link from "next/link";

export default function InterviewPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-surface-container-low md:flex">
        <div className="flex h-full flex-col space-y-8 p-6 text-sm font-medium">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-lg bg-primary shadow-sm">
              <img
                alt="Admin Console"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0oSE0vHeDts6CQvF86e8WW6HQ1CGPFOEyqMaaBpYWfltXuArjpxZRG0rVQho7RsNhOTgQpoAYzhqWUS3F4jy-qzTHeV5qJMxlv9eMBGjML9Fx4V8802sPaqfUk0r6GwzKDIP92C0xjJJKGHFmVC2QGPMQJXSTt8RUqGGRZVzIPZ69k1EgfTh_1z2imqedsVjJ-xe8tTSLC_Yk0kc6e-_DMSBovOxUWT40kZed1LzDRMsMRVDbZPh0lKy-lZ8E41f92LQs4IOec0-q"
              />
            </div>
            <div>
              <h1 className="font-headline text-base font-extrabold leading-tight text-on-surface">
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
              href="/admin"
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

      <main className="ml-0 flex h-full flex-1 flex-col bg-surface md:ml-64">
        <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-surface px-6 py-4 md:px-12">
          <div className="flex items-center gap-8">
            <span className="font-headline text-2xl font-black tracking-tighter text-on-surface">
              Curator AI
            </span>
            <div className="hidden items-center gap-6 font-headline text-lg font-bold tracking-tight md:flex">
              <span className="cursor-default border-b-2 border-primary pb-1 text-primary">
                Interview Mode
              </span>
              <span className="cursor-pointer text-on-surface-variant transition-colors hover:text-on-surface">
                Live Transcription
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden items-center rounded-lg bg-surface-container p-1 sm:flex">
              <button className="rounded-md bg-surface-container-lowest px-3 py-1 text-xs font-bold text-primary shadow-sm">
                EN
              </button>
              <button className="rounded-md px-3 py-1 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high">
                VN
              </button>
            </div>
            <button className="rounded-lg p-2 font-semibold text-on-surface-variant transition-all hover:bg-surface-container active:scale-95">
              <span className="material-symbols-outlined text-[20px]">language</span>
            </button>
            <button className="rounded-xl border-2 border-error/20 px-4 py-2 font-bold text-error transition-all hover:bg-error-container/30 active:scale-95 md:px-6">
              Exit Interview
            </button>
          </div>
        </header>

        <section className="mx-auto w-full max-w-5xl flex-1 space-y-12 overflow-y-auto px-6 py-10 md:px-12">
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

        <footer className="bg-surface-bright/50 p-4 backdrop-blur-md md:p-8">
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
              <div className="hidden items-center gap-2 sm:flex">
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
