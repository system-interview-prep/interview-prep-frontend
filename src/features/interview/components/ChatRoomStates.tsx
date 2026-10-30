import { RefreshCw } from 'lucide-react';
import { ProcessStatus } from '@components/shared/ProcessSteps';
import { useLanguage } from '@/i18n/LanguageProvider';

export function ChatRoomLoadingState() {
  const { t } = useLanguage();
  return (
    <div
      aria-live="polite"
      className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#F7F9FD] p-6 text-[#14244B]"
    >
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold text-[#14244B]">{t('room.chat.loadingTitle')}</h2>
        <p className="mt-1 text-sm text-[#607096]">{t('room.chat.loadingSub')}</p>
      </div>
      {/* Continues the room page's phases: session and plan are already checked. */}
      <ProcessStatus
        className="w-full max-w-sm"
        phases={[t('uxWs.room.phaseLoad'), t('uxWs.room.phasePlan'), t('uxWs.room.phaseOpen')]}
        activeIndex={2}
      />
    </div>
  );
}

export function ChatRoomErrorState({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#F7F9FD] p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center ring-1 ring-[#DCE4F3]">
        <h3 className="font-display text-xl font-semibold text-[#14244B]">{t('room.chat.errorTitle')}</h3>
        <p role="alert" className="mt-2 text-sm leading-relaxed text-[#607096]">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
          >
            <RefreshCw className="size-4" /> {t('room.common.retry')}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#F7F9FD] px-5 text-sm font-semibold text-[#14244B] transition hover:bg-[#EEF2FD]"
          >
            {t('room.chat.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
