"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Code2,
  Coins,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Minus,
  MapPin,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Video,
  XCircle,
} from "lucide-react";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import {
  scoreCvAgainstJobProfile,
  type CompatibilityResult,
  type CvScoringResponse,
  type FactorResult,
} from "@/lib/aiService";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { userCvApi, type UserCvDto } from "@features/resume/services/userCv.service";
import { startInterviewSession } from "@features/interview/services/interviewSession.service";
import { formatSalary, formatExperience, getCompanyInitials } from "@/components/jobs/job-card.utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { CandidateMatchDetails } from "@features/matching/components/CandidateMatchDetails";
import { buildHumanizedRequirementsAndGroups } from "@features/matching/utils/match-formatters";

/* ── Helper Resolvers ── */

export function resolveFitBandInfo(fitBand?: string) {
  switch (fitBand) {
    case "strong_fit":
      return {
        label: "Rất phù hợp (Strong Fit)",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
        description: "Hồ sơ đáp ứng vượt trội các tiêu chí và yêu cầu trọng yếu.",
      };
    case "partial_fit":
      return {
        label: "Phù hợp một phần (Partial Fit)",
        badgeClass: "bg-blue-50 text-[#204195] border-blue-200",
        dotClass: "bg-blue-500",
        description: "Hồ sơ đáp ứng phần lớn yêu cầu, có một vài điểm cần trau dồi thêm.",
      };
    case "review_required":
      return {
        label: "Cần xem xét thêm (Review Required)",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        dotClass: "bg-amber-500",
        description: "Có tiêu chí cần thẩm định thêm từ hồ sơ hoặc chứng chỉ liên quan.",
      };
    case "not_eligible":
      return {
        label: "Chưa đạt yêu cầu (Not Eligible)",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        dotClass: "bg-red-500",
        description: "Chưa đáp ứng đủ các tiêu chuẩn bắt buộc (must-have) của công việc.",
      };
    case "insufficient_evidence":
    default:
      return {
        label: "Thiếu bằng chứng (Insufficient Evidence)",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
        description: "Dữ liệu trong CV chưa đủ để kết luận, cần bổ sung thêm chi tiết.",
      };
  }
}

export function resolveEligibilityInfo(status?: string) {
  switch (status) {
    case "eligible":
      return {
        label: "Đáp ứng điều kiện bắt buộc",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description: "Hồ sơ đáp ứng các tiêu chuẩn bắt buộc (must-have).",
      };
    case "review_required":
      return {
        label: "Cần xác minh thêm",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        description: "Có tiêu chí bắt buộc chưa đủ dữ liệu xác minh trong hồ sơ.",
      };
    case "ineligible":
      return {
        label: "Chưa đáp ứng điều kiện bắt buộc",
        color: "text-red-700",
        bg: "bg-red-50 border-red-200",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        description: "Chưa đáp ứng một hoặc nhiều tiêu chuẩn bắt buộc của vị trí.",
      };
    default:
      return {
        label: "Đang đánh giá",
        color: "text-slate-700",
        bg: "bg-slate-100 border-slate-200",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        description: "Chưa có kết quả thẩm định tiêu chuẩn bắt buộc.",
      };
  }
}

export function resolveRequirementStatus(status?: string) {
  switch (status) {
    case "met":
      return {
        label: "Đáp ứng",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        barColor: "bg-emerald-500",
        isMet: true,
      };
    case "not_met":
      return {
        label: "Chưa đáp ứng",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        barColor: "bg-red-500",
        isMet: false,
      };
    case "not_applicable":
      return {
        label: "Không áp dụng",
        badgeClass: "bg-slate-50 text-slate-500 border-slate-200",
        barColor: "bg-slate-200",
        isMet: null,
      };
    case "unknown":
    default:
      return {
        label: "Chưa đủ bằng chứng",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        barColor: "bg-slate-300",
        isMet: null,
      };
  }
}

