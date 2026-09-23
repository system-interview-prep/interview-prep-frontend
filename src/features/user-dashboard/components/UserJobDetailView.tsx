"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Play,
} from "lucide-react";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { formatExperience, formatSalary, getCompanyInitials } from "@/components/jobs/job-card.utils";
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
  const id = typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

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
        <div className="h-64 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white shadow-xs motion-reduce:animate-none" />
        <div className="h-80 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white shadow-xs motion-reduce:animate-none" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-xs" role="alert">
          {error}
        </div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[#204195] transition-colors hover:text-[#183275]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
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

  return (
    <div className="min-w-0 space-y-6 text-[#14244B]">
      <Link
        href="/dashboard/jobs"
        className="inline-flex min-h-8 w-fit items-center gap-2 text-sm font-semibold text-[#204195] transition-colors hover:text-[#183275]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{t("userDash.jobProfiles.detailBack")}</span>
      </Link>

      <header className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold text-[#204195]">
              {categoryName}
            </span>
            {profile.status && profile.status !== "ACTIVE" && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-700">
                {profile.status}
              </span>
            )}
          </div>
          {profile.source?.name && (
            <span className="text-xs text-[#607096]">
              Nguồn: <strong className="font-semibold text-[#14244B]">{profile.source.name}</strong>
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Company Logo / Avatar */}
          <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] shadow-xs">
            {profile.company?.logoUrl && !logoError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.company.logoUrl}
                alt={profile.company.name || "Company logo"}
                onError={() => setLogoError(true)}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : profile.company?.name ? (
              <div
                className="flex h-full w-full items-center justify-center bg-[#EEF2FD] font-extrabold text-base text-[#204195] select-none"
                title={profile.company.name}
              >
                {getCompanyInitials(profile.company.name)}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F1F5F9] text-[#607096]">
                <Building2 className="size-8 text-[#607096]" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Title & Company Info */}
          <div className="min-w-0 flex-1">
            {profile.company?.name && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#607096]">
                <span>{profile.company.name}</span>
                {profile.company.verified && (
                  <CheckCircle2 className="size-4 text-[#204195]" aria-label="Verified" />
                )}
              </div>
            )}
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#14244B] sm:text-3xl md:text-4xl">
              {profile.title}
            </h1>
            <p className="mt-1.5 text-xs text-[#607096]">
              {t("userDash.jobProfiles.detailUpdated")}:{" "}
              {formatDetailDate(profile.updatedAt ?? profile.createdAt, lang)}
            </p>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#DCE4F3]/60 pt-5">
          {profile.location && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#14244B]">
              <MapPin className="size-3.5 text-[#607096]" />
              <span>{profile.location}</span>
            </span>
          )}
          {profile.workMode && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#14244B] capitalize">
              <Building2 className="size-3.5 text-[#607096]" />
              <span>{profile.workMode.replace("_", " ")}</span>
            </span>
          )}
          {profile.employmentType && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#14244B] capitalize">
              <Briefcase className="size-3.5 text-[#607096]" />
              <span>{profile.employmentType.replace("_", " ")}</span>
            </span>
          )}
          {profile.seniority && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#14244B] capitalize">
              <span>{profile.seniority}</span>
            </span>
          )}
          {formattedExp && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#14244B]">
              <Clock className="size-3.5 text-[#607096]" />
              <span>{formattedExp}</span>
            </span>
          )}
          {formattedSalary && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span>{formattedSalary}</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCvModalOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#183275] active:scale-[0.99]"
          >
            <span>{t("userDash.jobProfiles.interviewNow")}</span>
            <Play className="size-4 fill-current" />
          </button>
          {profile.source?.applyUrl && (
            <a
              href={profile.source.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-5 text-sm font-semibold text-[#14244B] shadow-2xs transition-colors hover:bg-[#F8FAFC]"
            >
              <span>Ứng tuyển nguồn</span>
              <ExternalLink className="size-4 text-[#607096]" />
            </a>
          )}
        </div>
      </header>

      {keywords.length > 0 && (
        <section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-8">
          <h2 className="mb-4 text-xl font-bold text-[#14244B]">
            {t("userDash.jobProfiles.detailKeywords")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#14244B]"
              >
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      {keywords.length === 0 && !String(profile.description || "").trim() && (
        <p className="rounded-2xl border border-dashed border-[#DCE4F3] bg-white p-6 text-sm text-[#607096] shadow-xs">
          {t("userDash.jobProfiles.detailEmpty")}
        </p>
      )}

      {String(profile.description || "").trim() && (
        <section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-8">
          <h2 className="mb-5 text-xl font-bold text-[#14244B]">
            {t("userDash.jobProfiles.detailDescription")}
          </h2>
          <div className="prose max-w-none text-sm leading-7 text-[#14244B]">
            <ReactMarkdown
              components={{
                h2: (p) => <h3 className="mb-2 mt-5 text-base font-bold text-[#14244B]" {...p} />,
                h3: (p) => <h4 className="mb-2 mt-4 text-sm font-semibold text-[#14244B]" {...p} />,
                p: (p) => <p className="my-2 leading-relaxed text-[#4A5568]" {...p} />,
                ul: (p) => <ul className="my-2 list-disc pl-5 space-y-1 text-[#4A5568]" {...p} />,
                ol: (p) => <ol className="my-2 list-decimal pl-5 space-y-1 text-[#4A5568]" {...p} />,
                li: (p) => <li className="my-0.5" {...p} />,
                strong: (p) => <strong className="font-bold text-[#14244B]" {...p} />,
                em: (p) => <em className="italic" {...p} />,
              }}
            >
              {String(profile.description || "").trim()}
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
