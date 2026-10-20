"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminPlanTurn, type AdminSessionPlan } from "@/lib/apiClient";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

type LoadState = { status: "loading" } | { status: "error"; notFound: boolean } | { status: "ready"; data: AdminSessionPlan };

// Sources that are not an approved bank question get a warning tone, so a
// reviewer sees at a glance which questions nobody checked.
const SOURCE_TONE: Record<string, string> = {
  question_bank: "bg-[#EEF7F1] text-[#287A4B]",
  broader_skill: "bg-[#FFF7E6] text-[#8A5A00]",
  role: "bg-[#FFF7E6] text-[#8A5A00]",
  generated_unreviewed: "bg-[#FDF2F2] text-[#C43B3B]",
};

function useSourceLabel() {
  const { t } = useLanguage();
  return (source: string) => {
    const inferred = source.startsWith("~");
    const key = `adminPlan.source.${inferred ? source.slice(1) : source}`;
    const label = t(key) === key ? source : t(key);
    return inferred ? fmt(t("adminPlan.source.inferred"), { label }) : label;
  };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#14244B]">{children}</dd>
    </div>
  );
}

function TurnCard({ turn }: { turn: AdminPlanTurn }) {
  const { t } = useLanguage();
  const sourceLabel = useSourceLabel();
  const asked = turn.status !== "PLANNED";
  const tone = SOURCE_TONE[turn.source] ?? "bg-[#F1F5F9] text-[#475569]";
  return (
    <li className="rounded-xl border border-[#DCE4F3] p-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <span className="rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[#204195]">
          {turn.turnIndex + 1}. {turn.stage}
        </span>
        <span className={`rounded-full px-2 py-0.5 ${tone}`}>{sourceLabel(turn.source)}</span>
        {turn.difficulty ? (
          <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[#475569]">
            {t(`adminPlan.difficulty.${turn.difficulty}`)}
          </span>
        ) : null}
        {!asked ? <span className="text-[#8A98B8]">{t("adminPlan.turns.notAsked")}</span> : null}
        {!turn.languageOk ? (
          <span className="rounded-full bg-[#FDF2F2] px-2 py-0.5 text-[#C43B3B]">{t("adminPlan.turns.wrongLanguage")}</span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-[#14244B]">{turn.questionText}</p>

      <dl className="mt-3 grid gap-3 text-xs text-[#14244B] sm:grid-cols-2">
        {turn.target ? <Fact label={t("adminPlan.turns.target")}>{turn.target}</Fact> : null}
        {turn.objective ? <Fact label={t("adminPlan.turns.objective")}>{turn.objective}</Fact> : null}
        {turn.rubricCriteria.length ? (
          <Fact label={t("adminPlan.turns.criteria")}>{turn.rubricCriteria.join(", ")}</Fact>
        ) : null}
        <Fact label={t("adminPlan.turns.time")}>
          {turn.answerSeconds != null ? `${Math.round(turn.answerSeconds)}s` : "—"}
          {turn.softAnswerSeconds && turn.hardAnswerSeconds ? (
            <span className="ml-1 font-normal text-[#607096]">
              ({fmt(t("adminPlan.turns.timeLimit"), { soft: turn.softAnswerSeconds, hard: turn.hardAnswerSeconds })})
            </span>
          ) : null}
        </Fact>
        <Fact label={t("adminPlan.turns.score")}>{turn.score != null ? `${turn.score}/10` : "—"}</Fact>
      </dl>

      {turn.questionVersionId ? (
        <div className="mt-3 text-xs">
          <p className="font-semibold text-[#607096]">{t("adminPlan.turns.expected")}</p>
          {turn.expectedPoints.length ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[#14244B]">
              {turn.expectedPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[#8A5A00]">{t("adminPlan.turns.noExpected")}</p>
          )}
        </div>
      ) : null}

      {turn.followups.length ? (
        <ul className="mt-3 space-y-2 border-t border-[#F1F5F9] pt-3">
          {turn.followups.map((item, index) => (
            <li key={`${turn.turnId}-${index}`} className="text-xs">
              <span className="font-semibold text-[#204195]">{t(`adminPlan.followup.${item.type}`)}</span>
              <span className="ml-2 text-[#607096]">
                · {t(`adminPlan.followup.${item.generatedBy ?? "unknown"}`)}
              </span>
              <p className="mt-0.5 text-[#14244B]">{item.content}</p>
              {item.missingAspect ? (
                <p className="mt-0.5 text-[#607096]">{fmt(t("adminPlan.followup.missing"), { text: item.missingAspect })}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** `embedded`: shown as a tab of the AI journey page, without its own header and back link. */
export default function AdminSessionPlanClient({ sessionId, embedded = false }: { sessionId: string; embedded?: boolean }) {
  const { t } = useLanguage();
  const sourceLabel = useSourceLabel();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    adminApi
      .getSessionPlan(sessionId)
      .then((response) => active && setState({ status: "ready", data: response.data }))
      .catch((error: { response?: { status?: number } }) => {
        if (active) setState({ status: "error", notFound: error?.response?.status === 404 });
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  const header = embedded ? null : (
    <AdminPageHeader
      title={t("adminPlan.title")}
      description={t("adminPlan.subtitle")}
      breadcrumbs={[
        { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
        { label: t("admin.sidebar.interviews"), href: "/admin/interviews" },
        { label: sessionId.slice(0, 8) },
      ]}
    />
  );

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <p role="status" className="text-sm text-[#607096]">
            {t("adminPlan.loading")}
          </p>
        ) : (
          <AdminEmptyState
            title={t(state.notFound ? "adminPlan.notFound" : "adminPlan.loadError")}
            description=""
            variant={state.notFound ? "empty" : "error"}
          />
        )}
        {embedded ? null : (
          <Link href="/admin/interviews" className="text-sm font-semibold text-[#204195] hover:underline">
            {t("adminPlan.back")}
          </Link>
        )}
      </div>
    );
  }

  const { session, plan, turns } = state.data;
  const difficulty = plan.difficulty;
  const sources = Object.entries(plan.questionSources);

  return (
    <div className="space-y-6">
      {header}

      <AdminSection
        title={t("adminPlan.summary.title")}
        description={[session.jobTitle, session.companyName, session.candidateEmail].filter(Boolean).join(" · ")}
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label={t("adminPlan.summary.duration")}>
            {session.durationMinutes != null ? fmt(t("adminPlan.summary.minutes"), { n: session.durationMinutes }) : "—"}
          </Fact>
          <Fact label={t("adminPlan.summary.budget")}>{plan.questionBudget ?? "—"}</Fact>
          <Fact label={t("adminPlan.summary.difficulty")}>
            {difficulty ? t(`adminPlan.difficulty.${difficulty.level}`) : "—"}
            {difficulty ? (
              <span className="mt-0.5 block text-xs font-normal text-[#607096]">
                {t("adminPlan.summary.difficultySource")}: {t(`adminPlan.difficultySource.${difficulty.source}`)}
              </span>
            ) : null}
          </Fact>
          <Fact label={t("adminPlan.summary.sources")}>
            {sources.length
              ? sources.map(([source, count]) => `${sourceLabel(source)}: ${count}`).join(" · ")
              : t("adminPlan.summary.none")}
          </Fact>
          <Fact label={t("adminPlan.summary.uncovered")}>
            {plan.uncoveredTargets.length ? plan.uncoveredTargets.length : t("adminPlan.summary.none")}
          </Fact>
        </dl>
      </AdminSection>

      {plan.targets.length ? (
        <AdminSection title={t("adminPlan.targets.title")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                  <th className="py-2 pr-4">{t("adminPlan.targets.skill")}</th>
                  <th className="py-2 pr-4">{t("adminPlan.targets.importance")}</th>
                  <th className="py-2 pr-4">{t("adminPlan.targets.questions")}</th>
                  <th className="py-2">{t("adminPlan.targets.match")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF8]">
                {plan.targets.map((target) => (
                  <tr key={target.label}>
                    <td className="py-2 pr-4 font-semibold text-[#14244B]">{target.label}</td>
                    <td className="py-2 pr-4 tabular-nums">{target.importance?.toFixed(2)}</td>
                    <td className="py-2 pr-4 tabular-nums">{target.questionCount}</td>
                    <td className="py-2 text-[#607096]">{target.matchStatuses.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>
      ) : null}

      <AdminSection title={t("adminPlan.turns.title")} description={t("adminPlan.turns.description")}>
        <ol className="space-y-3">
          {turns.map((turn) => (
            <TurnCard key={turn.turnId} turn={turn} />
          ))}
        </ol>
      </AdminSection>

      {embedded ? null : (
        <Link href="/admin/interviews" className="text-sm font-semibold text-[#204195] hover:underline">
          {t("adminPlan.back")}
        </Link>
      )}
    </div>
  );
}
