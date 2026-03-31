import Link from "next/link";
import React from "react";

export function ChatHeader({
  language,
  setLanguage,
  // onNewSession, // Removed as it's now in the Sidebar
}: {
  language: string;
  setLanguage: (lang: string) => void;
  onNewSession: () => void;
}) {
  return (
    <header className="px-8 py-5 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">AI Interview Coach</h1>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            {language === "vietnamese" ? "Luyện Phỏng Vấn" : "Interview Practice"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/voice"
          className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-600"
        >
          Voice Mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5a3 3 0 0 1 6 0v14a3 3 0 0 1-6 0Z" />
            <path d="M5 8v8a4 4 0 0 0 4 4h1" />
            <path d="M5 16a4 4 0 0 1-4-4" />
            <path d="M19 22v-2" />
          </svg>
        </Link>
        <div className="relative">
          <select
            className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            <option value="vietnamese">🇻🇳 Tiếng Việt</option>
            <option value="english">🇺🇸 English</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>
    </header>
  );
}
