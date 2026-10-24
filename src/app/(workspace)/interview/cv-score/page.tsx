"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { DEMO_DURATION_MINUTES, totalQuestionCount } from "@features/interview/utils/questionBudget";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import WorkspacePageHeader from "@features/resume/components/WorkspacePageHeader";
import { ProcessStatus } from "@components/shared/ProcessSteps";
import StatusNote from "@components/shared/StatusNote";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { mapBackendErrorToI18nKey } from "@/utils/backendError";
import { X } from "lucide-react";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import {
  normalizeMatchResult,
  scoreCvAgainstJobProfile,
  type CompatibilityResult,
  type CvScoringResponse,
  type FactorResult,
  type MatchResult,
} from "@/lib/aiService";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { userCvApi, type UserCvDto } from "@features/resume/services/userCv.service";
import {
  describeStartInterviewError,
  startInterviewSession,
} from "@features/interview/services/interviewSession.service";
import { formatSalary, formatExperience, getCompanyInitials } from "@/components/jobs/job-card.utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fitVi } from "@/i18n/dicts/fit.dict";
import { fmt } from "@/i18n/format";
import { CandidateMatchDetails } from "@features/matching/components/CandidateMatchDetails";
import { buildHumanizedRequirementsAndGroups } from "@features/matching/utils/match-formatters";
import { countFit, saveFit } from "@features/matching/utils/fitCache";
import { useInterviewEntryPolicy } from "@features/interview/hooks/useInterviewEntryPolicy";
import { entryBlockMessageKey, evaluateEntry } from "@features/interview/utils/entryGate";
import { EntryWarningDialog } from "@features/interview/components/EntryWarningDialog";
import { PracticeTierNote } from "@features/interview/components/PracticeTierNote";
import { asFocusArea } from "@features/interview/services/interviewRuntime.service";

/* ── Helper Resolvers ── */

type Translate = (key: string) => string;
/** Vietnamese lookup used when a caller does not pass the active translator. */
const viT: Translate = (key) => fitVi[key] ?? key;

export function resolveFitBandInfo(fitBand?: string, t: Translate = viT) {
  switch (fitBand) {
    case "strong_fit":
      return {
        label: t("fit.band.strong.label"),
        badgeClass: "bg-[#EAF5EE] text-[#287A4B] border-[#287A4B]/25",
        dotClass: "bg-[#287A4B]",
        description: t("fit.band.strong.desc"),
      };
    case "partial_fit":
      return {
        label: t("fit.band.partial.label"),
        badgeClass: "bg-[#F0F4FC] text-[#204195] border-[#C9D7F1]",
        dotClass: "bg-[#204195]",
        description: t("fit.band.partial.desc"),
      };
    case "review_required":
      return {
        label: t("fit.band.review.label"),
        badgeClass: "bg-[#FFF8E6] text-[#8A5A00] border-[#FCB625]/40",
        dotClass: "bg-[#FCB625]",
        description: t("fit.band.review.desc"),
      };
    case "not_eligible":
      return {
        label: t("fit.band.notEligible.label"),
        badgeClass: "bg-[#FDF2F2] text-[#C43B3B] border-[#F5C2C2]",
        dotClass: "bg-[#C43B3B]",
        description: t("fit.band.notEligible.desc"),
      };
    case "insufficient_evidence":
    default:
      return {
        label: t("fit.band.insufficient.label"),
        badgeClass: "bg-[#F0F4FC] text-[#607096] border-[#DCE4F3]",
        dotClass: "bg-[#C9D7F1]",
        description: t("fit.band.insufficient.desc"),
      };
  }
}

export function resolveEligibilityInfo(status?: string, t: Translate = viT) {
  switch (status) {
    case "eligible":
      return {
        label: t("fit.elig.eligible.label"),
        color: "text-[#287A4B]",
        bg: "bg-[#EAF5EE] border-[#287A4B]/25",
        badgeClass: "bg-[#EAF5EE] text-[#287A4B] border-[#287A4B]/25",
        description: t("fit.elig.eligible.desc"),
      };
    case "review_required":
      return {
        label: t("fit.elig.review.label"),
        color: "text-[#8A5A00]",
        bg: "bg-[#FFF8E6] border-[#FCB625]/40",
        badgeClass: "bg-[#FFF8E6] text-[#8A5A00] border-[#FCB625]/40",
        description: t("fit.elig.review.desc"),
      };
    case "ineligible":
      return {
        label: t("fit.elig.ineligible.label"),
        color: "text-[#C43B3B]",
        bg: "bg-[#FDF2F2] border-[#F5C2C2]",
        badgeClass: "bg-[#FDF2F2] text-[#C43B3B] border-[#F5C2C2]",
        description: t("fit.elig.ineligible.desc"),
      };
    default:
      return {
        label: t("fit.elig.pending.label"),
        color: "text-[#607096]",
        bg: "bg-[#F0F4FC] border-[#DCE4F3]",
        badgeClass: "bg-[#F0F4FC] text-[#607096] border-[#DCE4F3]",
        description: t("fit.elig.pending.desc"),
      };
  }
}

export function resolveRequirementStatus(status?: string, t: Translate = viT) {
  switch (status) {
    case "met":
      return {
        label: t("fit.reqStatus.met"),
        badgeClass: "bg-[#EAF5EE] text-[#287A4B] border-[#287A4B]/25",
        barColor: "bg-[#287A4B]",
        isMet: true,
      };
    case "not_met":
      return {
        label: t("fit.status.notMet"),
        badgeClass: "bg-[#FDF2F2] text-[#C43B3B] border-[#F5C2C2]",
        barColor: "bg-[#C43B3B]",
        isMet: false,
      };
    case "not_applicable":
      return {
        label: t("fit.status.notApplicable"),
        badgeClass: "bg-[#F8FAFC] text-[#607096] border-[#DCE4F3]",
        barColor: "bg-[#DCE4F3]",
        isMet: null,
      };
    case "unknown":
    default:
      return {
        label: t("fit.status.unknown"),
        badgeClass: "bg-[#F0F4FC] text-[#607096] border-[#DCE4F3]",
        barColor: "bg-[#C9D7F1]",
        isMet: null,
      };
  }
}

