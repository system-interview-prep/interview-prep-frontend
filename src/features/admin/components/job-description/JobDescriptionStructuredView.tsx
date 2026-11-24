"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  Building2,
  CheckSquare,
  ClipboardList,
  ExternalLink,
  Gift,
  Layers,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt, localeOf } from "@/i18n/format";
import AdminSection from "../primitives/AdminSection";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import {
  arrayOf,
  asCanonicalJd,
  type CanonicalGroundedText,
  type CanonicalJd,
  type CanonicalRequirement,
} from "./canonicalJd";
import { EMPTY, JdChip, JdField } from "./JdStructuredPrimitives";

type Translate = (key: string) => string;

/** Translate an enum value, falling back to the raw code for values we have no label for. */
function enumLabel(t: Translate, prefix: string, value?: string | null): string | null {
  if (!value) return null;
  const key = `${prefix}.${value}`;
  const label = t(key);
  return label === key ? value : label;
}

function dateLabel(locale: string, iso?: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(locale, { dateStyle: "medium" });
}

function experienceLabel(t: Translate, profile: JobProfile, jd: CanonicalJd | null): string | null {
  const min = profile.experience?.minYears ?? jd?.experienceMinYears ?? null;
  const max = profile.experience?.maxYears ?? jd?.experienceMaxYears ?? null;
  if (min != null && max != null) return fmt(t("adminUiJd.detail.yearsRange"), { min, max });
  if (min != null) return fmt(t("adminUiJd.detail.yearsMin"), { n: min });
  if (max != null) return fmt(t("adminUiJd.detail.yearsMax"), { n: max });
  // The parser keeps the original phrasing when it cannot read numbers out of it.
  return jd?.experienceRaw || null;
}

function salaryLabel(
  t: Translate,
  locale: string,
  profile: JobProfile,
  jd: CanonicalJd | null
): string | null {
  const min = profile.salary?.min ?? jd?.salaryMin ?? null;
  const max = profile.salary?.max ?? jd?.salaryMax ?? null;
  const currency = profile.salary?.currency ?? jd?.salaryCurrency ?? null;
  const period = profile.salary?.period ?? jd?.salaryPeriod ?? null;
  const negotiable = profile.salary?.negotiable ?? jd?.salaryNegotiable ?? null;
  const nf = new Intl.NumberFormat(locale);

  let text = "";
  if (min != null && max != null) text = `${nf.format(min)}–${nf.format(max)}`;
  else if (min != null) text = fmt(t("adminUiJd.detail.salaryFrom"), { v: nf.format(min) });
  else if (max != null) text = fmt(t("adminUiJd.detail.salaryUpTo"), { v: nf.format(max) });

  if (text && currency) text = `${text} ${currency}`;
  if (text && period) {
    const unit = enumLabel(t, "adminUiJd.detail.salaryPeriod", period);
    if (unit) text = `${text} ${unit}`;
  }
  if (text && negotiable) text = `${text} · ${t("adminUiJd.detail.negotiable")}`;
  if (!text && negotiable) text = t("adminUiJd.detail.negotiable");
  return text || jd?.salaryRaw || null;
}

/** "Tối thiểu 3 năm" when the months divide evenly, months otherwise. */
function minimumExperienceLabel(t: Translate, months?: number | null): string | null {
  if (!months) return null;
  if (months % 12 === 0) return fmt(t("adminUiJd.detail.minYears"), { n: months / 12 });
  return fmt(t("adminUiJd.detail.minMonths"), { n: months });
}

/**
 * One requirement the way a candidate reads it: the sentence from the posting
 * plus the few facts that decide whether they can apply. Taxonomy concepts,
 * group operators and evidence ids are pipeline bookkeeping and stay out.
 */
function RequirementCard({ item }: { item: CanonicalRequirement }) {
  const { t } = useLanguage();
  const mustHave = item.priority === "must_have";
  const kind = enumLabel(t, "adminUiJd.detail.kind", item.kind);
  const minExp = minimumExperienceLabel(t, item.minimumExperienceMonths);

  return (
    <article className="min-w-0 rounded-xl border border-[#E8EEF9] bg-[#FAFCFF] p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <JdChip tone={mustHave ? "danger" : "brand"}>
          {mustHave ? t("adminUiJd.detail.mustHave") : t("adminUiJd.detail.preferred")}
        </JdChip>
        {kind ? <JdChip>{kind}</JdChip> : null}
        {minExp ? <JdChip tone="warn">{minExp}</JdChip> : null}
        {item.credential ? (
          <JdChip>{fmt(t("adminUiJd.detail.credential"), { v: item.credential })}</JdChip>
        ) : null}
      </div>

      <p className="mt-2 text-sm font-semibold text-[#14244B] [overflow-wrap:anywhere]">
        {item.rawLabel || item.concept?.label || EMPTY}
      </p>
    </article>
  );
}

