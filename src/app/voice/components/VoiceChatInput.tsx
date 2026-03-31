"use client";

import React from "react";

type VoiceChatInputProps = {
    input: string;
    setInput: (value: string) => void;
    onSend: () => void;
    onMicToggle: () => void;
    isRecording: boolean;
    recorderSupported: boolean;
    interimTranscript: string;
    recognitionError: string | null;
    language: string;
};

export function VoiceChatInput({
    input,
    setInput,
    onSend,
    onMicToggle,
    isRecording,
    recorderSupported,
    interimTranscript,
    recognitionError,
    language,
}: VoiceChatInputProps) {
    return (
        <>
            <form
                className="mt-6 flex flex-col gap-3 rounded-[28px] border border-white/20 bg-slate-950/40 p-4 md:flex-row md:items-center"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSend();
                }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={
                        language === "vietnamese"
                            ? "Nhập câu hỏi hoặc tình huống phỏng vấn…"
                            : "Drop your scenario or question…"
                    }
                    className="flex-1 rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300/50 focus:outline-none"
                />
                <div className="flex flex-col gap-2 md:w-auto md:flex-row">
                    <button
                        type="button"
                        onClick={onMicToggle}
                        disabled={!recorderSupported}
                        aria-pressed={isRecording}
                        className={`rounded-2xl border px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition flex items-center justify-center gap-2 ${isRecording
                                ? "border-rose-400/80 bg-rose-500/20 text-rose-50"
                                : "border-white/20 bg-white/5 text-white hover:border-white/40"
                            } ${recorderSupported ? "" : "opacity-40"}`}
                    >
                        <span className="inline-flex items-center gap-2">
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
                                className={isRecording ? "animate-pulse" : ""}
                            >
                                <path d="M12 1v14"></path>
                                <path d="M5 10v1a7 7 0 0 0 14 0v-1"></path>
                                <path d="M12 19v4"></path>
                                <path d="M8 23h8"></path>
                            </svg>
                            {isRecording
                                ? language === "vietnamese"
                                    ? "Đang nghe"
                                    : "Listening"
                                : language === "vietnamese"
                                    ? "Bấm Speak"
                                    : "Tap Speak"}
                        </span>
                    </button>
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:shadow-[0_10px_45px_rgba(34,197,94,0.4)] disabled:opacity-40"
                    >
                        Send Prompt
                    </button>
                </div>
            </form>

            {(interimTranscript || isRecording) && (
                <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-xs text-emerald-100">
                    {interimTranscript
                        ? interimTranscript
                        : language === "vietnamese"
                            ? "Đang lắng nghe..."
                            : "Listening..."}
                </div>
            )}

            {recognitionError && (
                <div className="mt-3 rounded-2xl border border-orange-400/60 bg-orange-500/10 px-4 py-3 text-xs text-orange-100">
                    {recognitionError}
                </div>
            )}
        </>
    );
}