// Reason codes that share their copy with another code.
const REASON_CODE_ALIASES: Record<string, string> = {
  concept_not_evidenced: "skill_not_evidenced",
  concept_group_not_evidenced: "skill_not_evidenced",
  language_not_evidenced: "language_not_found",
  skill_claim_verified: "skill_evidenced",
  skill_claim_not_found: "skill_not_found",
};

// Codes with their own `fit.reason.<code>` text.
const KNOWN_REASON_CODES = new Set([
  "skill_not_evidenced",
  "skill_not_found",
  "language_not_found",
  "education_not_evidenced",
  "experience_not_evidenced",
  "resume_section_incomplete",
  "requirement_evaluator_unsupported",
  "raw_text_coverage_incomplete",
  "generic_requirement_evidence_weak",
  "requirement_not_evidenced",
  "requirement_not_found",
  "credential_level_not_evidenced",
  "experience_duration_not_evidenced",
  "experience_duration_below_minimum",
  "experience_duration_satisfied",
  "skill_level_not_evidenced",
  "skill_level_below_minimum",
  "skill_duration_not_evidenced",
  "skill_duration_below_minimum",
  "skill_evidenced",
  "skill_and_level_evidenced",
  "concept_group_evidenced",
  "concept_group_evidence_missing",
  "concept_group_not_met",
  "language_level_not_evidenced",
  "language_level_not_equal",
  "language_evidenced",
  "education_requirement_needs_specialized_evaluator",
  "experience_duration_gap",
  "candidate_accepts_hybrid",
  "candidate_accepts_remote",
  "candidate_location_matched",
  "evidence_insufficient",
  "career_experience_not_evidenced",
  "career_experience_has_no_direct_evidence",
  "semantic_dense_provider_fallback_to_sparse",
  "semantic_input_not_evidenced",
  "semantic_scorer_unavailable",
  "work_mode_accepted",
  "work_mode_not_accepted",
  "location_accepted",
  "location_not_accepted_and_no_relocation",
  "relocation_preference_missing",
  "job_work_mode_not_specified",
  "job_location_not_specified",
  "candidate_work_mode_preference_missing",
  "candidate_location_preference_missing",
]);

export function resolveReasonCodeText(code?: string, t: Translate = viT): string {
  if (!code) return "";
  // Backend "not evidenced": the CV never mentions it, which is not proof of
  // absence. The status is "Cần xác nhận", so the copy must not say "không có".
  const canonical = REASON_CODE_ALIASES[code] ?? code;
  if (KNOWN_REASON_CODES.has(canonical)) return t(`fit.reason.${canonical}`);
  if (code.endsWith("_requirement_needs_specialized_evaluator")) {
    return t("fit.reason.specializedEvaluator");
  }
  return "";
}

export function resolveCompatibilityInfo(status?: string, criterion?: string, t: Translate = viT) {
  void criterion;
  switch (status) {
    case "compatible":
      return {
        label: t("fit.compat.compatible"),
        badgeClass: "bg-[#EAF5EE] text-[#287A4B] border-[#287A4B]/25",
        iconColor: "text-[#287A4B]",
        boxBg: "bg-white border-[#287A4B]/25",
        isWarning: false,
      };
    case "incompatible":
      return {
        label: t("fit.compat.incompatible"),
        badgeClass: "bg-[#FDF2F2] text-[#C43B3B] border-[#F5C2C2]",
        iconColor: "text-[#C43B3B]",
        boxBg: "bg-white border-[#F5C2C2]",
        isWarning: true,
      };
    case "not_applicable":
      return {
        label: t("fit.status.notApplicable"),
        badgeClass: "bg-[#F0F4FC] text-[#607096] border-[#DCE4F3]",
        iconColor: "text-[#9AA6C2]",
        boxBg: "bg-[#F8FAFC] border-[#DCE4F3]",
        isWarning: false,
      };
    case "unknown":
    default:
      return {
        label: t("fit.compat.unknown"),
        badgeClass: "bg-[#FFF8E6] text-[#8A5A00] border-[#FCB625]/40",
        iconColor: "text-[#8A5A00]",
        boxBg: "bg-white border-[#FCB625]/40",
        isWarning: true,
      };
  }
}

export function resolveWarningText(warning: string, t: Translate = viT): string {
  switch (warning) {
    case "semantic_dense_provider_fallback_to_sparse":
      return t("fit.reason.semantic_dense_provider_fallback_to_sparse");
    case "career_experience_has_no_direct_evidence":
      return t("fit.warn.careerNoDirectEvidence");
    case "factor_not_evidenced":
      return t("fit.warn.factorNotEvidenced");
    default:
      return t("fit.warn.other");
  }
}

export function resolveFitBandGaugeColor(fitBand?: string, hasScore?: boolean): string {
  if (!hasScore) return "#9AA6C2";
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
      return "#9AA6C2";
  }
}

