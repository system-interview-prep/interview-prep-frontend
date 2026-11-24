'use client';

import { DoorOpen, Play } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';

/** Shown when the candidate comes back to a chat interview they had left (same look as the voice room's "you're out of the room" card). */
export function ChatReturnModal({
  awaySince,
  graceMinutes,
  onContinue,
}: {
  awaySince: string;
  graceMinutes: number;
  onContinue: () => void;
}) {
  const { t } = useLanguage();
  const at = new Date(awaySince);
  const time = Number.isNaN(at.getTime())
    ? '—'
    : at.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-return-title"
    >
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-[#14244B] shadow-[0_28px_60px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-3.5 border-b border-[#EAEFF8] pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8E8] text-[#8A5A00]">
            <DoorOpen className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="chat-return-title" className="font-display text-lg font-bold">
              {t('room.chat.return.title')}
            </h2>
            <p className="text-xs text-[#607096]">{fmt(t('room.chat.return.leftAt'), { time })}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#475569]">
          {fmt(t('room.chat.return.body'), { n: graceMinutes })}
        </p>
        <button
          type="button"
          onClick={onContinue}
          autoFocus
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
        >
          <Play className="size-4" aria-hidden="true" />
          {t('room.chat.return.continue')}
        </button>
      </section>
    </div>
  );
}
