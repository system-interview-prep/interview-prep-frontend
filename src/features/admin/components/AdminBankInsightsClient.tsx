"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { useAdminRoles } from "@features/admin/useAdminRoles";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminEmptyState from "./primitives/AdminEmptyState";
import BankSuggestionCard from "./BankSuggestionCard";
import {
  bankInsightsApi,
  type BankSuggestion,
  type InsightsRun,
  type SuggestionKind,
  type SuggestionStatus,
} from "@features/admin/services/bankInsights.service";

const KINDS: SuggestionKind[] = ["RUBRIC_GAP", "REVISE", "DIFFICULTY", "VARIANT", "DUPLICATE", "RETIRE"];
const POLL_MS = 3000;

/**
 * "Đề xuất từ dữ liệu": the question bank learning from real interviews.
 * The bank admin runs the analysis; everyone in the bank roles sees the
 * suggestions and acts on the ones their role covers.
 */
export default function AdminBankInsightsClient() {
  const { t } = useLanguage();
  const roles = useAdminRoles();
  const canRun = roles.some((role) => ["ADMIN", "QUESTION_BANK_ADMIN"].includes(role.toUpperCase()));
  const [status, setStatus] = useState<SuggestionStatus>("OPEN");
  const [kind, setKind] = useState<SuggestionKind | "all">("all");
  const [items, setItems] = useState<BankSuggestion[] | null>(null);
  const [error, setError] = useState(false);
  const [run, setRun] = useState<InsightsRun | null>(null);
  const [open, setOpen] = useState<Partial<Record<SuggestionKind, number>>>({});
  const [withAi, setWithAi] = useState(true);
  const [reload, setReload] = useState(0);

  const refresh = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    bankInsightsApi
      .list({ status, kind: kind === "all" ? undefined : kind })
      .then(({ data }) => !cancelled && (setItems(data.items), setError(false)))
      .catch(() => !cancelled && setError(true));
    bankInsightsApi
      .state()
      .then(({ data }) => !cancelled && (setRun(data.run), setOpen(data.open)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status, kind, reload]);

  useEffect(() => {
    if (!run?.running) return;
    const timer = window.setInterval(() => {
      bankInsightsApi
        .state()
        .then(({ data }) => {
          setRun(data.run);
          setOpen(data.open);
          if (!data.run.running) refresh();
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [run?.running, refresh]);

  const start = async () => {
    try {
      const { data } = await bankInsightsApi.run(withAi);
      setRun(data.run);
    } catch {
      setRun((current) => ({ ...(current ?? { running: false }), error: t("bankAi.run.failed") }));
    }
  };

  const totalOpen = Object.values(open).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("bankAi.title")}
        description={t("bankAi.subtitle")}
        breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("fixAdmin.qd.bankCrumb"), href: "/admin/question-bank" }, { label: t("bankAi.title") }]}
      />

      <section className="space-y-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#14244B] sm:p-6">
        <p className="text-xs leading-5 text-[#607096]">{t("bankAi.how")}</p>
        {canRun ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={run?.running}
              onClick={() => void start()}
              className="inline-flex items-center gap-2 rounded-full bg-[#204195] px-4 py-2 text-xs font-semibold text-white hover:bg-[#183275] disabled:opacity-60"
            >
              {run?.running ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Sparkles className="size-3.5" aria-hidden="true" />}
              {run?.running ? t("bankAi.run.running") : t("bankAi.run.button")}
            </button>
            <label className="inline-flex items-center gap-2 text-xs text-[#475569]">
              <input type="checkbox" checked={withAi} onChange={(e) => setWithAi(e.target.checked)} className="accent-[#204195]" />
              {t("bankAi.run.withAi")}
            </label>
          </div>
        ) : (
          <p className="text-xs text-[#8A98B8]">{t("bankAi.run.adminOnly")}</p>
        )}
        {run && !run.running && run.finishedAt ? (
          <p role="status" className={`text-xs ${run.error ? "text-[#C43B3B]" : "text-[#1F7A4D]"}`}>
            {run.error
              ? fmt(t("bankAi.run.error"), { error: run.error })
              : fmt(t("bankAi.run.done"), {
                  questions: run.questions ?? 0,
                  created: run.created ?? 0,
                  refreshed: run.refreshed ?? 0,
                  ai: run.aiProposals ?? 0,
                  resolved: run.autoResolved ?? 0,
                })}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {(["OPEN", "ACCEPTED", "DISMISSED"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => { setItems(null); setStatus(value); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${status === value ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"}`}
          >
            {t(`bankAi.status.${value}`)}
            {value === "OPEN" ? ` (${totalOpen})` : ""}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-[#DCE4F3]" aria-hidden="true" />
        {(["all", ...KINDS] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            onClick={() => { setItems(null); setKind(value); }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${kind === value ? "bg-[#EEF2FD] text-[#204195]" : "text-[#607096] hover:text-[#204195]"}`}
          >
            {value === "all" ? t("admin.common.all") : t(`bankAi.kind.${value}`)}
            {value !== "all" && open[value] ? ` · ${open[value]}` : ""}
          </button>
        ))}
      </div>

      {error ? (
        <AdminEmptyState variant="error" title={t("bankAi.loadError")} description="" onRetry={refresh} />
      ) : items === null ? (
        <p className="text-sm text-[#607096]">{t("admin.common.loading")}</p>
      ) : items.length === 0 ? (
        <AdminEmptyState title={t("bankAi.empty.title")} description={status === "OPEN" ? t("bankAi.empty.open") : ""} />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <BankSuggestionCard key={item.id} suggestion={item} roles={roles} onDecided={refresh} />
          ))}
        </ul>
      )}
    </div>
  );
}