export function resolveReasonCodeText(code?: string): string {
  if (!code) return "";
  switch (code) {
    case "skill_not_evidenced":
      return "Không tìm thấy bằng chứng về kỹ năng này trong CV hiện tại.";
    case "language_not_evidenced":
      return "Không tìm thấy bằng chứng về ngoại ngữ hoặc chứng chỉ này trong CV hiện tại.";
    case "education_not_evidenced":
      return "Không tìm thấy bằng chứng học vấn đáp ứng yêu cầu trong CV hiện tại.";
    case "experience_not_evidenced":
      return "Không tìm thấy bằng chứng kinh nghiệm đáp ứng yêu cầu trong CV hiện tại.";
    case "resume_section_incomplete":
      return "Dữ liệu CV chưa đầy đủ nên hệ thống chưa thể kết luận tiêu chí này.";
    case "requirement_evaluator_unsupported":
      return "Chưa đủ dữ liệu bằng chứng để kết luận tiêu chí này.";
    case "raw_text_coverage_incomplete":
      return "Raw text của CV chưa được thu thập đầy đủ; cần bổ sung hoặc parse lại CV để kết luận.";
    case "generic_requirement_evidence_weak":
      return "CV có đề cập nội dung liên quan nhưng chưa đủ ngữ cảnh thực hành để xác nhận.";
    case "requirement_not_evidenced":
      return "Không tìm thấy bằng chứng phù hợp trong toàn bộ raw text của CV.";
    case "credential_level_not_evidenced":
      return "CV có thông tin liên quan nhưng chưa nêu mức điểm hoặc cấp độ cần thiết.";
    case "experience_duration_not_evidenced":
      return "CV có kinh nghiệm liên quan nhưng chưa đủ mốc thời gian để xác định thời lượng.";
    case "experience_duration_below_minimum":
      return "Thời lượng kinh nghiệm được xác thực thấp hơn mức tối thiểu của JD.";
    case "experience_duration_satisfied":
      return "Thời lượng kinh nghiệm được xác thực đáp ứng mức tối thiểu của JD.";
    case "skill_level_not_evidenced":
      return "Chưa đủ thông tin minh chứng cho cấp độ kỹ năng yêu cầu.";
    case "skill_level_below_minimum":
      return "Cấp độ kỹ năng ghi nhận trong hồ sơ chưa đạt mức tối thiểu.";
    case "skill_duration_not_evidenced":
      return "Chưa có bằng chứng rõ ràng về số tháng kinh nghiệm thực tế với kỹ năng này.";
    case "skill_duration_below_minimum":
      return "Thời gian làm việc thực tế với kỹ năng này chưa đạt số tháng tối thiểu.";
    case "skill_evidenced":
    case "skill_claim_verified":
      return "Kỹ năng đã được chứng minh qua kinh nghiệm và dự án trong hồ sơ.";
    case "skill_and_level_evidenced":
      return "Kỹ năng và cấp độ chuyên môn đáp ứng đầy đủ yêu cầu của công việc.";
    case "skill_claim_not_found":
      return "Chưa tìm thấy bằng chứng hoặc từ khóa kỹ năng này trong CV.";
    case "concept_group_evidenced":
      return "Các nội dung yêu cầu đều có bằng chứng phù hợp trong CV.";
    case "concept_group_evidence_missing":
      return "Một hoặc nhiều nội dung chưa có đủ bằng chứng để xác nhận.";
    case "concept_group_not_met":
      return "Thông tin hiện có chưa đáp ứng đầy đủ yêu cầu này.";
    case "language_level_not_evidenced":
      return "Chưa có chứng chỉ hoặc bằng chứng rõ ràng về trình độ ngoại ngữ.";
    case "language_level_not_equal":
      return "Trình độ ngoại ngữ chưa tương thích với cấp độ yêu cầu.";
    case "language_evidenced":
      return "Trình độ ngoại ngữ đã được ghi nhận đầy đủ trong hồ sơ.";
    case "education_requirement_needs_specialized_evaluator":
      return "Yêu cầu về học vấn & văn bằng cần được xác minh thêm từ hồ sơ gốc.";
    case "experience_duration_gap":
      return "Tổng số năm kinh nghiệm chưa đáp ứng đủ số năm yêu cầu.";
    case "candidate_accepts_hybrid":
      return "Ứng viên phù hợp với hình thức làm việc kết hợp (Hybrid).";
    case "candidate_accepts_remote":
      return "Ứng viên phù hợp với hình thức làm việc từ xa (Remote).";
    case "candidate_location_matched":
      return "Địa điểm làm việc của ứng viên hoàn toàn tương thích.";
    case "evidence_insufficient":
      return "Chưa có đủ bằng chứng minh chứng trong hồ sơ.";
    case "career_experience_not_evidenced":
      return "Chưa có bằng chứng về kinh nghiệm ngành nghề tương ứng.";
    case "career_experience_has_no_direct_evidence":
      return "Kinh nghiệm chưa có trích đoạn bằng chứng trực tiếp.";
    case "semantic_dense_provider_fallback_to_sparse":
      return "Phân tích ngữ nghĩa đang sử dụng phương án dự phòng dựa trên đối sánh từ khóa.";
    case "semantic_input_not_evidenced":
      return "Nội dung văn bản CV hoặc JD chưa đủ để phân tích ngữ nghĩa sâu.";
    case "semantic_scorer_unavailable":
      return "Mô hình chấm điểm ngữ nghĩa tạm thời không khả dụng.";
    case "work_mode_accepted":
      return "Hình thức làm việc được chấp nhận theo nguyện vọng.";
    case "work_mode_not_accepted":
      return "Hình thức làm việc chưa phù hợp với nguyện vọng ứng viên.";
    case "location_accepted":
      return "Địa điểm làm việc phù hợp với nguyện vọng của ứng viên.";
    case "location_not_accepted_and_no_relocation":
      return "Địa điểm làm việc chưa phù hợp và ứng viên không thể chuyển chỗ ở.";
    case "relocation_preference_missing":
      return "Chưa rõ nguyện vọng chuyển chỗ ở của ứng viên.";
    case "job_work_mode_not_specified":
      return "Tin tuyển dụng không ghi rõ hình thức làm việc.";
    case "job_location_not_specified":
      return "Tin tuyển dụng không yêu cầu địa điểm cụ thể.";
    case "candidate_work_mode_preference_missing":
      return "Chưa có thông tin nguyện vọng hình thức làm việc của ứng viên.";
    case "candidate_location_preference_missing":
      return "Chưa có thông tin nguyện vọng địa điểm làm việc của ứng viên.";
    default:
      if (code.endsWith("_requirement_needs_specialized_evaluator")) {
        return "Tiêu chí này cần được chuyên viên nhân sự xác minh thêm.";
      }
      return "";
  }
}

