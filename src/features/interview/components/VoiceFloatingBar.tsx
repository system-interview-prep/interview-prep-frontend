"use client";
import { Mic, MicOff, PhoneOff } from "lucide-react";

type VoiceFloatingBarProps = {
  recorderSupported: boolean;
  isRecording: boolean;
  onMicToggle: () => void;
  onEndSession: () => void;
};

export function VoiceFloatingBar({
  recorderSupported,
  isRecording,
  onMicToggle,
  onEndSession,
}: VoiceFloatingBarProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/90 px-6 py-3 shadow-2xl backdrop-blur-lg"
      role="toolbar"
      aria-label="Điều khiển phỏng vấn"
    >
      <button
        type="button"
        onClick={onMicToggle}
        disabled={!recorderSupported}
        aria-pressed={isRecording}
        className={`flex h-11 items-center gap-2 rounded-full px-5 text-xs sm:text-sm font-extrabold transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-40 ${
          isRecording
            ? "bg-[#204195] text-white shadow-[0_0_15px_rgba(252,182,37,0.4)] ring-2 ring-[#FCB625]"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {isRecording ? <Mic size={18} className="animate-pulse text-[#FCB625]" /> : <MicOff size={18} />}
        <span>{isRecording ? "Đang lắng nghe..." : "Bật micro"}</span>
      </button>

      <div className="h-6 w-px bg-slate-200" aria-hidden />

      <button
        type="button"
        onClick={onEndSession}
        aria-label="Kết thúc phỏng vấn"
        title="Kết thúc phỏng vấn"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-95 transition-all cursor-pointer"
      >
        <PhoneOff size={18} />
      </button>
    </div>
  );
}


