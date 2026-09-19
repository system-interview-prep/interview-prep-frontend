"use client";
import Link from "next/link";
import { ArrowLeft, FileCheck2, Volume2, VolumeX } from "lucide-react";

type VoiceHeaderProps = {
  voiceEnabled: boolean; supportsVoice: boolean; onToggleVoicePlayback: () => void;
  onSubmit: () => void; onEndSession: () => void; busy?: boolean;
};

export function VoiceHeader({ voiceEnabled, supportsVoice, onToggleVoicePlayback, onSubmit, onEndSession, busy }: VoiceHeaderProps) {
  return (
    <header className="z-40 h-14 shrink-0 border-b-2 border-[#234196] bg-white">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/studio" className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"><ArrowLeft size={15} /> Quay lại Studio</Link>
          <span className="hidden text-[#B7C6E6] md:block">/</span>
          <span className="hidden truncate font-headline text-lg font-semibold md:block">Phòng luyện phản xạ</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onSubmit} disabled={Boolean(busy)} className="chunky-secondary px-3 py-2 text-xs"><FileCheck2 size={15} /> <span className="hidden sm:inline">Nộp bài</span></button>
          <button type="button" onClick={onEndSession} disabled={Boolean(busy)} className="chunky-primary px-3 py-2 text-xs">Kết thúc</button>
          <button type="button" onClick={onToggleVoicePlayback} disabled={!supportsVoice} aria-label={voiceEnabled ? "Tắt giọng AI" : "Bật giọng AI"} className="grid h-10 w-10 place-items-center rounded-xl border-2 border-[#234196] bg-white disabled:opacity-40">
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
