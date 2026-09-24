import type { HumanizedRequirement } from "../types/match-details.types";
import type {
  ClarificationRequest,
  MissingEvidenceDimension,
} from "../services/clarification.service";

const DIMENSION_LABELS: Record<MissingEvidenceDimension, string> = {
  duration: "thời gian kinh nghiệm",
  proficiency: "mức độ thành thạo",
  scale: "quy mô hệ thống hoặc dự án",
  responsibility: "vai trò và trách nhiệm trực tiếp",
  education: "thông tin học vấn",
  language_level: "trình độ ngoại ngữ",
  certification: "chứng chỉ",
  experience_context: "bối cảnh kinh nghiệm thực tế",
  other: "thông tin bổ sung",
};

export interface ClarificationPanelProps {
  requests: ClarificationRequest[];
  requirements: HumanizedRequirement[];
  loading?: boolean;
  error?: string | null;
}

export function clarificationPromptText(
  request: ClarificationRequest,
  requirement?: HumanizedRequirement
): string {
  const label = requirement?.label?.trim() || "tiêu chí này";
  const dimension = DIMENSION_LABELS[request.missingDimension];
  return `Vui lòng bổ sung ${dimension} để làm rõ “${label}”.`;
}

export function ClarificationPanel({
  requests,
  requirements,
  loading = false,
  error = null,
}: ClarificationPanelProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
        Đang kiểm tra các tiêu chí chưa đủ bằng chứng…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Chưa thể phân tích thông tin cần bổ sung lúc này. Kết quả matching hiện tại vẫn được giữ nguyên.
      </div>
    );
  }

  if (requests.length === 0) return null;

  const byId = new Map(requirements.map((item) => [item.id, item]));

  return (
    <section
      className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4"
      aria-label="Thông tin cần bổ sung"
    >
      <div>
        <h3 className="text-sm font-semibold text-amber-950">Có thể bổ sung để xác minh tốt hơn</h3>
        <p className="mt-1 text-xs leading-5 text-amber-800">
          Các gợi ý này chỉ xác định dữ liệu đang thiếu; chúng không thay đổi điểm hoặc kết luận matching hiện tại.
        </p>
      </div>

      <div className="space-y-2">
        {requests.map((request) => {
          const requirement = byId.get(request.requirementId);
          return (
            <div
              key={request.requirementId}
              className="rounded-md border border-amber-200 bg-white/80 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">
                  {requirement?.label || request.requirementId}
                </p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  {Math.round(request.confidence * 100)}% confidence
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {clarificationPromptText(request, requirement)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ClarificationPanel;