function getFactorLabel(factor: string, t: Translate = viT) {
  switch (factor) {
    case "skill":
      return { label: t("fit.factor.skill.label"), desc: t("fit.factor.skill.desc") };
    case "experience":
      return { label: t("fit.factor.experience.label"), desc: t("fit.factor.experience.desc") };
    case "semantic":
      return { label: t("fit.factor.semantic.label"), desc: t("fit.factor.semantic.desc") };
    case "language":
      return { label: t("fit.factor.language.label"), desc: t("fit.factor.language.desc") };
    default:
      return { label: factor, desc: t("fit.factor.other.desc") };
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
  const { t } = useLanguage();
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
    ? "bg-[#287A4B]"
    : ineligible
    ? "bg-[#C43B3B]"
    : "bg-[#FCB625]";

  const stateLabel = eligible
    ? t("fit.elig.eligible.label")
    : ineligible
    ? t("fit.elig.ineligible.label")
    : t("fit.elig.review.label");

  const stateDescription =
    counts.met === 0 && counts.unknown > 0 && counts.notMet === 0
      ? t("fit.summary.mostlyUnclear")
      : eligible
      ? t("fit.summary.eligible")
      : ineligible
      ? failedMustHaveCount > 0
        ? fmt(t("fit.summary.failedMustHave"), { count: failedMustHaveCount })
        : t("fit.summary.ineligible")
      : t("fit.summary.unclear");
  // Keep the legacy label when no score is exposed.  The reference label is
  // reserved for an explicit diagnostic score from the v2.1 contract.
  const scoreLabel =
    eligible || !scoreIsDiagnostic
      ? t("fit.summary.scoreFinal")
      : t("fit.summary.scoreReference");

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-[0_18px_50px_-42px_rgba(20,36,75,.45)]">
      <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className={displayPercentage ? "bg-gradient-to-br from-[#183A88] to-[#315FC8] p-6 text-white sm:p-7" : "bg-[#F0F4FC] p-6 sm:p-7"}>
          {displayPercentage ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">{scoreLabel}</p>
              <div className="mt-3 flex items-start font-semibold leading-none">
                <span className="font-display text-[56px] tracking-[-0.06em] sm:text-[64px]">{percentage}</span>
                <span className="mt-2 text-[28px] text-blue-100">%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${percentage}%` }} />
              </div>
            </>
          ) : (
            <div>
              <span className="text-4xl font-semibold leading-none text-[#9AA6C2]">—</span>
              <p className="mt-2 text-sm font-medium text-[#607096]">{scoreLabel}</p>
            </div>
          )}
        </div>

        <div className="min-w-0 p-5 sm:p-7">
          <div className="flex items-center gap-2.5">
            <span className={`size-2.5 shrink-0 rounded-full ${stateDot}`} aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#14244B]">
              {stateLabel}
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607096]">{stateDescription}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { value: counts.met, label: t("fit.status.met"), dot: "bg-[#287A4B]" },
              { value: counts.unknown, label: t("fit.status.needsVerification"), dot: "bg-[#D99A19]" },
              { value: counts.notMet, label: t("fit.status.notMet"), dot: "bg-[#C43B3B]" },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-2xl border border-[#E3E8F2] bg-[#F8FAFC] px-2.5 py-3 text-[#14244B] sm:px-3">
                <p className="text-xl font-bold leading-none sm:text-2xl">{item.value}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] font-semibold leading-tight text-[#607096]"><span className={`mt-1 size-1.5 shrink-0 rounded-full ${item.dot}`} /><span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span></p>
              </div>
            ))}
          </div>
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
  const { t } = useLanguage();
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
      label: t("fit.status.met"),
      description: t("fit.breakdown.met.desc"),
      dotClass: "bg-[#287A4B]",
    },
    {
      count: counts?.unknown,
      label: t("fit.status.needsVerification"),
      description: t("fit.breakdown.unknown.desc"),
      dotClass: "bg-[#FCB625]",
    },
    {
      count: counts?.notMet,
      label: t("fit.status.notMet"),
      description: t("fit.breakdown.notMet.desc"),
      dotClass: "bg-[#C43B3B]",
    },
  ];

  return (
    <section aria-label={t("fit.breakdown.aria")} className="overflow-hidden rounded-3xl bg-white ring-1 ring-[#DCE4F3]">
      <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-[#EAEFF8]">
        {items.map(({ count, label, description, dotClass }, index) => (
          <div
            key={label}
            className={`flex items-start gap-3 px-4 py-4 sm:px-5 ${index > 0 ? "border-t border-[#EAEFF8] sm:border-t-0" : ""}`}
          >
            <span className={`mt-2 size-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-[#14244B]">
                  {hasResults ? count : "—"}
                </span>
                <span className="text-sm font-semibold text-[#14244B]">{label}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#607096]">
                {hasResults ? description : t("fit.breakdown.noData")}
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
  const { t, lang } = useLanguage();

  const urlCandidateId = params.get("candidateId")?.trim() ?? "";
  const urlJobId = params.get("jobId")?.trim() ?? "";
  const urlJobTitle = params.get("jobTitle")?.trim() || "";
  // "Luyện vòng này" on the progress page: the round this session focuses on.
  const focusArea = asFocusArea(params.get("focus"));
  // "Luyện lại ý này": the skill the planner must ask again, with a question not met before.
  const reaskConceptId = params.get("reask")?.trim().slice(0, 120) || undefined;
  const reaskSkill = params.get("reaskSkill")?.trim().slice(0, 120) || "";

  const [activeContext, setActiveContext] = useState<{
    candidateId: string;
    jobId: string;
    jobTitle?: string;
  } | null>(() => {
    if (urlCandidateId && urlJobId) {
      return { candidateId: urlCandidateId, jobId: urlJobId, jobTitle: urlJobTitle };
    }
    return null;
  });

  const [resolving, setResolving] = useState(!urlCandidateId || !urlJobId);
  const [hasNoContext, setHasNoContext] = useState(false);

  const [result, setResult] = useState<CvScoringResponse | null>(null);
  const [jobProfile, setJobProfile] = useState<JobProfile | null>(null);
  const [cvData, setCvData] = useState<UserCvDto | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingInterview, setStartingInterview] = useState(false);
  const [interviewStartError, setInterviewStartError] = useState<string | null>(null);
  const [showModeChooser, setShowModeChooser] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Sync / Auto-recover context if URL params are missing
  useEffect(() => {
    if (urlCandidateId && urlJobId) {
      const current = { candidateId: urlCandidateId, jobId: urlJobId, jobTitle: urlJobTitle };
      setActiveContext(current);
      setResolving(false);
      setHasNoContext(false);
      try {
        sessionStorage.setItem("interview.cvScoreContext", JSON.stringify(current));
        localStorage.setItem("interview.cvScoreContext", JSON.stringify(current));
      } catch {
        /* ignore */
      }
      return;
    }

    // 1. Try reading from sessionStorage or localStorage
    let storedContext: { candidateId: string; jobId: string; jobTitle?: string } | null = null;
    try {
      const raw =
        typeof window !== "undefined"
          ? sessionStorage.getItem("interview.cvScoreContext") ||
            localStorage.getItem("interview.cvScoreContext")
          : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.candidateId && parsed?.jobId) {
          storedContext = parsed;
        }
      }
    } catch {
      /* ignore */
    }

    if (storedContext?.candidateId && storedContext?.jobId) {
      setActiveContext(storedContext);
      setResolving(false);
      setHasNoContext(false);
      const q = new URLSearchParams({
        candidateId: storedContext.candidateId,
        jobId: storedContext.jobId,
        ...(storedContext.jobTitle ? { jobTitle: storedContext.jobTitle } : {}),
      });
      router.replace(`/interview/cv-score?${q.toString()}`);
      return;
    }

    // 2. Auto-discover from user's latest CV and first active job
    let isCancelled = false;
    async function autoDiscover() {
      try {
        const [cvRes, jobsRes] = await Promise.all([
          userCvApi.list(10).catch(() => ({ data: { items: [] } })),
          jobProfileApi.list({ limit: 10 }).catch(() => ({ data: { items: [] } })),
        ]);

        if (isCancelled) return;

        const cvItems = (cvRes?.data?.items as Record<string, unknown>[]) || [];
        const jobItems = (jobsRes?.data?.items as Record<string, unknown>[]) || [];

        // Only pair a parsed CV with an open job; anything else shows the empty state.
        const validCv = cvItems.find((c) => c?.id && c?.status === "DONE");
        // Same rule as the jobs board (isActiveProfile).
        const validJob = jobItems.find((j) => j?.id && j?.status === "ACTIVE");

        if (validCv?.id && validJob?.id) {
          const autoCtx = {
            candidateId: String(validCv.id),
            jobId: String(validJob.id),
            jobTitle: String(validJob.title || t("fit.page.defaultJobTitle")),
          };
          try {
            sessionStorage.setItem("interview.cvScoreContext", JSON.stringify(autoCtx));
            localStorage.setItem("interview.cvScoreContext", JSON.stringify(autoCtx));
          } catch {
            /* ignore */
          }
          setActiveContext(autoCtx);
          setResolving(false);
          setHasNoContext(false);
          const q = new URLSearchParams({
            candidateId: autoCtx.candidateId,
            jobId: autoCtx.jobId,
            jobTitle: autoCtx.jobTitle,
          });
          router.replace(`/interview/cv-score?${q.toString()}`);
          return;
        }
      } catch {
        /* ignore */
      }

      if (!isCancelled) {
        setResolving(false);
        setHasNoContext(true);
        setLoading(false);
      }
    }

    void autoDiscover();

    return () => {
      isCancelled = true;
    };
    // `t` only supplies a fallback title; re-running discovery on a language
    // switch is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCandidateId, urlJobId, urlJobTitle, router]);

  const candidateId = activeContext?.candidateId || "";
  const jobId = activeContext?.jobId || "";
  const queryJobTitle = activeContext?.jobTitle || urlJobTitle || "";

  const loadData = useCallback(async () => {
    if (!candidateId || !jobId) {
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
      saveFit({
        jobId,
        cvId: candidateId,
        cvName: cvRecord?.originalName ?? null,
        ...countFit(scoringResult.requirementResults),
        analyzedAt: new Date().toISOString(),
      });
      if (jobData) setJobProfile(jobData);
      if (cvRecord) {
        setCvData(cvRecord);
        setCvFileName(cvRecord.originalName || null);
      }
    } catch (cause) {
      // Store a translation key, never raw server/Axios text.
      setError(mapBackendErrorToI18nKey(cause) ?? "fit.page.loadError");
    } finally {
      setLoading(false);
    }
  }, [candidateId, jobId]);

  const handleMatchingResult = useCallback((matchResult: MatchResult) => {
    if (!candidateId || !jobId) return;
    const normalized = normalizeMatchResult(matchResult, candidateId, jobId);
    setResult(normalized);
    saveFit({
      jobId,
      cvId: candidateId,
      cvName: cvFileName,
      ...countFit(normalized.requirementResults),
      analyzedAt: new Date().toISOString(),
    });
  }, [candidateId, jobId, cvFileName]);

  useEffect(() => {
    if (candidateId && jobId) {
      void loadData();
    }
  }, [loadData, candidateId, jobId]);

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

  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  /** 0 creating the session, 1 preparing questions, 2 opening the room (time-based captions of one request). */
  const [startStage, setStartStage] = useState(0);
  useEffect(() => {
    if (!startingInterview) return;
    const timer = window.setTimeout(() => setStartStage((stage) => Math.max(stage, 1)), 1800);
    return () => {
      window.clearTimeout(timer);
      setStartStage(0);
    };
  }, [startingInterview]);
  const closeModeChooser = useCallback(() => setShowModeChooser(false), []);
  const modeDialogRef = useDialogA11y<HTMLDivElement>(showModeChooser, startingInterview ? undefined : closeModeChooser);

  // The room opens only after the CV–job match has been scored: the interview
  // plan is built from that match, and the candidate should see the score first.
  const hasMatchScore = Boolean(result) && !loading && !error;
  // The threshold the backend enforces when it creates the session.
  const entryPolicy = useInterviewEntryPolicy();
  const entry = hasMatchScore && result ? evaluateEntry(result, entryPolicy) : null;
  const canEnterRoom = Boolean(entry?.allowed);
  const entryBlockedText = entry && !entry.allowed && entry.reason
    ? fmt(t(entryBlockMessageKey(entry.reason)), { score: entry.percentage ?? "", min: entryPolicy.minMatchPercent })
    : null;
  // Practice mode: a CV far from the job confirms once before the mode chooser.
  const [entryWarningOpen, setEntryWarningOpen] = useState(false);
  const [entryConfirmed, setEntryConfirmed] = useState(false);
  const openModeChooser = () => {
    if (!canEnterRoom) return;
    setInterviewStartError(null);
    if (entry?.needsConfirmation && !entryConfirmed) {
      setEntryWarningOpen(true);
      return;
    }
    setShowModeChooser(true);
  };

  const handleStartInterview = async (
    mode: "chat" | "voice" | "video",
    experience?: "question_practice" | "interview_chat"
  ) => {
    if (startingInterview) return;
    if (!candidateId || !jobId) {
      setInterviewStartError("fit.page.missingContext");
      return;
    }
    if (!hasMatchScore || !canEnterRoom) {
      setInterviewStartError(hasMatchScore ? null : "fit.page.scoreRequired");
      return;
    }
    setInterviewStartError(null);
    setStartingInterview(true);
    try {
      const activeJobTitle = jobProfile?.title || queryJobTitle || t("fit.page.defaultJobTitle");
      const targetUrl = await startInterviewSession({
        mode,
        experience,
        lang: lang === "vi" ? "vi" : "en",
        jobTitle: activeJobTitle,
        candidateId,
        jobId,
        durationMinutes,
        focusArea,
        reaskConceptId,
      });
      setStartStage(2);
      router.push(targetUrl);
    } catch (cause) {
      setStartingInterview(false);
      setInterviewStartError(describeStartInterviewError(cause, t));
    }
  };

  const displayJobTitle = jobProfile?.title || queryJobTitle || t("fit.page.defaultJobTitle");

  // Staged status text while the existing loading flags are on. The request is
  // a single round trip, so these are time-based captions, not real progress.
  const busy = loading || resolving;
  const [loadingStage, setLoadingStage] = useState(0);
  useEffect(() => {
    if (!busy) return;
    const timers = [
      window.setTimeout(() => setLoadingStage(1), 2500),
      window.setTimeout(() => setLoadingStage(2), 6000),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setLoadingStage(0);
    };
  }, [busy]);
  const loadingPhases = [
    "uxWs.cvScore.stage.resolving",
    "uxWs.cvScore.stage.reading",
    "uxWs.cvScore.stage.matching",
    "uxWs.cvScore.stage.summarizing",
  ].map((key) => t(key).replace(/…$/, ""));

  return (
    <UserDashboardShell>
      <main className="min-h-screen min-w-0 overflow-x-clip px-4 pb-16 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1280px]">
          {/* Top Bar / Navigation */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/dashboard/jobs");
                }
              }}
              className="-ml-2 inline-flex h-9 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#204195]"
            >
              <span aria-hidden="true">←</span>
              <span>{t("fit.page.back")}</span>
            </button>
          </div>

          <WorkspacePageHeader
            className="mb-6"
            title={t("fit.page.crumbReport")}
            subtitle={hasNoContext ? t("fit.page.emptyDesc") : t("uxWs.cvScore.subtitle")}
            aside={
              !resolving && !hasNoContext ? (
                <div className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {jobProfile?.company?.logoUrl && !logoError ? (
                      <img
                        src={jobProfile.company.logoUrl}
                        alt={jobProfile.company.name || t("fixApp.jobs.companyLogo")}
                        onError={() => setLogoError(true)}
                        className="size-12 shrink-0 rounded-2xl object-cover ring-1 ring-[#DCE4F3]"
                        loading="lazy"
                      />
                    ) : jobProfile?.company?.name ? (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F8FAFC] text-base font-semibold text-[#204195] ring-1 ring-[#DCE4F3]">
                        {getCompanyInitials(jobProfile.company.name)}
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {jobProfile?.company?.name && (
                        <p className="text-xs font-semibold text-[#607096] [overflow-wrap:anywhere]">{jobProfile.company.name}</p>
                      )}
                      <p className="mt-0.5 text-base font-bold leading-snug text-[#14244B] [overflow-wrap:anywhere] sm:text-lg">
                        {displayJobTitle}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-[#607096]">
                    {[
                      jobProfile?.location || null,
                      jobProfile?.workMode
                        ? jobProfile.workMode === "remote"
                          ? t("fit.page.workMode.remote")
                          : jobProfile.workMode === "hybrid"
                          ? t("fit.page.workMode.hybrid")
                          : t("fit.page.workMode.onsite")
                        : null,
                      jobProfile?.experience ? formatExperience(jobProfile.experience, lang) : null,
                    ]
                      .filter(Boolean)
                      .map((part, index) => (
                        <span key={index} className="min-w-0 [overflow-wrap:anywhere]">
                          {index > 0 && <span aria-hidden="true" className="mr-2">·</span>}
                          {part}
                        </span>
                      ))}
                  </p>
                  {jobProfile?.salary && (
                    <p className="mt-1 text-xs font-semibold text-[#287A4B]">
                      {formatSalary(jobProfile.salary, undefined, lang)}
                    </p>
                  )}
                  {cvFileName && (
                    <p className="mt-3 border-t border-[#EAEFF8] pt-3 text-xs text-[#607096] [overflow-wrap:anywhere]">
                      {t("fixApp.cvScore.cvLabel")} <span className="font-semibold text-[#14244B]">{cvFileName}</span>
                    </p>
                  )}
                </div>
              ) : undefined
            }
          >
            {!resolving && !hasNoContext && (
              <>
                <button
                  type="button"
                  onClick={openModeChooser}
                  disabled={startingInterview || !canEnterRoom}
                  aria-disabled={startingInterview || !canEnterRoom}
                  title={entryBlockedText ?? (!hasMatchScore && !loading ? t("fit.page.scoreRequired") : undefined)}
                  className="inline-flex h-10 items-center rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {startingInterview
                    ? t("fit.page.creatingRoom")
                    : loading
                    ? t("fit.page.waitingScore")
                    : t("fit.page.practiceNow")}
                </button>
                <Link
                  href={`/dashboard/jobs/${jobId}`}
                  className="inline-flex h-10 items-center rounded-xl border border-[#DCE4F3] bg-white px-4 text-sm font-semibold text-[#204195] transition-colors hover:bg-[#F8FAFC]"
                >
                  {t("fit.page.viewJd")}
                </Link>
                {!loading && !canEnterRoom && (
                  <p role="status" className="basis-full text-xs font-medium text-[#B45309]">
                    {entryBlockedText ?? t("fit.page.scoreRequired")}
                  </p>
                )}
                {entry?.allowed && (
                  <PracticeTierNote className="basis-full sm:max-w-xl" decision={entry} policy={entryPolicy} />
                )}
              </>
            )}
          </WorkspacePageHeader>


          {showModeChooser && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6">
              <div
                className="absolute inset-0 bg-[#14244B]/45"
                aria-hidden="true"
                onClick={() => !startingInterview && setShowModeChooser(false)}
              />
              <div
                ref={modeDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="interview-mode-title"
                aria-busy={startingInterview}
                tabIndex={-1}
                className="anim-pop relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white ring-1 ring-[#DCE4F3] outline-none"
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#EAEFF8] px-6 py-5 sm:px-7">
                  <h2 id="interview-mode-title" className="text-lg font-bold text-[#14244B]">
                    {t("fit.mode.question")}
                  </h2>
                  <button
                    type="button"
                    onClick={closeModeChooser}
                    disabled={startingInterview}
                    aria-label={t("fit.page.close")}
                    className="shrink-0 rounded-full p-2 text-[#607096] transition-colors hover:bg-[#F8FAFC] hover:text-[#14244B] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="border-b border-[#EAEFF8] bg-[#F8FAFC] px-6 py-4 sm:px-7">
                  {reaskConceptId && reaskSkill && (
                    <p className="mb-3 rounded-xl bg-[#EEF3FF] px-3 py-2 text-xs font-semibold text-[#204195] ring-1 ring-[#C9D6F5]">
                      {fmt(t("practiceProgress.reask.banner"), { skill: reaskSkill })}
                    </p>
                  )}
                  {focusArea && (
                    <p className="mb-3 rounded-xl bg-[#EEF3FF] px-3 py-2 text-xs font-semibold text-[#204195] ring-1 ring-[#C9D6F5]">
                      {fmt(t("practiceProgress.focus.banner"), { round: t(`practiceProgress.area.${focusArea}`) })}
                    </p>
                  )}
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#607096]">
                      {t("fit.mode.duration")}
                    </span>
                    <span className="text-[11px] text-[#607096]">
                      {t("fit.mode.durationHint")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { minutes: DEMO_DURATION_MINUTES, label: t("fixApp.mode.demo"), time: fmt(t("fit.mode.minutes"), { n: DEMO_DURATION_MINUTES }), q: fmt(t("fit.mode.questions"), { n: totalQuestionCount(DEMO_DURATION_MINUTES) }), tag: t("fit.mode.tag.demo") },
                      { minutes: 15, label: t("fixApp.mode.flash"), time: fmt(t("fit.mode.minutes"), { n: 15 }), q: fmt(t("fit.mode.questions"), { n: totalQuestionCount(15) }), tag: t("fit.mode.tag.flash") },
                      { minutes: 25, label: t("fixApp.mode.standard"), time: fmt(t("fit.mode.minutes"), { n: 25 }), q: fmt(t("fit.mode.questions"), { n: totalQuestionCount(25) }), tag: t("fit.mode.tag.standard") },
                      { minutes: 45, label: t("fixApp.mode.deep"), time: fmt(t("fit.mode.minutes"), { n: 45 }), q: fmt(t("fit.mode.questions"), { n: totalQuestionCount(45) }), tag: t("fit.mode.tag.deep") },
                    ].map((pkg) => {
                      const active = durationMinutes === pkg.minutes;
                      return (
                        <button
                          key={pkg.minutes}
                          type="button"
                          onClick={() => setDurationMinutes(pkg.minutes)}
                          className={`flex flex-col rounded-2xl border p-2.5 text-left transition-all ${
                            active
                              ? "border-[#204195] bg-white ring-2 ring-[#204195]"
                              : "border-[#DCE4F3] bg-white hover:border-[#204195]/40"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className={`text-xs font-bold ${active ? "text-[#204195]" : "text-[#14244B]"}`}>
                              {pkg.label}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                active ? "bg-[#204195] text-white" : "bg-[#F0F4FC] text-[#607096]"
                              }`}
                            >
                              {pkg.time}
                            </span>
                          </div>
                          <span className="mt-1 text-[11px] font-semibold text-[#204195]">
                            • {pkg.q}
                          </span>
                          <span className="text-[10px] text-[#607096]">{pkg.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-7">
                  {[
                    {
                      key: "interview_chat",
                      title: t("mode.chat.name"),
                      desc: t("mode.chat.desc"),
                      meta: t("mode.chat.needs"),
                      badge: t("mode.recommended"),
                      action: () => void handleStartInterview("chat", "interview_chat"),
                      disabled: false,
                      cta: t("userDash.mode.chat.cta"),
                    },
                    {
                      key: "voice",
                      title: t("mode.voice.name"),
                      desc: t("mode.voice.desc"),
                      meta: t("mode.voice.needs"),
                      badge: null,
                      action: () => void handleStartInterview("voice"),
                      disabled: false,
                      cta: t("userDash.mode.chat.cta"),
                    },
                    {
                      key: "video",
                      title: t("mode.video.name"),
                      desc: t("mode.video.desc"),
                      meta: t("mode.video.needs"),
                      badge: null,
                      action: () => void handleStartInterview("video"),
                      disabled: false,
                      cta: t("userDash.mode.chat.cta"),
                    },
                  ].map(({ key, title, desc, meta, badge, action, disabled, cta }) => (
                    <button
                      key={key}
                      type="button"
                      disabled={disabled || startingInterview}
                      onClick={action}
                      className={`group flex min-h-[220px] flex-col rounded-3xl border p-5 text-left transition-colors ${
                        disabled
                          ? "border-[#DCE4F3] bg-[#F8FAFC] opacity-70 cursor-not-allowed"
                          : "border-[#DCE4F3] bg-white hover:border-[#204195]/60 hover:bg-[#F8FAFC] disabled:cursor-wait disabled:opacity-60"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-lg font-semibold text-[#14244B]">{title}</span>
                        {badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              disabled
                                ? "bg-[#FFF8E6] text-[#8A5A00]"
                                : "bg-[#EAF5EE] text-[#287A4B] border border-[#287A4B]/25"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                      <span className="mt-2 flex-1 text-xs leading-5 text-[#607096]">{desc}</span>
                      <span className="mt-3 w-fit rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-semibold text-[#607096]">
                        {meta}
                      </span>
                      <span
                        className={`mt-4 flex w-full items-center justify-between border-t border-[#EAEFF8] pt-4 text-sm font-semibold ${
                          disabled ? "text-[#607096]" : "text-[#204195]"
                        }`}
                      >
                        <span>{startingInterview && !disabled ? t("fit.mode.preparing") : cta}</span>
                        {!startingInterview && !disabled && (
                          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>

                {startingInterview && (
                  <div className="border-t border-[#EAEFF8] px-6 py-4 sm:px-7">
                    <ProcessStatus
                      phases={[t("fixApp.start.creating"), t("fixApp.start.questions"), t("fixApp.start.opening")]}
                      activeIndex={startStage}
                    />
                  </div>
                )}

                {interviewStartError && (
                  <div className="border-t border-[#EAEFF8] bg-[#FDF2F2] px-6 py-3 text-sm font-medium text-[#C43B3B] sm:px-7" role="alert">
                    {t(interviewStartError)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading or Resolving State: what the system is doing, phase by phase. */}
          {(loading || resolving) && (
            <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3] sm:p-8">
              <h3 className="text-lg font-bold text-[#14244B]">{t("fit.page.loadingTitle")}</h3>
              <p className="mt-1 text-sm text-[#607096]">{t("fit.page.loadingDesc")}</p>
              <ProcessStatus
                className="mt-5"
                phases={loadingPhases}
                activeIndex={resolving ? 0 : loadingStage + 1}
              />
            </div>
          )}

          {/* Empty State when no context is selected */}
          {!resolving && hasNoContext && (
            <section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 text-center sm:p-14">
              <h2 className="mt-4 text-lg font-bold text-[#14244B]">{t("fit.page.emptyTitle")}</h2>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard/jobs"
                  className="inline-flex h-10 items-center rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
                >
                  {t("fit.page.exploreJobs")}
                </Link>
                <Link
                  href="/dashboard/cvs"
                  className="inline-flex h-10 items-center rounded-xl border border-[#DCE4F3] bg-white px-4 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#F0F4FC]"
                >
                  {t("fit.page.manageCvs")}
                </Link>
              </div>
            </section>
          )}

          {/* Error State */}
          {!loading && !resolving && !hasNoContext && error && (
            <section className="space-y-4">
              <StatusNote tone="error" text={`${t("fit.page.errorTitle")}. ${t(error)}`} hint={t("uxWs.cvScore.errorHint")} />
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex h-10 items-center rounded-xl bg-[#204195] px-5 sm:ml-[54px] text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                {t("fit.page.retry")}
              </button>
            </section>
          )}

          {/* Scoring Report Content */}
          {!loading && !resolving && !hasNoContext && !error && result && (
            <ReportContent
              result={result}
              jobProfile={jobProfile}
              cvData={cvData}
              requirementsMap={requirementsMap}
              candidateId={candidateId}
              jobId={jobId}
              onMatchUpdated={handleMatchingResult}
              onChooseInterviewMode={openModeChooser}
              startingInterview={startingInterview}
            />
          )}
        </div>
      </main>
      <EntryWarningDialog
        decision={entryWarningOpen ? entry : null}
        lowFitPercent={entryPolicy.lowFitPercent}
        onCancel={() => setEntryWarningOpen(false)}
        onConfirm={() => {
          setEntryWarningOpen(false);
          setEntryConfirmed(true);
          setShowModeChooser(true);
        }}
      />
    </UserDashboardShell>
  );
}

/* ── Detailed Report Sub-Components ── */

export function ReportContent({
  result,
  jobProfile,
  requirementsMap,
  cvData,
  candidateId,
  jobId,
  onMatchUpdated,
  onChooseInterviewMode,
  startingInterview = false,
}: {
  result: CvScoringResponse;
  jobProfile?: JobProfile | null;
  requirementsMap: Map<string, { label: string; kind?: string; priority?: string }>;
  cvData?: UserCvDto | null;
  candidateId?: string;
  jobId?: string;
  onMatchUpdated?: (result: MatchResult) => void;
  /** Opens the interview mode chooser (same as the header button). */
  onChooseInterviewMode?: () => void;
  startingInterview?: boolean;
}) {
  const { t } = useLanguage();
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
      matchEvidence: result.matchResult?.evidence,
      requirementsMap,
      resolveReasonCodeText: (code?: string) => resolveReasonCodeText(code, t),
      t,
    });
  }, [requirementItems, jobProfile, cvData, requirementsMap, result.matchResult?.evidence, t]);

  // Factor results — ONLY Truthful backend factors, NO synthetic fabrication
  const factors: FactorResult[] = useMemo(() => {
    return Array.isArray(result.factorResults) ? result.factorResults : [];
  }, [result.factorResults]);

  // Unknown / not-applicable compatibility rows do not help the candidate make
  // a decision. Only surface a concrete match or conflict.
  const informativeCompatibility = useMemo(
    () =>
      (result.compatibilityResults ?? []).filter(
        (item) => item.status === "compatible" || item.status === "incompatible"
      ),
    [result.compatibilityResults]
  );

  const nextAction = useMemo(() => {
    const statuses = result.requirementResults?.map((item) => item.status) ?? [];
    if (statuses.includes("not_met")) {
      return {
        kind: "review" as const,
        title: t("fit.next.review.title"),
        description: t("fit.next.review.desc"),
      };
    }
    if (statuses.includes("unknown")) {
      return {
        kind: "update" as const,
        title: t("fit.next.update.title"),
        description: t("fit.next.update.desc"),
      };
    }
    if (result.eligibility === "eligible") {
      return {
        kind: "interview" as const,
        title: t("fit.next.interview.title"),
        description: t("fit.next.interview.desc"),
      };
    }
    return null;
  }, [result.eligibility, result.requirementResults, t]);

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
        {nextAction && (
          <section className="rounded-2xl border border-[#DCE4F3] border-l-4 border-l-[#D99A19] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#204195]">{t("fit.next.eyebrow")}</p>
                <h3 className="mt-1 text-lg font-bold text-[#14244B]">
                  {nextAction.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#607096]">{nextAction.description}</p>
              </div>

              {nextAction.kind === "update" ? (
                <Link
                  href="/dashboard/cvs"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
                >
                  {t("fit.next.updateCv")}
                </Link>
              ) : nextAction.kind === "review" ? (
                <a
                  href="#criteria-review"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
                >
                  {t("fit.next.reviewCta")}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onChooseInterviewMode}
                  disabled={startingInterview}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:opacity-50"
                >
                  {t("fit.next.interviewCta")}
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── Candidate Job Match Details UI (ATS / SaaS design) ── */}
      <div id="criteria-review" className="scroll-mt-6">
        <CandidateMatchDetails
          requirements={humanizedRequirements}
          groups={requirementGroups}
          candidateId={candidateId}
          jobId={jobId}
          onMatchUpdated={onMatchUpdated}
          cvRawText={cvData?.rawText}
          cvContentType={cvData?.contentType}
          cvFileName={cvData?.originalName}
        />
      </div>

      {/* ── Section: Competency Factors — collapsed by default ── */}
      {factors.length > 0 && (
        <details className="group overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 group-open:border-b group-open:border-[#EAEFF8]">
            <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-lg font-bold text-[#14244B]">{t("fit.factors.title")}</span>
              <span className="text-xs text-[#607096]">{t("fit.factors.subtitle")}</span>
            </div>
            <svg className="size-4 text-[#9AA6C2] transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </summary>

        {/* display:none while closed, so the folded cards take no layout space. */}
        {factors.length > 0 ? (
          <div className="hidden grid-cols-1 gap-3.5 p-5 group-open:grid sm:grid-cols-2 lg:grid-cols-4">
            {factors.map((f, idx) => {
              const info = getFactorLabel(f.factor, t);
              const isScored = f.status === "scored" && typeof f.rawScore === "number";
              const factorScore = isScored ? Math.round(f.rawScore! * 100) : null;

              const barColor =
                factorScore !== null
                  ? factorScore >= 70
                    ? "bg-[#287A4B]"
                    : factorScore >= 45
                    ? "bg-[#204195]"
                    : factorScore >= 30
                    ? "bg-[#FCB625]"
                    : "bg-[#C43B3B]"
                  : "bg-[#C9D7F1]";

              return (
                <div
                  key={`${f.factor}-${idx}`}
                  className="flex min-w-0 flex-col justify-between rounded-2xl bg-[#F8FAFC] p-4"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-[#14244B]">{info.label}</h4>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#607096]">{info.desc}</p>
                  </div>

                  <div className="mt-3.5">
                    {f.status === "scored" && factorScore !== null ? (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#607096]">{t("fit.factors.achieved")}</span>
                          <span className="font-bold text-[#14244B]">{factorScore}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#DCE4F3]">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${factorScore}%` }}
                          />
                        </div>
                      </>
                    ) : f.status === "not_applicable" ? (
                      <div className="flex items-center justify-between rounded-xl bg-[#F0F4FC] px-2.5 py-1 text-xs">
                        <span className="text-[#607096] font-medium">{t("fit.factors.status")}</span>
                        <span className="font-semibold text-[#607096]">{t("fit.status.notApplicable")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-[#F0F4FC] px-2.5 py-1 text-xs">
                        <span className="text-[#607096] font-medium">{t("fit.factors.status")}</span>
                        <span className="font-semibold text-[#607096]">{t("fit.status.unknown")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="m-5 hidden rounded-2xl bg-[#F8FAFC] p-6 text-center text-xs text-[#607096] group-open:block">
            {t("fit.factors.empty")}
          </div>
        )}
        </details>
      )}


      {/* Insight cards removed — data is surfaced in criteria list */}

      {/* ── Section: Workplace Compatibility ── */}
      {informativeCompatibility.length > 0 && (
        <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6">
          <h3 className="text-lg font-bold text-[#14244B]">{t("fit.compat.title")}</h3>
          <p className="mt-0.5 text-xs text-[#607096]">{t("fit.compat.subtitle")}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {informativeCompatibility.map((c: CompatibilityResult, idx: number) => {
              const compatInfo = resolveCompatibilityInfo(c.status, c.criterion, t);
              const title = c.criterion === "work_mode" ? t("fit.compat.workMode") : t("fit.compat.location");
              return (
                <div key={idx} className={`min-w-0 rounded-2xl border p-3.5 ${compatInfo.boxBg}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#14244B]">{title}</h4>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${compatInfo.badgeClass}`}>
                        {compatInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#607096] [overflow-wrap:anywhere]">{resolveReasonCodeText(c.reasonCode, t)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Section: System Warnings ── */}
      {result.warnings && result.warnings.length > 0 && (
        <section className="rounded-2xl bg-[#F0F4FC] p-5">
          <div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#14244B]">{t("fit.warn.title")}</h3>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-[#607096]">
                {result.warnings.map((w, index) => (
                  <li key={`${w}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#9AA6C2]" aria-hidden="true" />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{resolveWarningText(w, t)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

export default function CvScorePage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-4 ring-1 ring-[#DCE4F3]">
            <span className="text-sm font-semibold text-[#607096]">{t("fit.page.suspense")}</span>
          </div>
        </div>
      }
    >
      <ScorePageContent />
    </Suspense>
  );
}
