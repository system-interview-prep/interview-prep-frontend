"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileQuestion, Filter, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Pagination } from "@components/shared/Pagination";
import { DIFFICULTY_BANDS, questionBankApi, type QuestionBankItem } from "@features/admin/services/questionBank.service";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import { lifecycleTone } from "./primitives/statusTone";

const PAGE_SIZE = 20;

export default function AdminQuestionBankClient() {
  const { t } = useLanguage();
  /** Translated label for an enum value, or the raw value if no key exists yet. */
  const label = (group: string, value: string) => {
    const key = `fixAdmin.ops.qb.${group}.${value}`;
    const text = t(key);
    return text && text !== key ? text : value;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "forbidden">("loading");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setState("loading");
        const { data } = await questionBankApi.list({
          q: searchQuery || undefined,
          difficultyBand: difficultyFilter === "all" ? undefined : difficultyFilter,
          page,
          pageSize: PAGE_SIZE,
        });
        setQuestions(data.items.slice(0, PAGE_SIZE)); setTotal(data.total); setState("ready");
      } catch (error: unknown) {
        setState((error as { response?: { status?: number } }).response?.status === 403 ? "forbidden" : "error");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery, difficultyFilter, page, reloadToken]);

  const pending = state === "loading";
  const th = "px-4 py-4 first:pl-6 last:pr-6";
  return <div className="space-y-6">
    <AdminPageHeader
      title={t("admin.questionBank.title")}
      description={t("admin.questionBank.subtitle")}
      breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("admin.sidebar.questionBank") }]}
      statusBadge={<AdminStatusBadge status={state === "error" ? "error" : "info"} label={pending ? t("admin.common.loading") : t("fixAdmin.ops.common.fromCore")} />}
      primaryAction={<div className="flex flex-wrap gap-2">
        <Link href="/admin/question-bank/import" className="rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] hover:bg-[#F8FAFC]">{t("fixAdmin.ops.qb.import")}</Link>
        <Link href="/admin/question-bank/new" className="rounded-full bg-[#204195] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#183275]">{t("fixAdmin.ops.qb.add")}</Link>
      </div>}
    />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AdminMetricCard title={t("fixAdmin.ops.qb.stat.total")} value={total} subtitle={t("fixAdmin.ops.qb.stat.totalSub")} icon={FileQuestion} isPending={pending} pendingText={t("admin.common.loading")} />
      <AdminMetricCard title={t("fixAdmin.ops.qb.stat.competency")} value={null} subtitle={t("fixAdmin.ops.qb.stat.competencySub")} icon={Filter} isPending pendingText={t("fixAdmin.ops.qb.stat.inDetail")} />
      <AdminMetricCard title={t("fixAdmin.ops.qb.stat.duration")} value={null} subtitle={t("fixAdmin.ops.qb.stat.durationSub")} icon={Clock} isPending pendingText={t("fixAdmin.ops.qb.stat.inDetail")} />
    </div>
    <div className="flex flex-col gap-3 rounded-3xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <label htmlFor="admin-qb-search" className="sr-only">{t("fixAdmin.ops.qb.searchLabel")}</label>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
        <input id="admin-qb-search" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="w-full rounded-full border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs text-[#14244B] focus:border-[#204195] focus:bg-white focus:outline-none" placeholder={t("fixAdmin.ops.qb.searchPlaceholder")} />
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("fixAdmin.ops.qb.difficultyFilter")}>
        {["all", ...DIFFICULTY_BANDS].map((value) => <button key={value} type="button" aria-pressed={difficultyFilter === value} onClick={() => { setDifficultyFilter(value); setPage(1); }} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${difficultyFilter === value ? "bg-[#204195] text-white" : "border border-[#DCE4F3] text-[#607096] hover:text-[#204195]"}`}>{value === "all" ? t("admin.common.all") : label("difficulty", value)}</button>)}
      </div>
    </div>
    <div className="overflow-hidden rounded-3xl border border-[#DCE4F3] bg-white shadow-xs">
      <div className="overflow-x-auto"><table className="w-full min-w-[880px] table-fixed text-left text-xs"><thead><tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#607096]">
        <th className={`${th} w-[38%]`}>{t("fixAdmin.ops.qb.table.question")}</th>
        <th className={`${th} w-[18%]`}>{t("fixAdmin.ops.qb.table.competency")}</th>
        <th className={`${th} w-[10%] whitespace-nowrap text-center`}>{t("fixAdmin.ops.qb.table.difficulty")}</th>
        <th className={`${th} w-[12%] text-center`}>{t("fixAdmin.ops.qb.table.type")}</th>
        <th className={`${th} w-[10%] whitespace-nowrap text-center`}>{t("fixAdmin.ops.qb.table.duration")}</th>
        <th className={`${th} w-[12%] whitespace-nowrap text-right`}>{t("fixAdmin.ops.qb.table.status")}</th>
      </tr></thead><tbody className="divide-y divide-[#EAEFF8]">
        {pending ? <tr><td colSpan={6} className="p-8 text-center text-[#607096]">{t("fixAdmin.ops.qb.loading")}</td></tr>
          : state === "forbidden" ? <tr><td colSpan={6} className="p-8 text-center text-[#C43B3B]">{t("fixAdmin.ops.qb.forbidden")}</td></tr>
          : state === "error" ? <tr><td colSpan={6} className="p-8"><AdminEmptyState variant="error" title={t("fixAdmin.ops.qb.errorTitle")} description={t("fixAdmin.ops.qb.errorDesc")} onRetry={() => setReloadToken((n) => n + 1)} /></td></tr>
          : questions.length === 0 ? <tr><td colSpan={6} className="p-8"><AdminEmptyState title={t("fixAdmin.ops.qb.emptyTitle")} description={t("fixAdmin.ops.qb.emptyDesc")} /></td></tr>
          : questions.map((question) => <tr key={question.questionId} className="hover:bg-[#F8FAFC]">
            <td className="px-4 py-4 align-top"><div className="min-w-0 space-y-1">
              <Link href={`/admin/question-bank/${question.questionId}`} title={question.stableKey} className="block font-bold text-[#14244B] [overflow-wrap:anywhere] hover:underline">{question.stableKey}</Link>
              <span className="inline-flex rounded-md bg-[#EEF2FD] px-1.5 py-0.5 text-[11px] font-semibold text-[#204195]" title={`${t("fixAdmin.ops.qb.versionPrefix")} ${question.currentVersion.version}`}>v{question.currentVersion.version}</span>
              <p className="line-clamp-2 break-words text-[#607096]" title={question.currentVersion.canonicalText}>{question.currentVersion.canonicalText}</p>
            </div></td>
            <td className="px-4 py-4 align-top text-[#14244B] [overflow-wrap:anywhere]">{question.taxonomy.primaryCompetency?.conceptId || "—"}</td>
            <td className="whitespace-nowrap px-4 py-4 text-center align-top text-[#14244B]">{label("difficulty", question.currentVersion.difficultyBand)}</td>
            <td className="px-4 py-4 text-center align-top text-[#14244B]">{label("type", question.currentVersion.questionType)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-center align-top text-[#14244B] tabular-nums">{question.currentVersion.softAnswerSeconds} giây</td>
            <td className="px-4 py-4 text-right align-top"><AdminStatusBadge status={lifecycleTone(question.currentVersion.status)} label={label("status", question.currentVersion.status)} className="whitespace-nowrap" /></td>
          </tr>)}
      </tbody></table></div>
      {state === "ready" && total !== null && total > PAGE_SIZE && (
        <div className="border-t border-[#EAEFF8] bg-[#F8FAFC] px-6 py-3">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  </div>;
}
