"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../../../types/message";

type MessageBubbleProps = {
    message: Message;
    isActive: boolean;
    canReplay: boolean;
    onReplay: (message: Message) => void;
};

export function MessageBubble({
    message,
    isActive,
    canReplay,
    onReplay,
}: MessageBubbleProps) {
    const isAI = message.sender === "ai";

    return (
        <div
            className={`group relative rounded-3xl border px-5 py-4 transition-all duration-300 ${isAI
                ? "bg-white/10 border-white/20"
                : "bg-white/5 border-white/10"
                } ${isActive
                    ? "ring-1 ring-emerald-400/70 shadow-[0_0_35px_rgba(16,185,129,0.35)]"
                    : ""
                }`}
        >
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-300">
                <span>{isAI ? "Mentor AI" : "You"}</span>
                {isAI && canReplay && message.audioBase64 && (
                    <button
                        type="button"
                        className="text-[10px] font-semibold text-emerald-200/80 tracking-[0.3em] transition hover:text-emerald-100"
                        onClick={() => onReplay(message)}
                    >
                        Replay Voice
                    </button>
                )}
            </div>
            <div className="mt-3 text-sm leading-relaxed text-slate-100">
                {isAI ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                ) : (
                    <p>{message.text}</p>
                )}
            </div>
        </div>
    );
}