export function resolveCompatibilityInfo(status?: string, criterion?: string) {
  void criterion;
  switch (status) {
    case "compatible":
      return {
        label: "Phù hợp",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconColor: "text-emerald-600",
        boxBg: "bg-emerald-50/40 border-emerald-100",
        isWarning: false,
      };
    case "incompatible":
      return {
        label: "Không phù hợp",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        iconColor: "text-red-600",
        boxBg: "bg-red-50/40 border-red-100",
        isWarning: true,
      };
    case "not_applicable":
      return {
        label: "Không áp dụng",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        iconColor: "text-slate-400",
        boxBg: "bg-slate-50 border-slate-200",
        isWarning: false,
      };
    case "unknown":
    default:
      return {
        label: "Chưa có đủ thông tin",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        iconColor: "text-amber-600",
        boxBg: "bg-amber-50/40 border-amber-100",
        isWarning: true,
      };
  }
}

export function resolveWarningText(warning: string): string {
  switch (warning) {
    case "semantic_dense_provider_fallback_to_sparse":
      return "Phân tích ngữ nghĩa đang sử dụng phương án dự phòng dựa trên đối sánh từ khóa.";
    case "career_experience_has_no_direct_evidence":
      return "Điểm kinh nghiệm được ước lượng từ chức danh nhưng thiếu đoạn văn bản minh chứng trực tiếp.";
    case "factor_not_evidenced":
      return "Một số tiêu chí đánh giá chưa có đủ bằng chứng trong hồ sơ.";
    default:
      return "Có lưu ý từ hệ thống chưa được mô tả chi tiết.";
  }
}

export function resolveFitBandGaugeColor(fitBand?: string, hasScore?: boolean): string {
  if (!hasScore) return "#94A3B8";
  switch (fitBand) {
    case "strong_fit":
      return "#16A34A";
    case "partial_fit":
      return "#2563EB";
    case "review_required":
      return "#F59E0B";
    case "not_eligible":
      return "#DC2626";
    case "insufficient_evidence":
    default:
      return "#94A3B8";
  }
}

function getFactorLabel(factor: string) {
  switch (factor) {
    case "skill":
      return { label: "Kỹ năng bổ trợ", icon: Code2, desc: "Mức độ đáp ứng các kỹ năng mở rộng và ưu tiên thêm" };
    case "experience":
      return { label: "Mức phù hợp kinh nghiệm & vai trò", icon: Briefcase, desc: "Sự liên quan giữa chức danh, chuyên môn và quá trình làm việc" };
    case "semantic":
      return { label: "Mức tương đồng vai trò & nội dung công việc", icon: Brain, desc: "Độ phù hợp ngữ nghĩa giữa mô tả công việc và kinh nghiệm CV" };
    case "language":
      return { label: "Ngoại ngữ chuyên môn", icon: Globe, desc: "Trình độ ngôn ngữ đáp ứng yêu cầu vị trí" };
    default:
      return { label: factor, icon: Sparkles, desc: "Chỉ số đánh giá chuyên sâu" };
  }
}

