"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useNavigationLoading } from "@/components/NavigationLoadingProvider";
import {
  createSession,
  generateInterviewQuestions,
  scoreCvAgainstJobProfile,
  type CvScoringResponse,
} from "@/lib/aiService";
import { jobProfileApi, type JobProfile } from "@/services/jobProfileApi";
import PdfEvidenceVisualizer from "@/components/pdf-visualizer/PdfEvidenceVisualizer";
import EvidenceComparePanel from "@/components/pdf-visualizer/EvidenceComparePanel";
import { userCvApi, type UserCvDto } from "@/services/userCvApi";
import { startDemoVideoInterviewRoom } from "@/utils/demoInterviewSession";
import { resolveBackendErrorMessage } from "@/utils/backendError";

const SELECTED_CV_SESSION_KEY = "interview.selectedCvId";
const SCORE_CONTEXT_SESSION_KEY = "interview.cvScoreContext";

type NormalizedCriterion = {
  key: string;
  name: string;
  type: string;
  importance: number;
  match: number;
  score: number;
  evidence: string;
};

type ScoreContext = {
  candidateId: string;
  jobId: string;
  jobTitle?: string;
};

type CachedScorePayload = {
  candidateId: string;
  jobId: string;
  result: CvScoringResponse;
  jobProfile: JobProfile | null;
  candidate: UserCvDto | null;
};

type ScoreHistoryState = {
  __cvScoreCache?: CachedScorePayload;
};

function safeText(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidScoreResponse(value: unknown): value is CvScoringResponse {
  if (!isRecord(value)) return false;
  if (!isRecord(value.score)) return false;
  return (
    typeof value.decision === "string" &&
    typeof value.score.raw === "number" &&
    typeof value.score.max === "number" &&
    typeof value.score.normalized === "number" &&
    typeof value.score.percentage === "number"
  );
}

function readHistoryScoreCache() {
  if (typeof window === "undefined") return null;
  const state = window.history.state as ScoreHistoryState | null;
  return state?.__cvScoreCache ?? null;
}

function writeHistoryScoreCache(payload: CachedScorePayload) {
  if (typeof window === "undefined") return;
  const prev = (window.history.state ?? {}) as Record<string, unknown>;
  const nextState: ScoreHistoryState & Record<string, unknown> = {
    ...prev,
    __cvScoreCache: payload,
  };
  window.history.replaceState(nextState, "");
}

function normalizeResult(result: CvScoringResponse) {
  const criteriaBreakdown: NormalizedCriterion[] = Array.isArray(result.criteriaBreakdown)
    ? result.criteriaBreakdown.map((item, index) => {
        const safe = item as Record<string, unknown>;
        const criterionLabel = safeText(safe.criterion ?? safe.name, `Criterion ${index + 1}`);
        const detailsLabel = safeText(safe.details ?? safe.evidence, "-");
        const matchValue = safeNumber(safe.match_score ?? safe.match);
        return {
          key: `${criterionLabel}-${index}`,
          name: criterionLabel,
          type: safeText(safe.type, "criterion"),
          importance: safeNumber(safe.importance),
          match: matchValue,
          score: safeNumber(safe.score, matchValue),
          evidence: detailsLabel,
        };
      })
    : [];

  const hardFilterReasons = Array.isArray(result.hardFilters?.reasons)
    ? result.hardFilters.reasons.filter((reason): reason is string => typeof reason === "string" && reason.trim().length > 0)
    : [];
  const strengths = Array.isArray(result.summary?.strengths)
    ? result.summary.strengths.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const weaknesses = Array.isArray(result.summary?.weaknesses)
    ? result.summary.weaknesses.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const suggestions = Array.isArray(result.summary?.suggestions)
    ? result.summary.suggestions.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    criteriaBreakdown,
    hardFilterReasons,
    strengths,
    weaknesses,
    suggestions,
  };
}

function getFeaturedCriterionIndex(items: NormalizedCriterion[]) {
  if (!items.length) return -1;

  let bestIndex = 0;
  for (let i = 1; i < items.length; i += 1) {
    const current = items[i];
    const best = items[bestIndex];

    if (current.importance > best.importance) {
      bestIndex = i;
      continue;
    }
    if (current.importance < best.importance) continue;

    if (current.score > best.score) {
      bestIndex = i;
      continue;
    }
    if (current.score < best.score) continue;

    if (current.match > best.match) {
      bestIndex = i;
    }
  }

  return bestIndex;
}