function GroundedSection({
  title,
  icon,
  items,
  columns = false,
}: {
  title: string;
  icon: React.ReactNode;
  items: CanonicalGroundedText[];
  columns?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <AdminSection
      title={title}
      action={
        <span className="flex items-center gap-2 text-[#204195]">
          {icon}
          <span className="rounded-full bg-[#EEF2FD] px-2.5 py-1 text-xs font-bold">
            {items.length}
          </span>
        </span>
      }
    >
      {items.length ? (
        <ul className={`min-w-0 gap-x-6 ${columns ? "sm:columns-2" : "space-y-2.5"}`}>
          {items.map((item, index) => (
            <li
              key={`${item.text}-${index}`}
              className="flex min-w-0 break-inside-avoid gap-2.5 py-0.5"
            >
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#204195]/40"
              />
              <span className="min-w-0 text-sm leading-relaxed text-[#14244B] [overflow-wrap:anywhere]">
                {item.text || EMPTY}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#8A9ABA]">{t("adminUiJd.detail.noneExtracted")}</p>
      )}
    </AdminSection>
  );
}

const MARKDOWN_COMPONENTS = {
  h1: (p: object) => <h3 className="mt-5 mb-2 text-base font-extrabold" {...p} />,
  h2: (p: object) => <h3 className="mt-5 mb-2 text-base font-extrabold" {...p} />,
  h3: (p: object) => <h4 className="mt-4 mb-2 text-sm font-bold" {...p} />,
  p: (p: object) => <p className="my-2" {...p} />,
  ul: (p: object) => <ul className="my-2 list-disc pl-5" {...p} />,
  ol: (p: object) => <ol className="my-2 list-decimal pl-5" {...p} />,
  li: (p: object) => <li className="my-1" {...p} />,
  strong: (p: object) => <strong className="font-semibold" {...p} />,
  em: (p: object) => <em className="italic" {...p} />,
  a: (p: object) => <a className="text-[#204195] underline" target="_blank" rel="noreferrer" {...p} />,
  code: (p: object) => <code className="rounded bg-[#F0F4FC] px-1 text-[13px]" {...p} />,
  pre: (p: object) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-[#F8FAFC] p-3 text-xs" {...p} />
  ),
  table: (p: object) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full text-xs" {...p} />
    </div>
  ),
};

/**
 * The job description as a candidate reads it.
 *
 * Deliberately NOT a dump of `structuredData`: taxonomy codes, confidence
 * scores, evidence spans, parser versions and coverage flags are pipeline
 * bookkeeping. They are still reviewable in the create/version screen.
 */
export default function JobDescriptionStructuredView({ profile }: { profile: JobProfile }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);

  const jd = useMemo(() => asCanonicalJd(profile.structuredData), [profile.structuredData]);

  const requirements = arrayOf(jd?.requirements);
  const mustHave = requirements.filter((item) => item.priority === "must_have");
  const preferred = requirements.filter((item) => item.priority !== "must_have");
  const keywords = arrayOf(profile.keywords);

  const description = String(profile.description || "").trim();
  const rawText = String(profile.sourceText || profile.rawJdText || "").trim();
  const showRawText = rawText.length > 0 && rawText !== description;

  const companyName = profile.company?.name ?? jd?.companyName ?? null;
  const applyUrl = profile.source?.applyUrl ?? null;

  return (
    <div className="min-w-0 space-y-5">
      {!jd ? (
        <div className="rounded-2xl border border-dashed border-[#DCE4F3] bg-[#FAFCFF] px-5 py-6 text-center">
          <Sparkles className="mx-auto size-6 text-[#A3AFC6]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[#14244B]">
            {t("adminUiJd.detail.noStructured")}
          </p>
          <p className="mt-1 text-xs text-[#607096]">{t("adminUiJd.detail.noStructuredHint")}</p>
        </div>
      ) : null}

      <AdminSection
        title={t("adminUiJd.detail.overview")}
        description={t("adminUiJd.detail.overviewHint")}
        action={
          applyUrl ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#204195]/25 bg-[#EEF2FD] px-3.5 py-1.5 text-xs font-bold text-[#204195] transition-colors hover:bg-[#DCE7FA]"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {t("adminUiJd.detail.apply")}
            </a>
          ) : undefined
        }
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <JdField label={t("adminUiJd.detail.jobTitle")} value={jd?.jobTitle || profile.title} />
          <JdField
            label={t("adminUiJd.detail.company")}
            value={
              companyName ? (
                <span className="flex min-w-0 items-center gap-2">
                  {profile.company?.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={profile.company.logoUrl}
                      alt=""
                      className="size-5 shrink-0 rounded border border-[#DCE4F3] object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Building2 className="size-4 shrink-0 text-[#8A9ABA]" aria-hidden="true" />
                  )}
                  <span className="min-w-0">{companyName}</span>
                </span>
              ) : null
            }
          />
          <JdField
            label={t("adminUiJd.detail.location")}
            value={profile.location ?? jd?.location ?? null}
          />
          <JdField
            label={t("adminUiJd.detail.seniority")}
            value={enumLabel(t, "adminUiJd.detail.sen", profile.seniority ?? jd?.seniority)}
          />
          <JdField
            label={t("adminUiJd.detail.employmentType")}
            value={enumLabel(t, "adminUiJd.detail.emp", profile.employmentType ?? jd?.employmentType)}
          />
          <JdField
            label={t("adminUiJd.detail.workMode")}
            value={enumLabel(t, "adminUiJd.detail.wm", profile.workMode ?? jd?.workMode)}
          />
          <JdField
            label={t("adminUiJd.detail.experience")}
            value={experienceLabel(t, profile, jd)}
          />
          <JdField label={t("adminUiJd.detail.salary")} value={salaryLabel(t, locale, profile, jd)} />
          <JdField
            label={t("adminUiJd.detail.category")}
            value={profile.primaryTaxonomy?.label ?? null}
          />
          <JdField label={t("adminUiJd.detail.postedAt")} value={dateLabel(locale, profile.postedAt)} />
        </div>

        {keywords.length ? (
          <div className="mt-4 border-t border-[#F1F5F9] pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#607096]">
              {t("adminUiJd.detail.keywords")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {keywords.map((keyword) => (
                <JdChip key={keyword} title={keyword}>
                  {keyword}
                </JdChip>
              ))}
            </div>
          </div>
        ) : null}
      </AdminSection>

      <GroundedSection
        title={t("adminUiJd.detail.responsibilities")}
        icon={<ClipboardList className="size-5" aria-hidden="true" />}
        items={arrayOf(jd?.responsibilities)}
      />

      <AdminSection
        title={t("adminUiJd.detail.requirements")}
        description={t("adminUiJd.detail.requirementsHint")}
        action={
          <span className="flex items-center gap-2 text-[#204195]">
            <CheckSquare className="size-5" aria-hidden="true" />
            <span className="rounded-full bg-[#EEF2FD] px-2.5 py-1 text-xs font-bold">
              {requirements.length}
            </span>
          </span>
        }
      >
        {requirements.length ? (
          <div className="space-y-5">
            {[
              { key: "must", label: t("adminUiJd.detail.mustHave"), items: mustHave },
              { key: "pref", label: t("adminUiJd.detail.preferred"), items: preferred },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.key} className="min-w-0">
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-[#607096]">
                    {group.label} ({group.items.length})
                  </p>
                  <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                    {group.items.map((item, index) => (
                      <RequirementCard
                        key={item.requirementId || `${group.key}-${index}`}
                        item={item}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-[#8A9ABA]">{t("adminUiJd.detail.noRequirements")}</p>
        )}
      </AdminSection>

      <GroundedSection
        title={t("adminUiJd.detail.benefits")}
        icon={<Gift className="size-5" aria-hidden="true" />}
        items={arrayOf(jd?.benefits)}
        columns
      />

      <AdminSection
        title={t("adminUiJd.detail.description")}
        description={t("adminUiJd.detail.descriptionHint")}
      >
        {description ? (
          <details className="min-w-0">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#607096] transition-colors hover:border-[#204195]/40 hover:text-[#204195] [&::-webkit-details-marker]:hidden">
              <ScrollText className="size-3.5" aria-hidden="true" />
              {fmt(t("adminUiJd.detail.showText"), { n: description.length })}
            </summary>
            <div className="mt-3 min-w-0 border-t border-[#F1F5F9] pt-3 text-sm leading-relaxed text-[#14244B] [overflow-wrap:anywhere]">
              <ReactMarkdown components={MARKDOWN_COMPONENTS}>{description}</ReactMarkdown>
            </div>
          </details>
        ) : (
          <p className="text-sm text-[#A3AFC6]">{t("adminUiJd.detail.noDescription")}</p>
        )}

        {showRawText ? (
          <details className="mt-3 min-w-0">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#607096] transition-colors hover:border-[#204195]/40 hover:text-[#204195] [&::-webkit-details-marker]:hidden">
              <Layers className="size-3.5" aria-hidden="true" />
              {fmt(t("adminUiJd.detail.showRawText"), { n: rawText.length })}
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#F8FAFC] p-3 text-xs text-[#4A505C]">
              {rawText}
            </pre>
          </details>
        ) : null}
      </AdminSection>
    </div>
  );
}
