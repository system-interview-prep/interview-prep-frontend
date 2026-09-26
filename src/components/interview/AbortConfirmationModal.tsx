'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Lock, X } from 'lucide-react';

interface AbortConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export const AbortConfirmationModal: React.FC<AbortConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [selectedReason, setSelectedReason] = useState('Việc bận đột xuất / Việc gia đình');

  if (!isOpen) return null;

  const reasons = [
    'Việc bận đột xuất / Việc gia đình',
    'Gặp sự cố kỹ thuật (Mạng, Mic, Camera)',
    'Cảm thấy chưa phù hợp với vị trí này',
    'Lý do cá nhân khác',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác nhận kết thúc phỏng vấn sớm?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Hành động này sẽ dừng buổi phỏng vấn hiện tại của bạn.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Thông tin cần lưu ý */}
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3.5 text-xs text-amber-900 space-y-2 leading-relaxed">
          <p className="font-semibold text-amber-950 flex items-center gap-1.5">
            <span>📌</span> Lưu ý quan trọng:
          </p>
          <ul className="space-y-1.5 text-amber-900/90 pl-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>Toàn bộ các câu trả lời bạn đã hoàn thành sẽ được <strong>lưu lại an toàn</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>Hệ thống AI vẫn sẽ <strong>tổng hợp báo cáo đánh giá</strong> dựa trên các phần đã trả lời.</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>Bạn sẽ không thể quay lại làm tiếp buổi phỏng vấn này sau khi đã xác nhận.</span>
            </li>
          </ul>
        </div>

        {/* Chọn lý do */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Vui lòng chọn lý do (tùy chọn):
          </label>
          <div className="space-y-2">
            {reasons.map((r, idx) => {
              const isSelected = selectedReason === r;
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition select-none ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="abort_reason"
                    value={r}
                    checked={isSelected}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>{r}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Tiếp tục phỏng vấn
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedReason)}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs sm:text-sm font-semibold text-white shadow-xs transition inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Xác nhận dừng & Nộp bài</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbortConfirmationModal;
