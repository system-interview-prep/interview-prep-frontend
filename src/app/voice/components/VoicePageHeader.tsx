"use client";

import React from "react";

type VoicePageHeaderProps = {
    language: string;
    setLanguage: (lang: string) => void;
    voiceEnabled: boolean;
    supportsVoice: boolean;
    onToggleVoice: () => void;
};

export function VoicePageHeader({
    language,
    setLanguage,
    voiceEnabled,
    supportsVoice,
    onToggleVoice,
}: VoicePageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <p className="text-xs uppercase tracking-[0.5em] text-slate-400">
                    Voice Mentor Studio
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    Trò chuyện với AI và nhận phản hồi bằng giọng nói tự nhiên.
                </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    <a
                        href="/"
                        className="rounded-full px-4 py-2 text-slate-400 hover:text-white"
                    >
                        Text Mode
                    </a>
                    <span className="rounded-full bg-white text-slate-950 px-4 py-2">
                        Voice Mode
                    </span>
                </div>
                <select
                    className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white focus:outline-none"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                >
                    <option value="vietnamese" className="bg-slate-900 text-white">
                        🇻🇳 Vietnamese
                    </option>
                    <option value="english" className="bg-slate-900 text-white">
                        🇺🇸 English
                    </option>
                </select>
                <button
                    type="button"
                    onClick={onToggleVoice}
                    disabled={!supportsVoice}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-all ${voiceEnabled
                            ? "bg-emerald-400/20 text-emerald-100"
                            : "bg-white/10 text-slate-400"
                        } ${supportsVoice ? "hover:bg-emerald-400/30" : "opacity-60"}`}
                >
                    {supportsVoice
                        ? voiceEnabled
                            ? "Voice On"
                            : "Voice Off"
                        : "Voice Unsupported"}
                </button>
            </div>
        </header>
    );
}
