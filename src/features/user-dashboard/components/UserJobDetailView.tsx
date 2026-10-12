"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import {
  formatExperience,
  formatSalary,
  getCompanyInitials,
  normalizeEmploymentType,
  normalizeSeniority,
  normalizeWorkplaceType,
} from "@/components/jobs/job-card.utils";
import { isProbablyEnglishJobDescription } from "@features/user-dashboard/utils/job-description-language";
import {
  BrowserTranslationUnavailable,
  translateEnglishToVietnameseInBrowser,
} from "@features/user-dashboard/utils/browser-translator";
import ReactMarkdown from "react-markdown";

function formatDetailDate(iso: string | undefined, locale: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function UserJobDetailView() {
  const params = useParams();
  const { t, lang } = useLanguage();
  /** Translated label for a job enum (on_site, full_time, senior…); unknown values stay readable. */
  const labelOf = (raw: unknown, normalized: string | undefined, prefix: string) => {
    if (!raw) return null;
    if (normalized) return t(`${prefix}${normalized}`);
    return String(raw).replace(/_/g, " ");
  };
  const id = typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.get(id);
        if (!cancelled) {
          if (data.status !== "ACTIVE") {
            setError(t("admin.jobProfile.detail.notFound"));
            setProfile(null);
          } else {
            setProfile(data);
            setTranslatedDescription(null);
            setShowTranslation(false);
            setTranslationError(null);
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const notFound = axios.isAxiosError(e) && e.response?.status === 404;
          setError(
            notFound ? t("admin.jobProfile.detail.notFound") : t("admin.jobProfile.error.load")
          );
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (loading) {
    return (
      <div className="space-y-5" role="status" aria-label={t("admin.jobProfile.loading")}>
        <div className="h-64 animate-pulse rounded-3xl bg-[#F0F4FC]/60 motion-reduce:animate-none" />
        <div className="h-80 animate-pulse rounded-3xl bg-[#F0F4FC] motion-reduce:animate-none" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-w-0 flex-col items-center rounded-3xl bg-white px-6 py-12 text-center border border-[#DCE4F3]">
        <p className="mt-4 max-w-md text-sm leading-6 text-[#C43B3B]" role="alert">
          {error}
        </p>
        <Link
          href="/dashboard/jobs"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
        >
          <span aria-hidden="true" className="mr-1.5">←</span>
          <span>{t("userDash.jobProfiles.detailBack")}</span>
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const categoryName = profile.primaryTaxonomy?.label ?? t("userDash.jobProfiles.uncategorized");
  const keywords = profile.keywords?.filter(Boolean) ?? [];
  const formattedSalary = profile.salary ? formatSalary(profile.salary, undefined, lang) : null;
  const formattedExp = profile.experience ? formatExperience(profile.experience, lang) : null;
  const originalDescription = String(profile.description || "").trim();
  const canTranslate = isProbablyEnglishJobDescription(originalDescription);
  const visibleDescription = showTranslation && translatedDescription
    ? translatedDescription
    : originalDescription;

  const toggleTranslation = async () => {
    if (translatedDescription) {
      setShowTranslation((current) => !current);
      setTranslationError(null);
      return;
    }
    setTranslating(true);
    setTranslationError(null);
    try {
      const translated = await translateEnglishToVietnameseInBrowser(originalDescription);
      setTranslatedDescription(translated);
      setShowTranslation(true);
    } catch (translationFailure: unknown) {
      setTranslationError(
        t(translationFailure instanceof BrowserTranslationUnavailable
          ? "userDash.jobProfiles.translationUnsupported"
          : "userDash.jobProfiles.translationFailed")
      );
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6 text-[#14244B]">
      <Link
        href="/dashboard/jobs"
        className="inline-flex min-h-9 w-fit items-center gap-2 rounded-full px-1 text-sm font-semibold text-[#204195] transition-colors hover:text-[#14244B]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{t("userDash.jobProfiles.detailBack")}</span>
      </Link>

      <header className="anim-rise overflow-hidden rounded-3xl border border-[#DCE4F3] bg-white shadow-[0_18px_50px_-36px_rgba(20,36,75,0.32)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <h1 className="max-w-4xl break-words text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl lg:text-[42px] lg:leading-[1.12]">
              {profile.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607096] sm:text-base">
              {t("uxWs.jobDetail.heroBody")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setCvModalOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#183275]"
              >
                {t("userDash.jobProfiles.interviewNow")}
              </button>
              {profile.source?.applyUrl && (
                <a
                  href={profile.source.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-5 text-sm font-semibold text-[#204195] transition-colors hover:border-[#B9C8E5] hover:bg-[#F8FAFC]"
                >
                  {t("uxWs.jobDetail.applySource")}
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              )}
            </div>

            {keywords.length > 0 && (
              <div className="mt-8 border-t border-[#EAEFF8] pt-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#607096]">
                  {t("userDash.jobProfiles.detailKeywords")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#29436F]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="border-t border-[#EAEFF8] bg-[#F8FAFC] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex items-center gap-3">
              {/* Company Logo / Avatar */}
              <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-sm">
                {profile.company?.logoUrl && !logoError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={profile.company.logoUrl}
                    alt={profile.company.name || t("fixApp.jobs.companyLogo")}
                    onError={() => setLogoError(true)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : profile.company?.name ? (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[#F0F4FC] text-base font-semibold text-[#204195] select-none"
                    title={profile.company.name}
                  >
                    {getCompanyInitials(profile.company.name)}
                  </div>
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[#F0F4FC] text-base font-semibold text-[#204195] select-none">{getCompanyInitials(profile.title)}</span>
                )}
              </div>
              <div className="min-w-0">
                {profile.company?.name && (
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-[#14244B]">
                    <span className="min-w-0 break-words">{profile.company.name}</span>
                    {profile.company.verified && (
                      <CheckCircle2 className="size-4 shrink-0 text-[#204195]" aria-label={t("fixApp.jobs.verified")} />
                    )}
                  </p>
                )}
                <p className="mt-1 text-xs font-semibold text-[#607096]">{categoryName}</p>
              </div>
            </div>

            {profile.status && profile.status !== "ACTIVE" && (
              <p className="mt-3 w-fit rounded-full bg-[#FFF8E6] px-3 py-0.5 text-xs font-semibold text-[#8A5A00]">
                {profile.status}
              </p>
            )}

            {/* Metadata */}
            <dl className="mt-6 space-y-2.5 border-t border-[#DCE4F3] pt-5 text-[13px] leading-5 text-[#607096]">
              {profile.location && <div className="break-words"><dt className="sr-only">{t("fixApp.jobs.location")}</dt><dd>{profile.location}</dd></div>}
              {(profile.workMode || profile.employmentType || profile.seniority) && (
                <div>
                  {[
                    labelOf(profile.workMode, normalizeWorkplaceType(profile.workMode), "jobs.workplace."),
                    labelOf(profile.employmentType, normalizeEmploymentType(profile.employmentType), "jobs.employment."),
                    labelOf(profile.seniority, normalizeSeniority(profile.seniority), "jobs.seniority."),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}
              {formattedExp && <div>{formattedExp}</div>}
              {formattedSalary && <div className="font-semibold text-[#287A4B]">{formattedSalary}</div>}
              <div className="text-xs">
                {t("userDash.jobProfiles.detailUpdated")}:{" "}
                {formatDetailDate(profile.updatedAt ?? profile.createdAt, lang)}
              </div>
              {profile.source?.name && (
                <div className="text-xs">
                  {t("uxWs.jobDetail.source")}: <strong className="font-semibold text-[#14244B]">{profile.source.name}</strong>
                </div>
              )}
            </dl>
          </aside>
        </div>
      </header>

      {keywords.length === 0 && !String(profile.description || "").trim() && (
        <p className="rounded-3xl bg-white p-6 text-sm text-[#607096] border border-[#DCE4F3]">
          {t("userDash.jobProfiles.detailEmpty")}
        </p>
      )}

      {originalDescription && (
        <section className="rounded-3xl bg-white p-5 border border-[#DCE4F3] sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#14244B]">
              {t("userDash.jobProfiles.detailDescription")}
            </h2>
            {canTranslate && (
              <button
                type="button"
                onClick={() => void toggleTranslation()}
                disabled={translating}
                className="inline-flex h-9 items-center rounded-full bg-[#F8FAFC] px-4 text-[13px] font-semibold text-[#204195] transition-colors hover:bg-[#F0F4FC] disabled:cursor-wait disabled:opacity-60"
              >
                <span className={translating ? "animate-pulse motion-reduce:animate-none" : undefined}>
                  {translating
                    ? t("userDash.jobProfiles.translating")
                    : showTranslation
                      ? t("userDash.jobProfiles.showOriginal")
                      : t("userDash.jobProfiles.translateVi")}
                </span>
              </button>
            )}
          </div>
          {translationError && (
            <p className="mb-4 rounded-2xl bg-[#FFF8E6] px-3 py-2 text-xs text-[#8A5A00]" role="alert">
              {translationError}
            </p>
          )}
          <div className="prose max-w-none break-words text-sm leading-7 text-[#14244B]">
            <ReactMarkdown
              components={{
                h2: (p) => <h3 className="mb-2 mt-5 text-base font-semibold text-[#14244B]" {...p} />,
                h3: (p) => <h4 className="mb-2 mt-4 text-sm font-semibold text-[#14244B]" {...p} />,
                p: (p) => <p className="my-2 leading-relaxed text-[#607096]" {...p} />,
                ul: (p) => <ul className="my-2 list-disc pl-5 space-y-1 text-[#607096]" {...p} />,
                ol: (p) => <ol className="my-2 list-decimal pl-5 space-y-1 text-[#607096]" {...p} />,
                li: (p) => <li className="my-0.5" {...p} />,
                strong: (p) => <strong className="font-semibold text-[#14244B]" {...p} />,
                em: (p) => <em className="italic" {...p} />,
              }}
            >
              {visibleDescription}
            </ReactMarkdown>
          </div>
        </section>
      )}

      <JobInterviewCvModal
        open={cvModalOpen}
        jobTitle={profile.title}
        jobProfileId={profile.id}
        onClose={() => setCvModalOpen(false)}
      />
    </div>
  );
}