/* ── Compact Match Summary Strip ── */

export function CompactMatchSummary({
  eligibility,
  percentage,
  requirementResults,
  failedMustHaveCount = 0,
  scoreIsDiagnostic = false,
}: {
  eligibility?: string;
  percentage: number | null;
  requirementResults?: Array<{ status: string }>;
  failedMustHaveCount?: number;
  scoreIsDiagnostic?: boolean;
}) {
  const eligible = eligibility === "eligible";
  const ineligible = eligibility === "ineligible";

  const counts = useMemo(() => {
    if (!requirementResults) return { met: 0, unknown: 0, notMet: 0, total: 0 };
    const applicable = requirementResults.filter((r) => r.status !== "not_applicable");
    return {
      met: applicable.filter((r) => r.status === "met").length,
      unknown: applicable.filter((r) => r.status === "unknown").length,
      notMet: applicable.filter((r) => r.status === "not_met").length,
      total: applicable.length,
    };
  }, [requirementResults]);
  // Only an explicit diagnostic score from the v2.1 contract may be shown for
  // a non-eligible result. This preserves legacy suppression for payloads that
  // contain an ambiguous score field without provenance.
  const displayPercentage = percentage != null && (eligible || scoreIsDiagnostic);

  const stateDot = eligible
    ? "bg-emerald-500"
    : ineligible
    ? "bg-rose-500"
    : "bg-amber-400";

  const stateLabel = eligible
    ? "Đáp ứng điều kiện bắt buộc"
    : ineligible
    ? "Chưa đáp ứng điều kiện bắt buộc"
    : "Cần xác minh thêm";

  const stateDescription =
    counts.met === 0 && counts.unknown > 0 && counts.notMet === 0
      ? "Phần lớn tiêu chí hiện chưa có đủ bằng chứng để xác nhận."
      : eligible
      ? "Thông tin hiện có cho thấy hồ sơ đáp ứng các điều kiện chính."
      : ineligible
      ? failedMustHaveCount > 0
        ? `Có ${failedMustHaveCount} tiêu chí bắt buộc chưa được hồ sơ đáp ứng.`
        : "Có tiêu chí chính chưa được hồ sơ đáp ứng."
      : "Chưa đủ bằng chứng để đưa ra kết luận chắc chắn.";
  // Keep the legacy label when no score is exposed.  The reference label is
  // reserved for an explicit diagnostic score from the v2.1 contract.
  const scoreLabel =
    eligible || !scoreIsDiagnostic
      ? "Điểm phù hợp tổng hợp"
      : "Điểm phù hợp tham khảo";

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-2xs sm:px-6 md:min-h-[156px]">
      <div className="grid gap-5 md:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.5fr)] md:items-center md:gap-8">
        <div>
          {displayPercentage ? (
            <>
              <div className="flex items-start font-semibold leading-none tracking-tight text-slate-950">
                <span className="text-[40px] sm:text-[44px] md:text-[54px]">{percentage}</span>
                <span className="mt-1 text-xl sm:text-2xl md:mt-1.5 md:text-[28px]">%</span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-slate-700">{scoreLabel}</p>
              <div className="mt-3 h-1.5 max-w-56 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-700" style={{ width: `${percentage}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {eligible
                  ? "Điểm phù hợp cuối cùng dựa trên thông tin hiện có."
                  : "Điểm tham khảo không thay đổi kết luận về điều kiện bắt buộc."}
              </p>
            </>
          ) : (
            <div>
              <span className="text-4xl font-semibold leading-none text-slate-400">—</span>
              <p className="mt-2 text-sm font-medium text-slate-700">{scoreLabel}</p>
              <p className="mt-2 text-xs text-slate-500">Chưa đủ dữ liệu để tính điểm phù hợp.</p>
            </div>
          )}
        </div>

        <div className="md:border-l md:border-slate-200 md:pl-8">
          <div className="flex items-center gap-2.5">
            <span className={`size-2.5 shrink-0 rounded-full ${stateDot}`} aria-hidden="true" />
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-[22px]">
              {stateLabel}
            </h2>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{stateDescription}</p>
        </div>
      </div>
    </section>
  );
}

export function MatchBreakdown({
  requirementResults,
}: {
  requirementResults?: Array<{ status: string }>;
}) {
  const hasResults = Boolean(requirementResults?.length);
  const counts = useMemo(() => {
    if (!requirementResults?.length) return null;
    return {
      met: requirementResults.filter((item) => item.status === "met").length,
      unknown: requirementResults.filter((item) => item.status === "unknown").length,
      notMet: requirementResults.filter((item) => item.status === "not_met").length,
    };
  }, [requirementResults]);

  const items = [
    {
      count: counts?.met,
      label: "Phù hợp",
      description: "Đã có bằng chứng rõ trong CV",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
    {
      count: counts?.unknown,
      label: "Cần xác minh",
      description: "CV chưa thể hiện đủ thông tin",
      icon: HelpCircle,
      iconClass: "text-slate-500",
    },
    {
      count: counts?.notMet,
      label: "Chưa đáp ứng",
      description: "Thông tin hiện tại chưa đạt yêu cầu",
      icon: Minus,
      iconClass: "text-rose-500",
    },
  ];

  return (
    <section aria-label="Tổng hợp trạng thái tiêu chí" className="border-y border-slate-200 bg-white">
      <div className="grid sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
        {items.map(({ count, label, description, icon: Icon, iconClass }, index) => (
          <div
            key={label}
            className={`flex items-start gap-3 px-4 py-4 sm:px-5 ${index > 0 ? "border-t border-slate-200 sm:border-t-0" : ""}`}
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-slate-900">
                  {hasResults ? count : "—"}
                </span>
                <span className="text-sm font-semibold text-slate-800">{label}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {hasResults ? description : "Chưa có dữ liệu trạng thái tiêu chí"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Main Component ── */

function ScorePageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { lang } = useLanguage();

  const candidateId = params.get("candidateId")?.trim() ?? "";
  const jobId = params.get("jobId")?.trim() ?? "";
  const queryJobTitle = params.get("jobTitle")?.trim() || "";

  const [result, setResult] = useState<CvScoringResponse | null>(null);
  const [jobProfile, setJobProfile] = useState<JobProfile | null>(null);
  const [cvData, setCvData] = useState<UserCvDto | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingInterview, setStartingInterview] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const loadData = useCallback(async () => {
    if (!candidateId || !jobId) {
      setError("Thiếu CV hoặc tin tuyển dụng. Vui lòng quay lại và chọn đầy đủ thông tin.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Chấm điểm CV qua matching engine
      const scorePromise = scoreCvAgainstJobProfile({ candidateId, jobId });

      // 2. Tải Job Profile để hiển thị thông tin công ty, địa điểm, mức lương và raw requirement labels
      const jobPromise = jobProfileApi.get(jobId).then((res) => res.data).catch(() => null);

      // 3. Tải thông tin CV người dùng đầy đủ (kèm parsedData và evidence)
      const cvPromise = userCvApi.get(candidateId).then((res) => res.data).catch(() => null);

      const [scoringResult, jobData, cvRecord] = await Promise.all([scorePromise, jobPromise, cvPromise]);

      setResult(scoringResult);
      if (jobData) setJobProfile(jobData);
      if (cvRecord) {
        setCvData(cvRecord);
        setCvFileName(cvRecord.originalName || null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo báo cáo phân tích độ phù hợp lúc này.");
    } finally {
      setLoading(false);
    }
  }, [candidateId, jobId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Xây dựng map requirements từ structuredData của job profile nếu có
  const requirementsMap = useMemo(() => {
    const map = new Map<string, { label: string; kind?: string; priority?: string }>();
    if (!jobProfile?.structuredData) return map;

    const data = jobProfile.structuredData as Record<string, unknown>;
    const reqList = (data.requirements || data.must_have || []) as Array<Record<string, unknown>>;
    if (Array.isArray(reqList)) {
      reqList.forEach((req) => {
        const id = (req.requirement_id || req.requirementId || req.id) as string | undefined;
        const label = (req.raw_label || req.rawLabel || req.text || req.label) as string | undefined;
        const kind = (req.kind || req.category) as string | undefined;
        const priority = typeof req.priority === "string" ? req.priority : undefined;
        if (id && label) {
          map.set(id, { label, kind, priority });
        }
      });
    }
    return map;
  }, [jobProfile]);

  const handleStartInterview = async (mode: "chat" | "voice" | "video") => {
    if (startingInterview) return;
    setStartingInterview(true);
    try {
      const activeJobTitle = jobProfile?.title || queryJobTitle || "AI Engineer";
      const targetUrl = await startInterviewSession({
        mode,
        lang: lang === "vi" ? "vi" : "en",
        jobTitle: activeJobTitle,
        candidateId,
        jobId,
      });
      router.push(targetUrl);
    } catch {
      setStartingInterview(false);
    }
  };

  const displayJobTitle = jobProfile?.title || queryJobTitle || "AI Engineer";

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-20 pt-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          {/* Top Bar / Navigation */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#607096] transition-colors hover:text-[#204195]"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-[#7A89A8]">
              <Link href="/dashboard" className="hover:text-[#204195]">Trang chủ</Link>
              <span>/</span>
              <Link href="/dashboard/jobs" className="hover:text-[#204195]">Việc làm</Link>
              <span>/</span>
              <span className="font-semibold text-[#204195]">Báo cáo phù hợp</span>
            </div>
          </div>

          {/* Job Banner Header Card */}
          <header className="mb-8 overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4 sm:gap-5">
                {/* Company Logo Avatar */}
                <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] shadow-2xs sm:size-20">
                  {jobProfile?.company?.logoUrl && !logoError ? (
                    <img
                      src={jobProfile.company.logoUrl}
                      alt={jobProfile.company.name || "Company Logo"}
                      onError={() => setLogoError(true)}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : jobProfile?.company?.name ? (
                    <div className="flex h-full w-full items-center justify-center bg-[#EEF2FD] text-lg font-bold text-[#204195]">
                      {getCompanyInitials(jobProfile.company.name)}
                    </div>
                  ) : (
                    <Building2 className="size-8 text-[#94A3B8]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {jobProfile?.company?.name && (
                    <p className="text-sm font-semibold text-[#607096]">{jobProfile.company.name}</p>
                  )}
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#14244B] sm:text-3xl">
                    {displayJobTitle}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#607096]">
                    {jobProfile?.location && (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <MapPin className="size-3.5 text-[#5572B8]" />
                        {jobProfile.location}
                      </span>
                    )}
                    {jobProfile?.workMode && (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Briefcase className="size-3.5 text-[#5572B8]" />
                        {jobProfile.workMode === "remote"
                          ? "Từ xa (Remote)"
                          : jobProfile.workMode === "hybrid"
                          ? "Linh hoạt (Hybrid)"
                          : "Tại văn phòng"}
                      </span>
                    )}
                    {jobProfile?.salary && (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#16A34A]">
                        <Coins className="size-3.5" />
                        {formatSalary(jobProfile.salary)}
                      </span>
                    )}
                    {jobProfile?.experience && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#425477]">
                        <Clock className="size-3.5 text-[#5572B8]" />
                        {formatExperience(jobProfile.experience)}
                      </span>
                    )}
                    {cvFileName && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F0F4FC] px-2.5 py-1 font-medium text-[#204195]">
                        <FileText className="size-3.5" />
                        CV: {cvFileName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[#EDF2F9] pt-4 lg:border-t-0 lg:pt-0">
                <Link
                  href={`/dashboard/jobs/${jobId}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-4 py-2.5 text-sm font-semibold text-[#204195] shadow-2xs transition hover:bg-[#F8FAFC]"
                >
                  <ExternalLink className="size-4" />
                  <span>Xem JD đầy đủ</span>
                </Link>

                <button
                  type="button"
                  onClick={() => void handleStartInterview("chat")}
                  disabled={startingInterview}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#183275] active:scale-[0.99] disabled:opacity-50"
                >
                  <MessageSquare className="size-4" />
                  <span>{startingInterview ? "Đang tạo phòng..." : "Luyện phỏng vấn ngay"}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Loading State */}
          {loading && (
            <div className="rounded-2xl border border-[#DCE4F3] bg-white p-14 text-center shadow-xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F0F4FC] text-[#204195]">
                <RefreshCw className="size-7 animate-spin" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#14244B]">Đang đối chiếu CV và phân tích độ tương thích…</h3>
              <p className="mt-1 text-sm text-[#607096]">Thuật toán đối chiếu kỹ năng, kinh nghiệm và các tiêu chí tuyển dụng.</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-xs" role="alert">
              <div className="flex items-start gap-4">
                <XCircle className="mt-0.5 size-6 shrink-0 text-red-600" />
                <div className="flex-1">
                  <h2 className="text-base font-bold text-red-900">Không thể tải báo cáo phân tích</h2>
                  <p className="mt-1 text-sm text-red-800">{error}</p>
                  <button
                    type="button"
                    onClick={() => void loadData()}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-red-800"
                  >
                    <RefreshCw className="size-4" /> Thử lại
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Scoring Report Content */}
          {!loading && !error && result && (
            <ReportContent
              result={result}
              jobProfile={jobProfile}
              cvData={cvData}
              requirementsMap={requirementsMap}
              onStartInterview={handleStartInterview}
              startingInterview={startingInterview}
            />
          )}
        </div>
      </main>
    </UserDashboardShell>
  );
}

/* ── Detailed Report Sub-Components ── */

export function ReportContent({
  result,
  jobProfile,
  requirementsMap,
  cvData,
  onStartInterview,
  startingInterview = false,
}: {
  result: CvScoringResponse;
  jobProfile?: JobProfile | null;
  requirementsMap: Map<string, { label: string; kind?: string; priority?: string }>;
  cvData?: UserCvDto | null;
  onStartInterview?: (mode: "chat" | "voice" | "video") => void;
  startingInterview?: boolean;
}) {
  // Priority Source: requirementResults
  const requirementItems = useMemo(() => {
    if (result.requirementResults && result.requirementResults.length > 0) {
      // Normalize: strip null from confidence (function param is number | undefined)
      return result.requirementResults.map((r) => ({
        ...r,
        confidence: r.confidence ?? undefined,
      }));
    }
    // A legacy criteria breakdown does not carry the authoritative requirement
    // status contract. Do not infer met/not_met from score thresholds.
    return [];
  }, [result.requirementResults]);

  // Build humanized requirements and groups
  const { requirements: humanizedRequirements, groups: requirementGroups } = useMemo(() => {
    return buildHumanizedRequirementsAndGroups({
      requirementResults: requirementItems,
      jobStructuredData: (jobProfile?.structuredData as Record<string, unknown> | null) || null,
      cvParsedData: (cvData?.parsedData as Record<string, unknown> | null) || null,
      requirementsMap,
      resolveReasonCodeText,
    });
  }, [requirementItems, jobProfile, cvData, requirementsMap]);

  // Factor results — ONLY Truthful backend factors, NO synthetic fabrication
  const factors: FactorResult[] = useMemo(() => {
    return Array.isArray(result.factorResults) ? result.factorResults : [];
  }, [result.factorResults]);

  const nextAction = useMemo(() => {
    const statuses = result.requirementResults?.map((item) => item.status) ?? [];
    if (statuses.includes("not_met")) {
      return {
        kind: "review" as const,
        title: "Xem các tiêu chí còn thiếu",
        description: "Tập trung vào những yêu cầu chưa được hồ sơ hiện tại đáp ứng.",
      };
    }
    if (statuses.includes("unknown")) {
      return {
        kind: "update" as const,
        title: "Bổ sung thông tin CV để kết quả chính xác hơn",
        description: "Một số tiêu chí chưa có đủ bằng chứng rõ ràng trong hồ sơ.",
      };
    }
    if (result.eligibility === "eligible") {
      return {
        kind: "interview" as const,
        title: "Bạn đã có nền tảng phù hợp với vị trí này",
        description: "Tiếp tục chuẩn bị bằng cách luyện tập với yêu cầu thực tế của vị trí.",
      };
    }
    return null;
  }, [result.eligibility, result.requirementResults]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <CompactMatchSummary
          eligibility={result.eligibility}
          percentage={typeof result.score.percentage === "number"
            ? Math.max(0, Math.min(100, Math.round(result.score.percentage)))
            : null}
          requirementResults={result.requirementResults}
          failedMustHaveCount={result.failedMustHaveRequirements?.length ?? 0}
          scoreIsDiagnostic={result.diagnosticScore != null}
        />
        <MatchBreakdown requirementResults={result.requirementResults} />
      </div>

      {/* ── Candidate Job Match Details UI (ATS / SaaS design) ── */}
      <div id="criteria-review" className="scroll-mt-6">
        <CandidateMatchDetails
          requirements={humanizedRequirements}
          groups={requirementGroups}
        />
      </div>

      {/* ── Section: Competency Factors — collapsed by default ── */}
      {factors.length > 0 && (
        <details className="group rounded-xl border border-slate-200 bg-white shadow-2xs" open={false}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 border-b border-slate-100 group-open:border-slate-200">
            <div>
              <span className="text-sm font-bold text-slate-900">Chi tiết điểm</span>
              <span className="ml-2 text-xs text-slate-500">Phân tích theo các trụ cột năng lực</span>
            </div>
            <svg className="size-4 text-slate-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </summary>

        {factors.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {factors.map((f, idx) => {
              const info = getFactorLabel(f.factor);
              const Icon = info.icon;
              const isScored = f.status === "scored" && typeof f.rawScore === "number";
              const factorScore = isScored ? Math.round(f.rawScore! * 100) : null;

              const barColor =
                factorScore !== null
                  ? factorScore >= 70
                    ? "bg-emerald-600"
                    : factorScore >= 45
                    ? "bg-[#204195]"
                    : factorScore >= 30
                    ? "bg-amber-500"
                    : "bg-rose-500"
                  : "bg-slate-300";

              return (
                <div
                  key={`${f.factor}-${idx}`}
                  className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/40 p-4 transition-colors hover:border-slate-300"
                >
                  <div>
                    <div className="flex items-center">
                      <div className="flex size-8 items-center justify-center rounded bg-slate-100 text-slate-700">
                        <Icon className="size-4" />
                      </div>
                    </div>

                    <h4 className="mt-2.5 text-xs font-bold text-slate-900">{info.label}</h4>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{info.desc}</p>
                  </div>

                  <div className="mt-3.5">
                    {f.status === "scored" && factorScore !== null ? (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-500">Mức độ đạt</span>
                          <span className="font-bold text-slate-900">{factorScore}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${factorScore}%` }}
                          />
                        </div>
                      </>
                    ) : f.status === "not_applicable" ? (
                      <div className="flex items-center justify-between rounded bg-slate-100 px-2 py-1 text-xs">
                        <span className="text-slate-500 font-medium">Trạng thái</span>
                        <span className="font-semibold text-slate-600">Không áp dụng</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded bg-slate-100 px-2 py-1 text-xs">
                        <span className="text-slate-500 font-medium">Trạng thái</span>
                        <span className="font-semibold text-slate-700">Chưa đủ bằng chứng</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
            Chưa có dữ liệu đánh giá theo từng yếu tố.
          </div>
        )}
        </details>
      )}


      {/* Insight cards removed — data is surfaced in criteria list */}

      {/* ── Section: Workplace Compatibility ── */}
      {result.compatibilityResults && result.compatibilityResults.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900">Tính tương thích về môi trường làm việc</h3>
          <p className="mt-0.5 text-xs text-slate-500">Đối chiếu giữa nguyện vọng của bạn và chính sách làm việc của doanh nghiệp.</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {result.compatibilityResults.map((c: CompatibilityResult, idx: number) => {
              const compatInfo = resolveCompatibilityInfo(c.status, c.criterion);
              const title = c.criterion === "work_mode" ? "Hình thức làm việc" : "Địa điểm làm việc";
              return (
                <div key={idx} className={`flex items-start gap-3 rounded-lg border p-3.5 ${compatInfo.boxBg}`}>
                  <div className={`mt-0.5 rounded p-1.5 ${compatInfo.badgeClass}`}>
                    {c.status === "compatible" ? (
                      <CheckCircle2 className="size-4" />
                    ) : c.status === "incompatible" ? (
                      <XCircle className="size-4" />
                    ) : (
                      <HelpCircle className="size-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{title}</h4>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border ${compatInfo.badgeClass}`}>
                        {compatInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{resolveReasonCodeText(c.reasonCode)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Section: System Warnings ── */}
      {result.warnings && result.warnings.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-slate-700" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Lưu ý về độ tin cậy</h3>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                {result.warnings.map((w, index) => (
                  <li key={`${w}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-500" />
                    <span>{resolveWarningText(w)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {nextAction && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bước tiếp theo</p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
                {nextAction.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">{nextAction.description}</p>
            </div>

            {nextAction.kind === "update" ? (
              <Link
                href="/dashboard/cvs"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#204195] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                Cập nhật CV
              </Link>
            ) : nextAction.kind === "review" ? (
              <a
                href="#criteria-review"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#204195] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                Xem tiêu chí cần cải thiện
              </a>
            ) : (
              <button
                type="button"
                onClick={() => onStartInterview?.("video")}
                disabled={startingInterview}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#204195] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:opacity-50"
              >
                <Video className="size-4" />
                Luyện phỏng vấn cho vị trí này
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function CvScorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="flex items-center gap-3 rounded-2xl border border-[#DCE4F3] bg-white px-6 py-4 shadow-xs">
            <RefreshCw className="size-5 animate-spin text-[#204195]" />
            <span className="text-sm font-semibold text-[#607096]">Đang chuẩn bị báo cáo đối chiếu...</span>
          </div>
        </div>
      }
    >
      <ScorePageContent />
    </Suspense>
  );
}
