'use client';

import React, { useId, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Lock, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useDialogA11y } from '@components/shared/useDialogA11y';

interface AbortConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the end reason to record: technical problems are not the candidate's choice. */
  onConfirm: (reason: 'USER_ENDED' | 'TECHNICAL_FAILURE') => void;
  isSubmitting?: boolean;
}

/** Reason ids; the label is `room.abort.reason.<id>`. */
const REASONS = ['busy', 'technical', 'notFit', 'other'] as const;
type ReasonId = (typeof REASONS)[number];

const TECHNICAL_REASON: ReasonId = 'technical';

export const AbortConfirmationModal: React.FC<AbortConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { t } = useLanguage();
  const [selectedReason, setSelectedReason] = useState<ReasonId>('busy');
  const titleId = useId();
  const panelRef = useDialogA11y<HTMLDivElement>(isOpen, isSubmitting ? undefined : onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/60 p-4 animate-in fade-in duration-200">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white rounded-3xl max-w-lg w-full p-6 outline-none shadow-[0_28px_60px_-30px_rgba(30,34,53,0.7)] ring-1 ring-[#DCE4F3] space-y-5 animate-in zoom-in-95 duration-150"
      >
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div>
              <h3 id={titleId} className="font-display text-xl font-semibold text-[#14244B]">
                {t('room.abort.title')}
              </h3>
              <p className="text-xs text-[#607096] mt-0.5 leading-relaxed">
                {t('room.abort.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t('room.abort.close')}
            className="rounded-full p-1.5 text-[#A0AEC0] hover:text-[#607096] hover:bg-[#F7F9FD] transition"
            title={t('room.abort.close')}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Thông tin cần lưu ý */}
        <div className="bg-[#F7F9FD] rounded-2xl p-4 text-xs text-[#607096] space-y-2 leading-relaxed">
          <p className="font-semibold text-[#14244B]">
            {t('room.abort.noteTitle')}
          </p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-3.5 text-[#204195] shrink-0 mt-0.5" />
              <span>
                {t('room.abort.saved.pre')}
                <strong>{t('room.abort.saved.strong')}</strong>
                {t('room.abort.saved.post')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="size-3.5 text-[#204195] shrink-0 mt-0.5" />
              <span>
                {t('room.abort.report.pre')}
                <strong>{t('room.abort.report.strong')}</strong>
                {t('room.abort.report.post')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="size-3.5 text-[#204195] shrink-0 mt-0.5" />
              <span>{t('room.abort.noReturn')}</span>
            </li>
          </ul>
        </div>

        {/* Chọn lý do */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-[12px] font-semibold text-[#204195]">
            {t('room.abort.reasonLabel')}
          </legend>
          <div className="space-y-2">
            {REASONS.map((r) => {
              const isSelected = selectedReason === r;
              return (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-xs sm:text-sm cursor-pointer transition select-none ${
                    isSelected
                      ? 'border-[#204195] bg-[#EEF2FD]/60 text-[#14244B] font-medium'
                      : 'border-[#DCE4F3] hover:bg-[#F7F9FD] text-[#607096]'
                  }`}
                >
                  <input
                    type="radio"
                    name="abort_reason"
                    value={r}
                    checked={isSelected}
                    onChange={() => setSelectedReason(r)}
                    className="w-4 h-4 text-[#204195] focus:ring-[#204195] border-[#DCE4F3]"
                  />
                  <span>{t(`room.abort.reason.${r}`)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 px-5 rounded-full bg-[#F7F9FD] text-xs sm:text-sm font-semibold text-[#14244B] hover:bg-[#EEF2FD] transition"
          >
            {t('room.common.continueInterview')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedReason === TECHNICAL_REASON ? 'TECHNICAL_FAILURE' : 'USER_ENDED')}
            disabled={isSubmitting}
            className="h-11 px-5 rounded-full bg-[#C43B3B] hover:bg-[#A93232] text-xs sm:text-sm font-semibold text-white transition inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{t('room.abort.processing')}</span>
              </>
            ) : (
              <span>{t('room.abort.confirm')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbortConfirmationModal;
