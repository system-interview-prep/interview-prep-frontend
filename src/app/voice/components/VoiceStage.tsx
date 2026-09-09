"use client";
import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { VoiceWaveform, type VoiceOrbState } from "./VoiceWaveform";

type VoiceStageProps = {
  waveformActive: boolean; interimTranscript?: string; recognitionError?: string | null;
  isRecording?: boolean; isProcessing?: boolean; controls?: React.ReactNode;
  aiActive?: boolean; candidateActive?: boolean; onBargeIn?: () => void; question?: string;
};

export function VoiceStage({
  interimTranscript = "", recognitionError = null, isRecording = false, isProcessing = false,
  controls, aiActive = false, candidateActive = false, onBargeIn, question,
}: VoiceStageProps) {
  const [showStarHint, setShowStarHint] = useState(false);
  const state: VoiceOrbState = candidateActive || isRecording ? "listening" : aiActive ? "speaking" : isProcessing ? "thinking" : "idle";

  useEffect(() => { if (candidateActive && aiActive) onBargeIn?.(); }, [aiActive, candidateActive, onBargeIn]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setShowStarHint(state === "idle"), state === "idle" ? 5000 : 0);
    return () => window.clearTimeout(timeout);
  }, [state]);

  return (
    <section className="paper-dots relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-white px-4 py-6 text-center sm:px-8">
      <div className="absolute left-5 top-5 hidden rotate-[-2deg] rounded-xl border-2 border-[#234196] bg-[#FEF9EE] px-4 py-3 text-left text-xs leading-5 text-[#5A6B8F] shadow-[3px_3px_0_#234196] lg:block">
        <strong className="block text-[#234196]">Barge‑in tức thì</strong> Cứ ngắt lời khi cần — AI sẽ dừng.
      </div>
      <div className="sticker bg-[#E8F5E9] text-[#2E7D32]" role="status"><span className="h-2 w-2 animate-pulse rounded-full bg-[#2E7D32]" /> WebRTC Live · 420ms</div>
      <p className="mt-5 font-metadata text-[10px] font-bold text-[#5A6B8F]">Câu hỏi 03 / 08</p>
      <h1 className="mt-2 max-w-3xl text-3xl leading-tight tracking-[-.025em] sm:text-4xl lg:text-5xl">
        {question || "Hãy kể về một lần bạn dùng dữ liệu để thay đổi quyết định kinh doanh quan trọng."}
      </h1>
      <div className="my-4"><VoiceWaveform state={state} /></div>
      <div className="min-h-16 w-full max-w-2xl">
        {(isRecording || interimTranscript) && <p className="rounded-xl border-2 border-[#234196] bg-[#F0F4FC] px-4 py-3 text-sm font-semibold" aria-live="polite">{interimTranscript || "Mình đang lắng nghe…"}</p>}
        {recognitionError && <p className="text-sm font-bold text-[#D32F2F]" role="alert">{recognitionError}</p>}
        {showStarHint && <p className="inline-flex items-center gap-2 rounded-xl bg-[#FEF9EE] px-4 py-2 text-sm text-[#5A6B8F]"><Sparkles size={16} className="text-[#E59E10]" /> Khung gợi ý STAR: Tình huống → Thách thức → Hành động → Kết quả</p>}
      </div>
      {controls ? <div className="mt-2">{controls}</div> : null}
    </section>
  );
}
