"use client";

import { useState, type FormEvent } from "react";
import type { HumanizedRequirement } from "../types/match-details.types";
import type {
  CandidateClarificationAnswer,
  ClarificationAnswerOutcome,
  ClarificationRequest,
} from "../services/clarification.service";

export interface ClarificationPanelProps {
  requests: ClarificationRequest[];
  requirements: HumanizedRequirement[];
  loading?: boolean;
  submitting?: boolean;
  error?: string | null;
  submissionError?: string | null;
  processedAnswers?: ClarificationAnswerOutcome[];
  onSubmit?: (answers: CandidateClarificationAnswer[]) => void;
}

const STATUS_LABELS: Record<ClarificationAnswerOutcome["status"], string> = {
  met: "Đã đáp ứng theo câu trả lời",
  not_met: "Chưa đáp ứng theo câu trả lời",
  unknown: "Cần thêm bằng chứng để kết luận",
  not_applicable: "Không áp dụng",
};

export function ClarificationPanel({
  requests,
  requirements,
  loading = false,
  submitting = false,
  error = null,
  submissionError = null,
  processedAnswers = [],
  onSubmit,
}: ClarificationPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-800" role="status">
        Đang tìm câu hỏi để làm rõ các tiêu chí chưa đủ bằng chứng…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600" role="status">
        Chưa thể tải câu hỏi làm rõ lúc này. Kết quả matching hiện tại vẫn được giữ nguyên.
      </div>
    );
  }

  if (requests.length === 0) return null;

  const byId = new Map(requirements.map((item) => [item.id, item]));
  const outcomeById = new Map(processedAnswers.map((item) => [item.requirementId, item]));
  const readyAnswers = requests.flatMap((request) => {
    const answerText = (answers[request.requirementId] ?? "").trim();
    return answerText ? [{ requirementId: request.requirementId, answerText }] : [];
  });

  const submitAnswers = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submitting && readyAnswers.length > 0) onSubmit?.(readyAnswers);
  };

  return (
    <section
      className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4"
      aria-label="Câu hỏi làm rõ tiêu chí chưa đủ bằng chứng"
    >
      <div>
        <h3 className="text-sm font-semibold text-amber-950">Làm rõ thông tin còn thiếu</h3>
        <p className="mt-1 text-xs leading-5 text-amber-800">
          Trả lời các câu hỏi để hệ thống chấm lại những tiêu chí đang chưa đủ bằng chứng. Câu trả lời được ghi nhận là thông tin tự khai.
        </p>
      </div>

      {submissionError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {submissionError}
        </p>
      )}

      <form className="space-y-3" onSubmit={submitAnswers}>
        {requests.map((request) => {
          const requirement = byId.get(request.requirementId);
          const outcome = outcomeById.get(request.requirementId);
          return (
            <div
              key={request.requirementId}
              className="rounded-md border border-amber-200 bg-white/90 p-3"
            >
              <label
                htmlFor={`clarification-answer-${request.requirementId}`}
                className="block text-xs font-medium text-slate-700"
              >
                {requirement?.label || request.requirementId}
              </label>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                {request.questionText}
              </p>
              <textarea
                id={`clarification-answer-${request.requirementId}`}
                value={answers[request.requirementId] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [request.requirementId]: event.target.value,
                  }))
                }
                rows={3}
                maxLength={5000}
                placeholder="Chia sẻ thông tin thực tế của bạn…"
                disabled={submitting}
                className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#204195] focus:ring-2 focus:ring-[#204195]/15 disabled:bg-slate-50"
              />
              {outcome && (
                <p className="mt-2 text-xs text-slate-600" role="status">
                  Kết quả sau khi chấm lại: {STATUS_LABELS[outcome.status]}.
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-600">
            Hệ thống chỉ đổi trạng thái khi câu trả lời cung cấp đủ dữ kiện; nếu chưa rõ, tiêu chí vẫn cần xác minh.
          </p>
          <button
            type="submit"
            disabled={submitting || readyAnswers.length === 0}
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#204195] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Đang chấm lại…" : "Gửi câu trả lời và chấm lại"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ClarificationPanel;
