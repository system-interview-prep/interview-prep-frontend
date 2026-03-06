"use client";

import React from "react";
import { Message } from "../../../types/message";

type VoiceConsoleProps = {
    supportsVoice: boolean;
    voiceEnabled: boolean;
    isSpeaking: boolean;
    recorderSupported: boolean;
    isRecording: boolean;
    language: string;
    latestAiMessage: Message | undefined;
    recentSessions: string[];
    sessionId: string | null;
    loadSession: (id: string) => void;
};

export function VoiceConsole({
    supportsVoice,
    voiceEnabled,
    isSpeaking,
    recorderSupported,
    isRecording,
    language,
    latestAiMessage,
    recentSessions,
    sessionId,
    loadSession,
}: VoiceConsoleProps) {
    return (
        <aside className="flex h-full min-h-0 flex-col rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-3xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Voice Console</p>
                    <h3 className="text-xl font-semibold text-white">
                        {supportsVoice
                            ? voiceEnabled
                                ? isSpeaking
                                    ? "AI đang phát"
                                    : "Ready"
                                : "Voice muted"
                            : "Unsupported"}
                    </h3>
                </div>
                <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] ${isSpeaking
                            ? "bg-emerald-400/30 text-emerald-100"
                            : "bg-white/10 text-slate-300"
                        }`}
                >
                    {isSpeaking ? "Live" : "Standby"}
                </span>
            </div>

            <div className="mt-4 grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2">
                {/* Status */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Status</p>
                    <p className="mt-2 text-sm text-white">
                        {recorderSupported
                            ? isRecording
                                ? language === "vietnamese"
                                    ? "Đang nghe bạn nói"
                                    : "Listening for your prompt"
                                : language === "vietnamese"
                                    ? "Nhấn Speak để bắt đầu"
                                    : "Tap Speak to start"
                            : language === "vietnamese"
                                ? "Trình duyệt không hỗ trợ Web Speech API"
                                : "Browser does not support Web Speech API"}
                    </p>
                </div>

                {/* Latest script */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Latest script</p>
                    <p className="mt-2 text-sm text-slate-100 line-clamp-4">
                        {latestAiMessage ? latestAiMessage.text : "Chờ phản hồi từ AI."}
                    </p>
                </div>

                {/* Quick sessions */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Quick sessions</p>
                    <div className="mt-3 space-y-2">
                        {recentSessions.length === 0 && (
                            <div className="rounded-xl border border-dashed border-white/20 px-4 py-2 text-xs text-slate-400">
                                No saved sessions
                            </div>
                        )}
                        {recentSessions.slice(0, 3).map((sid) => (
                            <button
                                key={sid}
                                type="button"
                                onClick={() => loadSession(sid)}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${sid === sessionId
                                        ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
                                        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30"
                                    }`}
                            >
                                {sid}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coaching tip */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-emerald-900/30 p-4 text-sm text-slate-100">
                    <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Coaching tip</p>
                    <p className="mt-2 text-sm">
                        Yêu cầu AI đóng vai HR cụ thể để luyện kịch bản sát thực tế.
                    </p>
                </div>
            </div>
        </aside>
    );
}