export default function CvScorePage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CvScoringResponse | null>(null);
  const [jobProfile, setJobProfile] = useState<JobProfile | null>(null);
  const [candidate, setCandidate] = useState<UserCvDto | null>(null);
  const [context, setContext] = useState<ScoreContext | null>(null);
  const [startingRoom, setStartingRoom] = useState(false);
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"overview" | "visual">("overview");
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);

  const normalized = useMemo(() => (result ? normalizeResult(result) : null), [result]);

  const allMatchedSnippets = useMemo(() => {
    if (!result?.evidence) return [];
    const snippets = new Set<string>();
    
    const groups = [
      result.evidence.must_have,
      result.evidence.nice_to_have,
      result.evidence.constraints,
    ];
    
    groups.forEach((group) => {
      if (Array.isArray(group)) {
        group.forEach((item: any) => {
          if (item?.status === "matched" && Array.isArray(item.snippets)) {
            item.snippets.forEach((s: any) => {
              if (typeof s === "string" && s.trim()) {
                snippets.add(s.trim());
              }
            });
          }
        });
      }
    });
    
    return Array.from(snippets);
  }, [result]);
  const isPass = result?.decision === "PASS";
  const score = safeNumber(result?.score?.percentage, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const queryCandidateId = searchParams.get("candidateId")?.trim() ?? "";
    const queryJobId = searchParams.get("jobId")?.trim() ?? "";
    const queryJobTitle = searchParams.get("jobTitle")?.trim() ?? "";

    let fallbackContext: ScoreContext | null = null;
    try {
      const raw = sessionStorage.getItem(SCORE_CONTEXT_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ScoreContext>;
        if (parsed.candidateId && parsed.jobId) {
          fallbackContext = {
            candidateId: String(parsed.candidateId),
            jobId: String(parsed.jobId),
            jobTitle: typeof parsed.jobTitle === "string" ? parsed.jobTitle : undefined,
          };
        }
      }
    } catch {
      fallbackContext = null;
    }

    const candidateId = queryCandidateId || fallbackContext?.candidateId || "";
    const jobId = queryJobId || fallbackContext?.jobId || "";
    const jobTitle = queryJobTitle || fallbackContext?.jobTitle || "";

    if (!candidateId || !jobId) {
      setError(t("interview.cvAnalysis.missingJob"));
      setLoading(false);
      return;
    }

    setContext({ candidateId, jobId, jobTitle });
    setLoading(true);
    setError(null);
    setResult(null);
    setJobProfile(null);
    setCandidate(null);

    const cached = readHistoryScoreCache();
    if (
      cached &&
      cached.candidateId === candidateId &&
      cached.jobId === jobId &&
      isValidScoreResponse(cached.result)
    ) {
      setResult(cached.result);
      setJobProfile(cached.jobProfile ?? null);
      setCandidate(cached.candidate ?? null);
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const [scoreResponse, jobResponse, candidateResponse] = await Promise.all([
          scoreCvAgainstJobProfile({ candidateId, jobId }),
          jobProfileApi.get(jobId).then((response) => response.data).catch(() => null),
          userCvApi.get(candidateId).then((response) => response.data).catch(() => null),
        ]);

        if (!isValidScoreResponse(scoreResponse)) {
          setError(resolveBackendErrorMessage(scoreResponse, t, "userDash.myCvs.apiUploadError"));
          return;
        }

        setResult(scoreResponse);
        if (jobResponse) setJobProfile(jobResponse);
        if (candidateResponse) setCandidate(candidateResponse);

        const payload: CachedScorePayload = {
          candidateId,
          jobId,
          result: scoreResponse,
          jobProfile: jobResponse,
          candidate: candidateResponse,
        };
        writeHistoryScoreCache(payload);
      } catch (fetchError) {
        setError(resolveBackendErrorMessage(fetchError, t, "userDash.myCvs.apiUploadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, searchParams, t]);

  const continueToChat = () => {
    if (!context) return;
    try {
      sessionStorage.setItem(SELECTED_CV_SESSION_KEY, context.candidateId);
    } catch {
      /* ignore */
    }
    void (async () => {
      setStartingRoom(true);
      showNavigationLoading();
      try {
        const languageParam = lang === "vi" ? "Vietnamese" : "English";
        const res = await createSession({ type: "Chat", language: languageParam });
        try {
          sessionStorage.setItem("interview.preSessionId", res.sessionId);
        } catch {
          /* ignore */
        }
        await generateInterviewQuestions({
          sessionId: res.sessionId,
          candidateId: context.candidateId,
          jobId: context.jobId,
          language: languageParam,
          totalQuestions: 20,
          force: false,
        });
        router.push("/chat");
      } catch {
        setStartingRoom(false);
        hideNavigationLoading();
      }
    })();
  };

  const continueToVoice = () => {
    if (!context) return;
    try {
      sessionStorage.setItem(SELECTED_CV_SESSION_KEY, context.candidateId);
    } catch {
      /* ignore */
    }
    void (async () => {
      setStartingRoom(true);
      showNavigationLoading();
      try {
        const languageParam = lang === "vi" ? "Vietnamese" : "English";
        const res = await createSession({ type: "Voice", language: languageParam });
        try {
          sessionStorage.setItem("interview.preSessionId", res.sessionId);
        } catch {
          /* ignore */
        }
        await generateInterviewQuestions({
          sessionId: res.sessionId,
          candidateId: context.candidateId,
          jobId: context.jobId,
          language: languageParam,
          totalQuestions: 20,
          force: false,
        });
        router.push("/voice");
      } catch {
        setStartingRoom(false);
        hideNavigationLoading();
      }
    })();
  };

  const continueToVideo = async () => {
    if (!context || startingRoom) return;
    setStartingRoom(true);
    showNavigationLoading();
    try {
      try {
        sessionStorage.setItem(SELECTED_CV_SESSION_KEY, context.candidateId);
      } catch {
        /* ignore */
      }
      await startDemoVideoInterviewRoom(
        lang === "vi" ? "vi" : "en",
        jobProfile?.title || context.jobTitle || undefined,
        { candidateId: context.candidateId, jobId: context.jobId }
      );
    } catch {
      setStartingRoom(false);
      hideNavigationLoading();
    }
  };

  if (!mounted) return null;

  const title = isPass ? t("interview.cvAnalysis.passTitle") : t("interview.cvAnalysis.failTitle");
  const description = isPass
    ? t("interview.cvAnalysis.passDescription").replace("{score}", String(score))
    : t("interview.cvAnalysis.failDescription").replace("{score}", String(score));
  const criteriaItems = normalized?.criteriaBreakdown ?? [];
  const featuredCriterionIndex = getFeaturedCriterionIndex(criteriaItems);
  const featuredCriterion = featuredCriterionIndex >= 0 ? criteriaItems[featuredCriterionIndex] : undefined;
  const remainingCriteria = criteriaItems.filter((_, index) => index !== featuredCriterionIndex);

  const modeModal =
    modeModalOpen && context
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
              aria-label={t("interview.cvAnalysis.close")}
              onClick={() => (startingRoom ? null : setModeModalOpen(false))}
            />
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.35)]">
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                  {t("userDash.jobCvModal.modeStepTitle")}
                </p>
                <h3 className="mt-2 font-headline text-2xl font-black tracking-tight text-slate-900">
                  {isPass ? t("interview.cvAnalysis.passCta") : t("interview.cvAnalysis.failCta")}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {t("userDash.jobCvModal.modeStepSubtitle")}
                </p>
              </div>

              <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
                <ModeCard
                  icon="chat_bubble"
                  title={t("userDash.mode.chat.title")}
                  description={t("userDash.mode.chat.desc")}
                  cta={t("userDash.mode.chat.cta")}
                  onClick={continueToChat}
                />
                <ModeCard
                  icon="settings_voice"
                  title={t("userDash.mode.voice.title")}
                  description={t("userDash.mode.voice.desc")}
                  cta={t("userDash.mode.voice.cta")}
                  onClick={continueToVoice}
                />
                <ModeCard
                  icon="videocam"
                  title={t("userDash.mode.video.title")}
                  description={t("userDash.mode.video.desc")}
                  cta={startingRoom ? t("admin.jobProfile.loading") : t("userDash.mode.video.cta")}
                  onClick={continueToVideo}
                  accent
                  loading={startingRoom}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setModeModalOpen(false)}
                  disabled={startingRoom}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("interview.cvAnalysis.later")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 translate-x-1/3 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-48 h-80 w-80 -translate-x-1/3 rounded-full bg-sky-100/80 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {modeModal}
        <div className="mb-6 flex items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => router.push("/dashboard/jobs")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">arrow_back</span>
            {t("userDash.jobCvModal.backToCv")}
          </button>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold uppercase tracking-[0.24em] text-slate-500">
              CV score
            </span>
            {context?.jobTitle ? <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">{context.jobTitle}</span> : null}
            {candidate?.originalName ? <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">{candidate.originalName}</span> : null}
          </div>
        </div>

        {loading ? (
          <section className="flex flex-1 items-center justify-center rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-[0_24px_70px_-35px_rgba(15,23,42,0.25)]">
            <div>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
              </div>
              <h1 className="font-headline text-3xl font-black tracking-tight text-slate-900">{t("interview.cvAnalysis.scoreLabel")}</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {t("interview.cvAnalysis.waitForDone")}
              </p>
            </div>
          </section>
        ) : error ? (
          <section className="flex flex-1 items-center justify-center rounded-[2rem] border border-amber-200 bg-white px-6 py-16 text-center shadow-[0_24px_70px_-35px_rgba(15,23,42,0.25)]">
            <div className="max-w-xl">
              <span className="material-symbols-outlined text-[42px] text-amber-600">warning</span>
              <h1 className="mt-4 font-headline text-3xl font-black tracking-tight text-slate-900">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => router.push("/interview/select")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {t("userDash.jobCvModal.backToCv")}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </section>
        ) : result ? (
          <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">CV score</p>
                  <h1 className="mt-2 font-headline text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    {jobProfile?.title || context?.jobTitle || title}
                  </h1>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setViewMode("overview")}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                        viewMode === "overview"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Tổng quan chấm điểm
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("visual")}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                        viewMode === "visual"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Đối chiếu trực quan PDF
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModeModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t("interview.cvAnalysis.chooseModeCta")}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {viewMode === "overview" ? (
              <div className="grid gap-0 lg:grid-cols-[1fr_0.88fr]">
              <section className="border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className={`mb-5 rounded-[1.5rem] border p-5 ${isPass ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"}`}>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] ${isPass ? "border-emerald-200 bg-white text-emerald-700" : "border-amber-200 bg-white text-amber-800"}`}>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isPass ? "check_circle" : "warning"}
                  </span>
                  {isPass ? t("interview.cvAnalysis.passBadge") : t("interview.cvAnalysis.failBadge")}
                </div>
                <h1 className="mt-4 font-headline text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
              </div>

              <div className="mb-5 rounded-[1.5rem] border p-5 border-emerald-200 bg-emerald-50/70">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{t("interview.cvAnalysis.scoreLabel")}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${isPass ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                      {result.decision}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end gap-3">
                    <span className={`font-headline text-6xl font-black tracking-tight ${isPass ? "text-emerald-700" : "text-amber-700"}`}>
                      {score.toFixed(2)}%
                    </span>
                    <span className="pb-2 text-sm font-medium text-slate-500">
                      {isPass ? t("interview.cvAnalysis.passMetricHint") : t("interview.cvAnalysis.failMetricHint")}
                    </span>
                  </div>
                  <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${isPass ? "bg-emerald-600" : "bg-amber-500"}`}
                      style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <StatTile label={t("interview.cvAnalysis.rawScoreLabel")} value={`${safeNumber(result.score?.raw)} / ${safeNumber(result.score?.max)}`} tone="slate" />
                    <StatTile label={t("interview.cvAnalysis.normalizedLabel")} value={String(safeNumber(result.score?.normalized).toFixed(2))} tone="slate" />
                    <StatTile label={t("interview.cvAnalysis.versionLabel")} value={result.metadata?.scoringVersion || "1.0"} tone="slate" />
                    <StatTile label={t("interview.cvAnalysis.decisionLabel")} value={result.decision} tone={isPass ? "emerald" : "amber"} />
                  </div>
                </div>
                <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 mt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{t("interview.cvAnalysis.hardFiltersTitle")}</p>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${result.hardFilters.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                        {result.hardFilters.passed ? t("interview.cvAnalysis.hardFiltersPassed") : t("interview.cvAnalysis.hardFiltersFailed")}
                      </span>
                      <span className="text-xs text-slate-500">{normalized?.hardFilterReasons.length ?? 0} items</span>
                    </div>
                    {normalized?.hardFilterReasons.length ? (
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                        {normalized.hardFilterReasons.map((reason) => (
                          <li key={reason} className="flex gap-2">
                            <span className="material-symbols-outlined mt-0.5 text-[18px] text-amber-600">warning</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-slate-600">{t("interview.cvAnalysis.hardFiltersClear")}</p>
                    )}
                  </div>
                </section>
              </div>
              </section>

              <aside className="space-y-5 border-t border-slate-200 p-5 sm:p-6 lg:border-l lg:border-t-0">

                <section>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{t("interview.cvAnalysis.criteriaTitle")}</p>
                      <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900">Phân rã tiêu chí</h3>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {normalized?.criteriaBreakdown.length ?? 0} items
                    </span>
                  </div>

                  <div className="mt-3 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                    {featuredCriterion ? (
                      <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.3)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">Phân rã nổi bật</p>
                            <h4 className="mt-1 text-lg font-black leading-6 text-slate-900">{featuredCriterion.name}</h4>
                          </div>

                          <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${featuredCriterion.score >= 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                            {t("interview.cvAnalysis.criteriaScore")}: {featuredCriterion.score.toFixed(2)}
                          </span>
                        
                            <p className="mt-2 text-sm leading-7 text-slate-600">{featuredCriterion.evidence}</p>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <MiniMetric label={t("interview.cvAnalysis.criteriaImportance")} value={featuredCriterion.importance.toString()} />
                          <MiniMetric label={t("interview.cvAnalysis.criteriaMatch")} value={featuredCriterion.match.toString()} />
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      {remainingCriteria.map((item) => (
                        <div key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Phân rã</p>
                              <h4 className="mt-1 text-base font-bold leading-6 text-slate-900">{item.name}</h4>
                            </div>
                            <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${item.score >= 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                              {t("interview.cvAnalysis.criteriaScore")}: {item.score.toFixed(2)}
                            </span>

                            <p className="mt-1 text-sm leading-6 text-slate-600">{item.evidence}</p>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <MiniMetric label={t("interview.cvAnalysis.criteriaImportance")} value={item.importance.toString()} />
                            <MiniMetric label={t("interview.cvAnalysis.criteriaMatch")} value={item.match.toString()} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </aside>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] p-5 sm:p-6 bg-slate-50/30">
                <div className="w-full">
                  <PdfEvidenceVisualizer
                    candidateId={context!.candidateId}
                    matchedSnippets={allMatchedSnippets}
                    scrollToSnippet={activeSnippet}
                    onScrollToSnippetEnd={() => setActiveSnippet(null)}
                  />
                </div>
                <div className="w-full">
                  <EvidenceComparePanel
                    evidence={result?.evidence || null}
                    onSnippetClick={(snippet) => setActiveSnippet(snippet)}
                  />
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                    {t("interview.cvAnalysis.summaryTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {isPass ? t("interview.cvAnalysis.passCongratsBody") : t("interview.cvAnalysis.failWarningBody")}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {normalized
                    ? `${normalized.strengths.length + normalized.weaknesses.length + normalized.suggestions.length} items`
                    : "0 items"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-3 md:grid-cols-2">
                <SummaryPanel title={t("interview.cvAnalysis.summaryStrengthsTitle")} tone="emerald" items={normalized?.strengths ?? []} />
                <SummaryPanel title={t("interview.cvAnalysis.summaryWeaknessesTitle")} tone="amber" items={normalized?.weaknesses ?? []} />
                <SummaryPanel title={t("interview.cvAnalysis.summarySuggestionsTitle")} tone="sky" items={normalized?.suggestions ?? []} />
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" | "slate" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function SummaryPanel({ title, tone, items }: { title: string; tone: "emerald" | "amber" | "sky"; items: string[] }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-sky-200 bg-sky-50 text-sky-900";

  return (
    <div className={`flex min-h-[11rem] flex-col rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold">{title}</p>
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          {items.length}
        </span>
      </div>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {items.slice(0, 4).map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">-</p>
      )}
    </div>
  );
}

function ModeCard({
  icon,
  title,
  description,
  cta,
  onClick,
  accent = false,
  loading = false,
}: {
  icon: string;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`group rounded-[1.35rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] disabled:cursor-not-allowed disabled:opacity-60 ${
        accent ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
      }`}
    >
      <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${accent ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </span>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${accent ? "text-emerald-700" : "text-slate-700"}`}>
        {cta}
        <span className={`material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5 ${loading ? "animate-spin" : ""}`}>
          {loading ? "progress_activity" : "arrow_forward"}
        </span>
      </div>
    </button>
  );
}
