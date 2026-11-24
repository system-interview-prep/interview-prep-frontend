'use client';

import { PauseCircle } from 'lucide-react';
import { useDialogA11y } from '@components/shared/useDialogA11y';
import { useLanguage } from '@/i18n/LanguageProvider';

export function SilencePauseModal({
  open,
  onContinue,
}: {
  open: boolean;
  onContinue: () => void;
}) {
  const { t } = useLanguage();
  const panelRef = useDialogA11y<HTMLDivElement>(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#14244B]/55 p-4 backdrop-blur-[2px]">
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="silence-pause-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl bg-white p-6 text-[#14244B] shadow-[0_28px_60px_-30px_rgba(20,36,75,0.7)] ring-1 ring-[#DCE4F3] outline-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FD] text-[#204195]">
            <PauseCircle className="size-6" aria-hidden="true" />
          </div>
          <h2 id="silence-pause-title" className="font-display text-lg font-bold">
            {t('room.voice.pause.title')}
          </h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#475569]">{t('room.voice.pause.body')}</p>
        <button
          type="button"
          onClick={onContinue}
          data-autofocus
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
        >
          {t('room.voice.pause.continue')}
        </button>
      </section>
    </div>
  );
}
