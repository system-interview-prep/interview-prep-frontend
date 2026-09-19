"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import LanguageToggleButton from "@components/shared/LanguageToggleButton";
import { useLanguage } from "@/i18n/LanguageProvider";

type RubricItem = {
  labelKey: string;
  score: number;
  max: number;
};

type QuestionResult = {
  id: string;
  competencyKey: string;
  questionKey: string;
  answerSummaryKey: string;
  score: number;
  max: number;
  confidence: number;
  status: "scored" | "processing";
  scoredAtMs: number | null;
  strengthKeys: string[];
  improvementKeys: string[];
  rubric: RubricItem[];
  pendingReveal?: {
    answerSummaryKey: string;
    score: number;
    confidence: number;
    strengthKeys: string[];
    improvementKeys: string[];
    rubric: RubricItem[];
  };
};

const INITIAL_RESULTS: Omit<QuestionResult, "scoredAtMs">[] = [
  {
    id: "Q01",
    competencyKey: "interviewResults.comp.communication",
    questionKey: "interviewResults.q1.question",
    answerSummaryKey: "interviewResults.q1.summary",
    score: 8.4,
    max: 10,
    confidence: 93,
    status: "scored",
    strengthKeys: [
      "interviewResults.strength.clarity",
      "interviewResults.strength.evidence",
    ],
    improvementKeys: ["interviewResults.improve.quantifyImpact"],
    rubric: [
      { labelKey: "interviewResults.strength.clarity", score: 2.7, max: 3 },
      { labelKey: "interviewResults.strength.evidence", score: 2.8, max: 3 },
      { labelKey: "interviewResults.strength.rootCause", score: 2.9, max: 4 },
    ],
  },
  {
    id: "Q02",
    competencyKey: "interviewResults.comp.problemSolving",
    questionKey: "interviewResults.q2.question",
    answerSummaryKey: "interviewResults.q2.summary",
    score: 9.1,
    max: 10,
    confidence: 95,
    status: "scored",
    strengthKeys: [
      "interviewResults.strength.rootCause",
      "interviewResults.strength.ownership",
    ],
    improvementKeys: ["interviewResults.improve.tradeoff"],
    rubric: [
      { labelKey: "interviewResults.strength.rootCause", score: 3.7, max: 4 },
      { labelKey: "interviewResults.strength.systemThinking", score: 3.0, max: 3 },
      { labelKey: "interviewResults.strength.evidence", score: 2.4, max: 3 },
    ],
  },
  {
    id: "Q03",
    competencyKey: "interviewResults.comp.ownership",
    questionKey: "interviewResults.q3.question",
    answerSummaryKey: "interviewResults.q3.summary",
    score: 7.8,
    max: 10,
    confidence: 89,
    status: "scored",
    strengthKeys: [
      "interviewResults.strength.ownership",
      "interviewResults.strength.systemThinking",
    ],
    improvementKeys: ["interviewResults.improve.rollback"],
    rubric: [
      { labelKey: "interviewResults.strength.ownership", score: 2.6, max: 3 },
      { labelKey: "interviewResults.strength.securityMindset", score: 2.2, max: 3 },
      { labelKey: "interviewResults.strength.clarity", score: 3.0, max: 4 },
    ],
  },
  {
    id: "Q04",
    competencyKey: "interviewResults.comp.teamwork",
    questionKey: "interviewResults.q4.question",
    answerSummaryKey: "interviewResults.q4.summary",
    score: 8.0,
    max: 10,
    confidence: 90,
    status: "scored",
    strengthKeys: [
      "interviewResults.strength.collaboration",
      "interviewResults.strength.evidence",
    ],
    improvementKeys: ["interviewResults.improve.prioritization"],
    rubric: [
      { labelKey: "interviewResults.strength.collaboration", score: 2.5, max: 3 },
      { labelKey: "interviewResults.strength.clarity", score: 2.3, max: 3 },
      { labelKey: "interviewResults.strength.rootCause", score: 3.2, max: 4 },
    ],
  },
  {
    id: "Q05",
    competencyKey: "interviewResults.comp.growth",
    questionKey: "interviewResults.q5.question",
    answerSummaryKey: "interviewResults.q5.summary",
    score: 7.2,
    max: 10,
    confidence: 85,
    status: "scored",
    strengthKeys: [
      "interviewResults.strength.clarity",
      "interviewResults.strength.ownership",
    ],
    improvementKeys: ["interviewResults.improve.scope"],
    rubric: [
      { labelKey: "interviewResults.strength.clarity", score: 2.2, max: 3 },
      { labelKey: "interviewResults.strength.evidence", score: 2.0, max: 3 },
      { labelKey: "interviewResults.strength.systemThinking", score: 3.0, max: 4 },
    ],
  },
  {
    id: "Q06",
    competencyKey: "interviewResults.comp.architecture",
    questionKey: "interviewResults.q6.question",
    answerSummaryKey: "interviewResults.q6.summary",
    score: 8.7,
    max: 10,
    confidence: 92,
    status: "scored",
    strengthKeys: [
      "interviewResults.strength.systemThinking",
      "interviewResults.strength.evidence",
    ],
    improvementKeys: ["interviewResults.improve.monitoring"],
    rubric: [
      { labelKey: "interviewResults.strength.systemThinking", score: 3.6, max: 4 },
      { labelKey: "interviewResults.improve.tradeoff", score: 2.6, max: 3 },
      { labelKey: "interviewResults.strength.ownership", score: 2.5, max: 3 },
    ],
  },
  {
    id: "Q07",
    competencyKey: "interviewResults.comp.security",
    questionKey: "interviewResults.q7.question",
    answerSummaryKey: "interviewResults.processingPlaceholder",
    score: 0,
    max: 10,
    confidence: 0,
    status: "processing",
    strengthKeys: [],
    improvementKeys: [],
    rubric: [
      { labelKey: "interviewResults.strength.securityMindset", score: 0, max: 4 },
      { labelKey: "interviewResults.strength.rootCause", score: 0, max: 3 },
      { labelKey: "interviewResults.strength.ownership", score: 0, max: 3 },
    ],
    pendingReveal: {
      answerSummaryKey: "interviewResults.q7.summary",
      score: 8.3,
      confidence: 91,
      strengthKeys: [
        "interviewResults.strength.securityMindset",
        "interviewResults.strength.systemThinking",
      ],
      improvementKeys: ["interviewResults.improve.tradeoff"],
      rubric: [
        { labelKey: "interviewResults.strength.securityMindset", score: 3.4, max: 4 },
        { labelKey: "interviewResults.strength.rootCause", score: 2.3, max: 3 },
        { labelKey: "interviewResults.strength.ownership", score: 2.6, max: 3 },
      ],
    },
  },
  {
    id: "Q08",
    competencyKey: "interviewResults.comp.performance",
    questionKey: "interviewResults.q8.question",
    answerSummaryKey: "interviewResults.processingPlaceholder",
    score: 0,
    max: 10,
    confidence: 0,
    status: "processing",
    strengthKeys: [],
    improvementKeys: [],
    rubric: [
      { labelKey: "interviewResults.strength.observability", score: 0, max: 4 },
      { labelKey: "interviewResults.strength.rootCause", score: 0, max: 3 },
      { labelKey: "interviewResults.strength.ownership", score: 0, max: 3 },
    ],
    pendingReveal: {
      answerSummaryKey: "interviewResults.q8.summary",
      score: 8.8,
      confidence: 93,
      strengthKeys: [
        "interviewResults.strength.observability",
        "interviewResults.strength.rootCause",
      ],
      improvementKeys: ["interviewResults.improve.prioritization"],
      rubric: [
        { labelKey: "interviewResults.strength.observability", score: 3.5, max: 4 },
        { labelKey: "interviewResults.strength.rootCause", score: 2.7, max: 3 },
        { labelKey: "interviewResults.strength.ownership", score: 2.6, max: 3 },
      ],
    },
  },
];

