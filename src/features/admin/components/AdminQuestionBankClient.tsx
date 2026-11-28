"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileQuestion, Inbox, Search, Sparkles, Trash2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { Pagination } from "@components/shared/Pagination";
import { DIFFICULTY_BANDS, questionBankApi, type QuestionBankItem, type WorkBucket, type WorkSummary } from "@features/admin/services/questionBank.service";
import ConfirmDialog from "@components/shared/ConfirmDialog";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import { lifecycleTone } from "./primitives/statusTone";

const PAGE_SIZE = 20;

/** "Tất cả", the signed-in person's work buckets, or the system-generated drafts. */
export type BankView = "all" | WorkBucket | "ai";

export function viewParams(view: BankView): { mine?: WorkBucket; source?: "ai" } {
  if (view === "all") return {};
  if (view === "ai") return { source: "ai" };
  return { mine: view };
}

/** Roles that may add questions or import a file (author or ADMIN; ADMIN commits the import). */
export function bankAbilities(roles: readonly string[]): { add: boolean; import: boolean } {
  const held = new Set(roles.map((role) => role.toUpperCase()));
  const admin = held.has("ADMIN");
  return {
    add: admin || held.has("QUESTION_AUTHOR"),
    import: admin || held.has("QUESTION_AUTHOR"),
  };
}

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
  const [view, setView] = useState<BankView>("all");
  const [work, setWork] = useState<WorkSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [retireTarget, setRetireTarget] = useState<string[] | null>(null);
  const [retiring, setRetiring] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    questionBankApi.workSummary().then(({ data }) => setWork(data)).catch(() => setWork(null));
  }, [reloadToken]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setState("loading");
        const { data } = await questionBankApi.list({
          q: searchQuery || undefined,
          difficultyBand: difficultyFilter === "all" ? undefined : difficultyFilter,
          ...viewParams(view),
          page,
          pageSize: PAGE_SIZE,
        });
        setQuestions(data.items.slice(0, PAGE_SIZE)); setTotal(data.total); setState("ready");
      } catch (error: unknown) {
        setState((error as { response?: { status?: number } }).response?.status === 403 ? "forbidden" : "error");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery, difficultyFilter, view, page, reloadToken]);

  useEffect(() => { setSelectedIds(new Set()); }, [searchQuery, difficultyFilter, view, page]);

  const pending = state === "loading";
  const abilities = work ? bankAbilities(work.roles) : { add: true, import: true };
  const canRetire = Boolean(work?.roles.some((role) => role.toUpperCase() === "ADMIN"));
  const canExport = Boolean(work?.roles.some((role) => ["ADMIN", "QUESTION_AUTHOR"].includes(role.toUpperCase())));
  const visibleIds = questions.map((question) => question.questionId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const columnCount = canExport ? 7 : 6;
  const buckets = (Object.keys(work?.buckets ?? {}) as WorkBucket[]);
  const waiting = buckets.reduce((sum, bucket) => sum + (work?.buckets[bucket] ?? 0), 0);
  const views: { key: BankView; label: string; count?: number }[] = [
    { key: "all", label: t("admin.common.all") },
    ...buckets.map((bucket) => ({ key: bucket, label: t(`adminRoles.work.${bucket}`), count: work?.buckets[bucket] })),
    { key: "ai", label: t("adminRoles.work.ai"), count: work?.generatedInReview },
  ];
  const th = "px-4 py-4 first:pl-6 last:pr-6";
  const toggleQuestion = (questionId: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(questionId)) next.delete(questionId);
    else next.add(questionId);
    return next;
  });
  const toggleVisibleQuestions = () => setSelectedIds((current) => {
    const next = new Set(current);
    if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
    else visibleIds.forEach((id) => next.add(id));
    return next;
  });
  const exportSelected = () => {
    const selected = questions.filter((question) => selectedIds.has(question.questionId));
    if (selected.length === 0) return;
    const columns = ["stable_key", "version", "status", "question", "locale", "type", "difficulty", "answer_seconds", "primary_competency", "target_roles", "skills"];
    const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = selected.map((question) => [
      question.stableKey,
      question.currentVersion.version,
      question.currentVersion.status,
      question.currentVersion.canonicalText,
      question.currentVersion.canonicalLocale,
      question.currentVersion.questionType,
      question.currentVersion.difficultyBand,
      question.currentVersion.softAnswerSeconds,
      question.taxonomy.primaryCompetency?.conceptId,
      question.taxonomy.roles.map((item) => item.conceptId).join("; "),
      question.taxonomy.skills.map((item) => item.conceptId).join("; "),
    ]);
    const csv = `\uFEFF${[columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `question-bank-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setActionMessage(fmt(t("fixAdmin.ops.qb.exportSuccess"), { n: selected.length }));
  };
  const doRetire = async () => {
    if (!retireTarget?.length) return;
    setRetiring(true);
    setActionMessage(null);
    try {
      const { data } = await questionBankApi.retire(retireTarget);
      setSelectedIds(new Set());
      setRetireTarget(null);
      setPage(1);
      setActionMessage(fmt(t("fixAdmin.ops.qb.retireSuccess"), { n: data.retiredCount }));
      setReloadToken((n) => n + 1);
    } catch {
      setActionMessage(t("fixAdmin.ops.qb.retireFailed"));
    } finally {
      setRetiring(false);
    }
  };
  return <div className="space-y-6">
    <AdminPageHeader
      title={t("admin.questionBank.title")}
      description={t("admin.questionBank.subtitle")}
      breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("admin.sidebar.questionBank") }]}
      statusBadge={<AdminStatusBadge status={state === "error" ? "error" : "info"} label={pending ? t("admin.common.loading") : t("fixAdmin.ops.common.fromCore")} />}
      primaryAction={<div className="flex flex-wrap gap-2">
        <Link href="/admin/question-bank/insights" className="inline-flex items-center gap-1.5 rounded-full border border-[#F3DFB0] bg-[#FFFBF2] px-3.5 py-2 text-xs font-semibold text-[#8A5A00] hover:bg-[#FFF6E0]"><Sparkles className="size-3.5" aria-hidden="true" />{t("bankAi.title")}</Link>
        {abilities.import && <Link href="/admin/question-bank/import" className="rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] hover:bg-[#F8FAFC]">{t("fixAdmin.ops.qb.import")}</Link>}
        {abilities.add && <Link href="/admin/question-bank/new" className="rounded-full bg-[#204195] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#183275]">{t("fixAdmin.ops.qb.add")}</Link>}
      </div>}
    />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AdminMetricCard title={t("fixAdmin.ops.qb.stat.total")} value={total} subtitle={t("fixAdmin.ops.qb.stat.totalSub")} icon={FileQuestion} isPending={pending} pendingText={t("admin.common.loading")} />
      <AdminMetricCard title={t("adminRoles.stat.waiting")} value={work ? waiting : null} subtitle={t("adminRoles.stat.waitingSub")} icon={Inbox} isPending={!work} pendingText={t("admin.common.loading")} />
      <AdminMetricCard title={t("adminRoles.stat.ai")} value={work ? work.generatedInReview : null} subtitle={t("adminRoles.stat.aiSub")} icon={Sparkles} isPending={!work} pendingText={t("admin.common.loading")} />
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("adminRoles.work.label")}>
      {views.map((item) => <button key={item.key} type="button" aria-pressed={view === item.key} onClick={() => { setView(item.key); setPage(1); }} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${view === item.key ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"}`}>
        {item.label}
        {item.count !== undefined && <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${view === item.key ? "bg-white/20" : "bg-[#EEF2FD] text-[#204195]"}`}>{item.count}</span>}
      </button>)}
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
      <div className="flex shrink-0 items-center justify-end gap-2">
        {canExport && <button type="button" onClick={exportSelected} disabled={selectedIds.size === 0 || pending} className="inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#204195] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-45"><Download className="size-4" aria-hidden="true" />{fmt(t("fixAdmin.ops.qb.exportSelected"), { n: selectedIds.size })}</button>}
        {canRetire && <button type="button" onClick={() => setRetireTarget(Array.from(selectedIds))} disabled={selectedIds.size === 0 || pending || retiring} title={t("fixAdmin.ops.qb.retireSelected")} aria-label={t("fixAdmin.ops.qb.retireSelected")} className="inline-flex size-9 items-center justify-center rounded-full border border-[#E7C9CC] bg-white text-[#A16A72] hover:bg-rose-50 hover:text-[#8F4F58] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>
    {actionMessage && <p role="status" className="rounded-xl border border-[#DCE4F3] bg-white px-4 py-3 text-sm text-[#33446B]">{actionMessage}</p>}
    <div className="overflow-hidden rounded-3xl border border-[#DCE4F3] bg-white shadow-xs">
      <div className="overflow-x-auto"><table className="w-full min-w-[940px] table-fixed text-left text-xs"><thead><tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#607096]">
        {canExport && <th className="w-12 px-3 py-4 text-center"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleQuestions} disabled={visibleIds.length === 0} aria-label={t("fixAdmin.ops.qb.selectPage")} className="size-4 rounded border-[#CBD5E1] accent-[#9FB2D4]" /></th>}
        <th className={`${th} w-[38%]`}>{t("fixAdmin.ops.qb.table.question")}</th>
        <th className={`${th} w-[18%]`}>{t("fixAdmin.ops.qb.table.competency")}</th>
        <th className={`${th} w-[10%] whitespace-nowrap text-center`}>{t("fixAdmin.ops.qb.table.difficulty")}</th>
        <th className={`${th} w-[12%] text-center`}>{t("fixAdmin.ops.qb.table.type")}</th>
        <th className={`${th} w-[10%] whitespace-nowrap text-center`}>{t("fixAdmin.ops.qb.table.duration")}</th>
        <th className={`${th} w-[12%] whitespace-nowrap text-right`}>{t("fixAdmin.ops.qb.table.status")}</th>
      </tr></thead><tbody className="divide-y divide-[#EAEFF8]">
        {pending ? <tr><td colSpan={columnCount} className="p-8 text-center text-[#607096]">{t("fixAdmin.ops.qb.loading")}</td></tr>
          : state === "forbidden" ? <tr><td colSpan={columnCount} className="p-8 text-center text-[#C43B3B]">{t("fixAdmin.ops.qb.forbidden")}</td></tr>
          : state === "error" ? <tr><td colSpan={columnCount} className="p-8"><AdminEmptyState variant="error" title={t("fixAdmin.ops.qb.errorTitle")} description={t("fixAdmin.ops.qb.errorDesc")} onRetry={() => setReloadToken((n) => n + 1)} /></td></tr>
          : questions.length === 0 ? <tr><td colSpan={columnCount} className="p-8"><AdminEmptyState title={t("fixAdmin.ops.qb.emptyTitle")} description={t("fixAdmin.ops.qb.emptyDesc")} /></td></tr>
          : questions.map((question) => <tr key={question.questionId} className="hover:bg-[#F8FAFC]">
            {canExport && <td className="px-3 py-4 text-center align-top"><input type="checkbox" checked={selectedIds.has(question.questionId)} onChange={() => toggleQuestion(question.questionId)} aria-label={fmt(t("fixAdmin.ops.qb.selectQuestion"), { key: question.stableKey })} className="size-4 rounded border-[#CBD5E1] accent-[#9FB2D4]" /></td>}
            <td className="px-4 py-4 align-top"><div className="min-w-0 space-y-1">
              <Link href={`/admin/question-bank/${question.questionId}`} title={question.stableKey} className="block font-bold text-[#14244B] [overflow-wrap:anywhere] hover:underline">{question.stableKey}</Link>
              <span className="flex flex-wrap gap-1.5">
                <span className="inline-flex rounded-md bg-[#EEF2FD] px-1.5 py-0.5 text-[11px] font-semibold text-[#204195]" title={`${t("fixAdmin.ops.qb.versionPrefix")} ${question.currentVersion.version}`}>v{question.currentVersion.version}</span>
                {question.currentVersion.generated && <span className="inline-flex rounded-md bg-[#FFF6E0] px-1.5 py-0.5 text-[11px] font-semibold text-[#8A5A00]">{t("adminRoles.aiBadge")}</span>}
              </span>
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
    <ConfirmDialog
      open={retireTarget !== null}
      title={t("fixAdmin.ops.qb.retireConfirmTitle")}
      body={retireTarget?.length === 1
        ? fmt(t("fixAdmin.ops.qb.retireConfirmSingle"), { key: questions.find((question) => question.questionId === retireTarget[0])?.stableKey ?? retireTarget[0] })
        : t("fixAdmin.ops.qb.retireConfirmBody")}
      confirmLabel={retiring ? t("admin.common.loading") : t("fixAdmin.ops.qb.retireConfirm")}
      cancelLabel={t("admin.common.cancel")}
      tone="danger"
      busy={retiring}
      onConfirm={() => void doRetire()}
      onCancel={() => setRetireTarget(null)}
    />
  </div>;
}
