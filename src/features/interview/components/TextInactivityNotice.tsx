'use client';

import { useId } from 'react';
import { PauseCircle } from 'lucide-react';
import { useDialogA11y } from '@components/shared/useDialogA11y';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { TextInactivityPhase } from '../utils/textInactivity';

export function TextInactivityNotice({ phase, onContinue }: {
  phase: TextInactivityPhase; onContinue: () => void;
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const panelRef = useDialogA11y<HTMLDivElement>(phase === 'paused', onContinue);
  if (phase === 'active') return null;
  if (phase === 'warning') return (
    <div role="status" className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#DCE4F3] bg-[#FFF8E8] px-4 py-3 text-sm text-[#704A00]">
      <p>{t('room.textIdle.warning')}</p>
      <button type="button" onClick={onContinue} className="shrink-0 rounded-lg border border-[#DCC58E] px-3 py-1.5 font-semibold focus-visible:outline-2">
        {t('room.textIdle.continue')}
      </button>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#14244B]/55 p-4 backdrop-blur-[2px]">
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="w-full max-w-md rounded-3xl bg-white p-6 text-[#14244B] shadow-xl ring-1 ring-[#DCE4F3] outline-none">
        <div className="flex items-center gap-3">
          <PauseCircle className="size-9 shrink-0 text-[#204195]" aria-hidden="true" />
          <h2 id={titleId} className="font-display text-lg font-bold">{t('room.textIdle.title')}</h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#475569]">{t('room.textIdle.body')}</p>
        <p className="mt-2 text-xs leading-5 text-[#607096]">{t('room.textIdle.clockNote')}</p>
        <button type="button" onClick={onContinue} data-autofocus
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white hover:bg-[#183275] focus-visible:outline-2 focus-visible:outline-offset-2">
          {t('room.textIdle.continue')}
        </button>
      </section>
    </div>
  );
}
