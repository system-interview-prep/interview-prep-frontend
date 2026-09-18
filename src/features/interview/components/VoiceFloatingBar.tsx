"use client";
import { Mic, MicOff, PhoneOff } from "lucide-react";

type VoiceFloatingBarProps = { recorderSupported: boolean; isRecording: boolean; onMicToggle: () => void; onEndSession: () => void };

export function VoiceFloatingBar({ recorderSupported, isRecording, onMicToggle, onEndSession }: VoiceFloatingBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-[#234196] bg-white p-2 shadow-[5px_5px_0_#234196]" role="toolbar" aria-label="Điều khiển phỏng vấn">
      <button type="button" onClick={onMicToggle} disabled={!recorderSupported} aria-pressed={isRecording} className={`chunky-primary h-12 px-5 text-sm disabled:opacity-40 ${isRecording ? "bg-[#FCB625]" : "bg-white"}`}>
        {isRecording ? <Mic size={19} /> : <MicOff size={19} />} {isRecording ? "Đang nghe" : "Bật mic"}
      </button>
      <button type="button" onClick={onEndSession} aria-label="Kết thúc" className="grid h-12 w-12 place-items-center rounded-xl border-2 border-[#234196] bg-[#FFEBEE] text-[#D32F2F] transition-transform active:translate-y-0.5"><PhoneOff size={19} /></button>
    </div>
  );
}