function scoreTone(score: number): string {
  if (score >= 8.5) return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25";
  if (score >= 7) return "bg-amber-500/15 text-amber-700 border-amber-500/25";
  return "bg-rose-500/15 text-rose-700 border-rose-500/25";
}

function statusPill(status: QuestionResult["status"]): string {
  return status === "scored"
    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/25"
    : "bg-sky-500/15 text-sky-700 border-sky-500/25";
}

function StatCard(props: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{props.label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-on-surface">{props.value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{props.sub}</p>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
        <div className="h-4 w-40 rounded bg-surface-container-high" />
        <div className="mt-3 h-3 w-11/12 rounded bg-surface-container-high" />
        <div className="mt-2 h-3 w-4/5 rounded bg-surface-container-high" />
        <div className="mt-4 h-20 rounded-xl bg-surface-container" />
      </div>
      <div className="animate-pulse rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
        <div className="h-4 w-32 rounded bg-surface-container-high" />
        <div className="mt-3 h-3 w-10/12 rounded bg-surface-container-high" />
        <div className="mt-2 h-3 w-3/4 rounded bg-surface-container-high" />
        <div className="mt-4 h-20 rounded-xl bg-surface-container" />
      </div>
    </div>
  );
}

function CountUpNumber(props: {
  value: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
}) {
  const { value, decimals = 1, durationMs = 650, className } = props;
  const [display, setDisplay] = React.useState(value);
  const prevValueRef = React.useRef(value);

  React.useEffect(() => {
    const from = prevValueRef.current;
    const to = value;
    if (!Number.isFinite(to)) return;
    if (Math.abs(to - from) < 0.001) {
      prevValueRef.current = to;
      setDisplay(to);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = to;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}

export default function InterviewResultsPage() {
  const { t, lang } = useLanguage();
  const params = useSearchParams();
  const sessionId = params.get("sessionId")?.trim() || "";
  const [results, setResults] = React.useState<QuestionResult[]>(() => {
    const now = Date.now();
    return INITIAL_RESULTS.map((item, idx) => ({
      ...item,
      scoredAtMs:
        item.status === "scored"
          ? now - (INITIAL_RESULTS.length - idx + 2) * 60_000
          : null,
    }));
  });
  const [isBootLoading, setIsBootLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [competencyFilter, setCompetencyFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"scoreDesc" | "scoreAsc" | "latest" | "status">("scoreDesc");

  React.useEffect(() => {
    const bootTimer = window.setTimeout(() => {
      setIsBootLoading(false);
    }, 1300);

    return () => window.clearTimeout(bootTimer);
  }, []);

  React.useEffect(() => {
    if (isBootLoading) return;
    const timer = window.setInterval(() => {
      setIsRefreshing(true);
      setResults((prev) => {
        const idx = prev.findIndex((x) => x.status === "processing" && x.pendingReveal);
        if (idx < 0) return prev;
        const next = [...prev];
        const target = next[idx];
        if (!target.pendingReveal) return prev;
        next[idx] = {
          ...target,
          status: "scored",
          answerSummaryKey: target.pendingReveal.answerSummaryKey,
          score: target.pendingReveal.score,
          confidence: target.pendingReveal.confidence,
          scoredAtMs: Date.now(),
          strengthKeys: target.pendingReveal.strengthKeys,
          improvementKeys: target.pendingReveal.improvementKeys,
          rubric: target.pendingReveal.rubric,
          pendingReveal: undefined,
        };
        return next;
      });
      window.setTimeout(() => setIsRefreshing(false), 700);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [isBootLoading]);

  const scored = React.useMemo(() => results.filter((x) => x.status === "scored"), [results]);

  const competencyOptions = React.useMemo(() => {
    const keys = Array.from(new Set(results.map((r) => r.competencyKey)));
    return keys.sort((a, b) => t(a).localeCompare(t(b)));
  }, [results, t]);

  const visibleResults = React.useMemo(() => {
    let list = [...results];
    if (competencyFilter !== "all") {
      list = list.filter((item) => item.competencyKey === competencyFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "status") {
        if (a.status === b.status) return a.id.localeCompare(b.id);
        return a.status === "scored" ? -1 : 1;
      }

      if (sortBy === "latest") {
        const am = a.scoredAtMs ?? -1;
        const bm = b.scoredAtMs ?? -1;
        return bm - am;
      }

      if (sortBy === "scoreAsc") {
        const as = a.status === "scored" ? a.score : Number.POSITIVE_INFINITY;
        const bs = b.status === "scored" ? b.score : Number.POSITIVE_INFINITY;
        return as - bs;
      }

      const as = a.status === "scored" ? a.score : -1;
      const bs = b.status === "scored" ? b.score : -1;
      return bs - as;
    });

    return list;
  }, [results, competencyFilter, sortBy]);

  const processingCount = results.length - scored.length;
  const totalScore = scored.reduce((sum, x) => sum + x.score, 0);
  const totalMax = scored.reduce((sum, x) => sum + x.max, 0);
  const overallPct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const avgConfidence = scored.length > 0
    ? Math.round(scored.reduce((sum, x) => sum + x.confidence, 0) / scored.length)
    : 0;

  const topStrengths = [
    "interviewResults.strength.clarity",
    "interviewResults.strength.rootCause",
    "interviewResults.strength.systemThinking",
  ];

  const priorities = [
    "interviewResults.improve.quantifyImpact",
    "interviewResults.improve.tradeoff",
    "interviewResults.improve.scope",
  ];

  const progressText = t("interviewResults.summaryProgress")
    .replace("{scored}", String(scored.length))
    .replace("{total}", String(results.length))
    .replace("{processing}", String(processingCount));

  const systemStatusText = t("interviewResults.systemStatusBody").replace("{count}", String(processingCount));

  const formatScoredAt = React.useCallback(
    (ms: number) => {
      const locale = lang === "vi" ? "vi-VN" : "en-US";
      return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(ms));
    },
    [lang]
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#141413] font-body">

      <header className="sticky top-0 z-40 border-b border-[#E8E6DC] bg-[#FAF9F5]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">{t("interviewResults.reportTag")}</p>
            <h1 className="font-headline text-lg font-black tracking-tight sm:text-2xl">{t("interviewResults.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggleButton />
            <button
              type="button"
              className="hidden rounded-xl border border-outline-variant/35 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high sm:inline-flex"
            >
              {t("interviewResults.exportPdf")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
        {/* Congratulation Banner with Fox Mascot & Animated Score Counter */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 text-[#204195] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#FCB625]/15 blur-3xl pointer-events-none" />

          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#204195]/8 border border-[#204195]/15 px-3 py-1 text-xs font-bold text-[#204195] mb-3">
                  <span className="h-2 w-2 rounded-full bg-[#2E7D32]" /> BIÊN BẢN ĐÁNH GIÁ THỰC CHIẾN
                </div>
                <h2 className="font-headline text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Chúc mừng bạn đã hoàn thành bài phỏng vấn!
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 leading-relaxed">
                  Báo cáo phân tích tự động dựa trên ma trận kỹ năng chuẩn STAR &amp; chỉ số phản xạ giọng nói.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#F0F4FC] px-3 py-1.5 font-mono text-xs font-bold text-[#204195]">
                  ID: {sessionId || "SESSION-LIVE-2026"}
                </span>
                <span className="rounded-full bg-[#E8F5E9] px-3 py-1.5 text-xs font-bold text-[#2E7D32]">
                  ✓ Phản hồi dưới 500ms
                </span>
              </div>
            </div>

            {/* Score Ring Card */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-[#F0F4FC]/60 p-6 min-w-[200px] text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">ĐIỂM TỔNG QUAN</span>
              <div className="mt-3 flex items-baseline justify-center gap-1">
                <span className="font-headline text-5xl font-extrabold text-[#204195]">
                  <CountUpNumber value={overallPct} decimals={1} className="tabular-nums" />
                </span>
                <span className="text-sm font-bold text-slate-500">/100</span>
              </div>
              <div className="mt-4 h-2 w-36 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#FCB625]"
                  style={{ width: `${Math.max(0, Math.min(100, overallPct))}%` }}
                />
              </div>
              <p className="mt-3 text-[11px] font-bold text-slate-600">{progressText}</p>
            </div>
          </div>

          {/* STAR 4 Bento Cards Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-100 pt-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold text-[#204195] uppercase tracking-wider">S - Situation</span>
              <p className="mt-1 text-xs font-bold text-slate-900">Bối cảnh vấn đề</p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#204195] rounded-full w-[88%]" />
              </div>
              <span className="mt-2 block text-[11px] font-semibold text-slate-500">8.8/10 Rõ ràng</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold text-[#9E6C00] uppercase tracking-wider">T - Task</span>
              <p className="mt-1 text-xs font-bold text-slate-900">Nhiệm vụ cốt lõi</p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#FCB625] rounded-full w-[82%]" />
              </div>
              <span className="mt-2 block text-[11px] font-semibold text-slate-500">8.2/10 Đúng mục tiêu</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold text-[#2E7D32] uppercase tracking-wider">A - Action</span>
              <p className="mt-1 text-xs font-bold text-slate-900">Hành động thực thi</p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#2E7D32] rounded-full w-[94%]" />
              </div>
              <span className="mt-2 block text-[11px] font-semibold text-slate-500">9.4/10 Xuất sắc</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold text-[#204195] uppercase tracking-wider">R - Result</span>
              <p className="mt-1 text-xs font-bold text-slate-900">Kết quả chỉ số</p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#204195] rounded-full w-[90%]" />
              </div>
              <span className="mt-2 block text-[11px] font-semibold text-slate-500">9.0/10 Có số liệu</span>
            </div>
          </div>
        </section>

        {isBootLoading ? (
          <section className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5">
            <p className="text-sm font-semibold text-on-surface">{t("interviewResults.loading.title")}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{t("interviewResults.loading.subtitle")}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
              <ResultSkeleton />
              <div className="animate-pulse rounded-2xl border border-outline-variant/20 bg-surface p-4">
                <div className="h-4 w-28 rounded bg-surface-container-high" />
                <div className="mt-3 h-3 w-full rounded bg-surface-container-high" />
                <div className="mt-2 h-3 w-11/12 rounded bg-surface-container-high" />
                <div className="mt-2 h-3 w-8/12 rounded bg-surface-container-high" />
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("interviewResults.kpi.avgScore")}
              value={`${(scored.reduce((sum, x) => sum + x.score, 0) / Math.max(scored.length, 1)).toFixed(2)}/10`}
              sub={t("interviewResults.kpi.avgScoreSub")}
            />
            <StatCard
              label={t("interviewResults.kpi.confidence")}
              value={`${avgConfidence}%`}
              sub={t("interviewResults.kpi.confidenceSub")}
            />
            <StatCard
              label={t("interviewResults.kpi.strongAnswers")}
              value={`${scored.filter((x) => x.score >= 8.5).length}`}
              sub={t("interviewResults.kpi.strongAnswersSub")}
            />
            <StatCard
              label={t("interviewResults.kpi.processing")}
              value={`${processingCount}`}
              sub={t("interviewResults.kpi.processingSub")}
            />
          </section>
        )}

        <section className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-3 sm:p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                {t("interviewResults.filterLabel")}
              </span>
              <select
                value={competencyFilter}
                onChange={(e) => setCompetencyFilter(e.target.value)}
                className="rounded-xl border border-outline-variant/35 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              >
                <option value="all">{t("interviewResults.allCompetencies")}</option>
                {competencyOptions.map((key) => (
                  <option key={key} value={key}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                {t("interviewResults.sortLabel")}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-outline-variant/35 bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              >
                <option value="scoreDesc">{t("interviewResults.sort.scoreDesc")}</option>
                <option value="scoreAsc">{t("interviewResults.sort.scoreAsc")}</option>
                <option value="latest">{t("interviewResults.sort.latest")}</option>
                <option value="status">{t("interviewResults.sort.status")}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <div className="grid gap-4">
            {visibleResults.map((item, index) => (
              <article
                key={item.id}
                className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.35)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                      {item.id}
                    </span>
                    <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                      {t(item.competencyKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusPill(item.status)}`}
                    >
                      {item.status === "scored" ? t("interviewResults.status.scored") : t("interviewResults.status.processing")}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                        item.status === "scored"
                          ? scoreTone(item.score)
                          : "bg-slate-500/10 text-slate-700 border-slate-400/30"
                      }`}
                    >
                      {item.status === "scored" ? (
                        <>
                          <CountUpNumber value={item.score} decimals={1} className="tabular-nums" />/{item.max}
                        </>
                      ) : (
                        "--/10"
                      )}
                    </span>
                  </div>
                </div>

                {item.status === "scored" && item.scoredAtMs && (
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {t("interviewResults.scoredAt").replace("{time}", formatScoredAt(item.scoredAtMs))}
                  </p>
                )}

                <h3 className="mt-3 font-semibold leading-relaxed text-on-surface">
                  {t("interviewResults.questionLabel").replace("{n}", String(index + 1))}: {t(item.questionKey)}
                </h3>

                <div className="mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{t("interviewResults.answerSummary")}</p>
                  <p className={`mt-1 text-sm leading-relaxed text-on-surface-variant ${item.status === "processing" ? "animate-pulse" : ""}`}>
                    {t(item.answerSummaryKey)}
                  </p>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-surface-container p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{t("interviewResults.strengths")}</p>
                    <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                      {(item.strengthKeys.length > 0 ? item.strengthKeys.map((s) => t(s)) : [t("interviewResults.pendingItem")]).map((s) => (
                        <li key={s} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-surface-container p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{t("interviewResults.improvements")}</p>
                    <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                      {(item.improvementKeys.length > 0 ? item.improvementKeys.map((s) => t(s)) : [t("interviewResults.pendingItem")]).map((s) => (
                        <li key={s} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{t("interviewResults.rubric")}</p>
                  <div className="mt-2 space-y-2">
                    {item.rubric.map((r) => {
                      const pct = r.max > 0 ? (r.score / r.max) * 100 : 0;
                      return (
                        <div key={`${item.id}-${r.labelKey}`}>
                          <div className="mb-1 flex items-center justify-between text-xs text-on-surface-variant">
                            <span>{t(r.labelKey)}</span>
                            <span>{item.status === "scored" ? `${r.score.toFixed(1)}/${r.max}` : `0/${r.max}`}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${item.status === "scored" ? Math.max(0, Math.min(100, pct)) : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-on-surface-variant">
                    {item.status === "scored"
                      ? t("interviewResults.modelConfidence").replace("{value}", String(item.confidence))
                      : t("interviewResults.modelConfidencePending")}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 lg:sticky lg:top-24">
            <h3 className="font-headline text-lg font-black tracking-tight text-on-surface">{t("interviewResults.panelTitle")}</h3>

            <div className="mt-4 rounded-xl bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{t("interviewResults.topStrengths")}</p>
              <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                {topStrengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{t(s)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-xl bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{t("interviewResults.priorityImprovements")}</p>
              <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                {priorities.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>{t(s)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{t("interviewResults.systemStatus")}</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                {systemStatusText}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="rounded-xl border border-outline-variant/35 bg-surface-container px-4 py-2 text-center text-sm font-semibold text-on-surface hover:bg-surface-container-high"
              >
                {t("interviewResults.backDashboard")}
              </Link>
              <Link
                href="/chat"
                className="rounded-xl bg-primary px-4 py-2 text-center text-sm font-semibold text-on-primary hover:opacity-90"
              >
                {t("interviewResults.newSession")}
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
