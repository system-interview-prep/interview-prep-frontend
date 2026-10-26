"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, HeartPulse, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Chip } from "@features/admin/pipeline/components/ui";
import { adminOpsService } from "@features/admin/services/adminOps.service";
import { HEALTH_TONE } from "./SystemHealthClient";

/** One how-to: what to do in the admin when something specific happens. Text lives in the dictionary. */
export type HelpTopic = { id: string; links: { href: string; labelKey: string }[] };

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "stuckSession",
    links: [
      { href: "/admin/interviews", labelKey: "admin.sidebar.interviews" },
      { href: "/admin/ai", labelKey: "admin.sidebar.aiOverview" },
    ],
  },
  { id: "ungraded", links: [{ href: "/admin/interviews", labelKey: "admin.sidebar.interviews" }] },
  { id: "cvFailed", links: [{ href: "/admin/cv-parsing", labelKey: "cvParse.title" }] },
  { id: "workerDown", links: [{ href: "/admin/system", labelKey: "adminOps.health.title" }] },
  { id: "voice", links: [{ href: "/admin/system", labelKey: "adminOps.health.title" }, { href: "/admin/ai/speech", labelKey: "admin.sidebar.aiSpeech" }] },
  { id: "aiQuality", links: [{ href: "/admin/evaluation", labelKey: "admin.sidebar.evalOverview" }, { href: "/admin/ai/speech", labelKey: "admin.sidebar.aiSpeech" }] },
  { id: "changeConfig", links: [{ href: "/admin/settings", labelKey: "admin.sidebar.settings" }, { href: "/admin/ai/models", labelKey: "admin.sidebar.aiModels" }] },
  { id: "questions", links: [{ href: "/admin/question-bank", labelKey: "admin.sidebar.questionBank" }, { href: "/admin/question-quality", labelKey: "adminOps.quality.title" }] },
  { id: "jobs", links: [{ href: "/admin/job-descriptions", labelKey: "admin.sidebar.jobBoard" }, { href: "/admin/matching", labelKey: "matching.title" }] },
  { id: "privacy", links: [{ href: "/admin/audit-logs", labelKey: "admin.sidebar.auditLogs" }, { href: "/admin/users", labelKey: "admin.sidebar.users" }] },
];

/** Topics whose title or body contains every word of the query (accents ignored). */
export function filterTopics(topics: HelpTopic[], query: string, t: (key: string) => string): HelpTopic[] {
  const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").toLowerCase();
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return topics;
  return topics.filter((topic) => {
    const text = fold(`${t(`adminOps.help.topic.${topic.id}.title`)} ${t(`adminOps.help.topic.${topic.id}.body`)}`);
    return words.every((word) => text.includes(word));
  });
}

/** Admin help: how to handle the situations this admin is for, and the live system state. */
export default function AdminHelpClient() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(HELP_TOPICS[0].id);
  const { state } = usePolledResource(() => adminOpsService.systemHealth(), () => 60_000, []);
  const topics = useMemo(() => filterTopics(HELP_TOPICS, query, t), [query, t]);

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("adminOps.help.title")}
        description={t("adminOps.help.subtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("adminOps.help.title") },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div className="relative">
            <label htmlFor="admin-help-search" className="sr-only">
              {t("adminOps.help.search")}
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8A9ABA]" aria-hidden="true" />
            <input
              id="admin-help-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("adminOps.help.searchPlaceholder")}
              className="w-full rounded-full border border-[#DCE4F3] bg-white py-2.5 pl-10 pr-4 text-sm text-[#14244B] focus:border-[#204195] focus:outline-none"
            />
          </div>

          {topics.length ? (
            <ul className="space-y-3">
              {topics.map((topic) => {
                const expanded = open === topic.id || query.trim().length > 0;
                return (
                  <li key={topic.id} className="rounded-2xl border border-[#DCE4F3] bg-white shadow-2xs">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(open === topic.id ? null : topic.id)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-bold text-[#14244B]">{t(`adminOps.help.topic.${topic.id}.title`)}</span>
                      <ChevronDown className={`size-4 shrink-0 text-[#607096] transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {expanded ? (
                      <div className="border-t border-[#EAEFF8] px-5 py-4">
                        <p className="whitespace-pre-line text-sm leading-6 text-[#475569]">{t(`adminOps.help.topic.${topic.id}.body`)}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                          {topic.links.map((link) => (
                            <Link key={link.href} href={link.href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline">
                              {t(link.labelKey)}
                              <ArrowUpRight className="size-3" aria-hidden="true" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#DCE4F3] bg-white p-6 text-center text-sm text-[#607096]">
              {t("adminOps.help.noResult")}
            </p>
          )}
        </div>

        <AdminSection title={t("adminOps.health.title")} description={t("adminOps.help.healthNote")}>
          {state.status === "ready" ? (
            <ul className="space-y-2 text-xs">
              {state.data.checks.map((check) => (
                <li key={check.key} className="flex items-center justify-between gap-3">
                  <span className="text-[#14244B]">{t(`adminOps.health.check.${check.key}`)}</span>
                  <Chip tone={HEALTH_TONE[check.status]}>{t(`adminOps.health.status.${check.status}`)}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#607096]">{state.status === "loading" ? t("admin.common.loading") : t("adminOps.health.loadError")}</p>
          )}
          <Link href="/admin/system" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#204195] hover:underline">
            <HeartPulse className="size-3.5" aria-hidden="true" />
            {t("adminOps.help.openHealth")}
          </Link>
        </AdminSection>
      </div>
    </div>
  );
}
