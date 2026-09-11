"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { JobInterviewCvModal } from "@/components/user-dashboard/JobInterviewCvModal";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@/services/jobProfileApi";
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
        <div className="h-64 animate-pulse rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] motion-reduce:animate-none" />
        <div className="h-80 animate-pulse rounded-2xl border-2 border-[#234196] bg-white motion-reduce:animate-none" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-sm text-[#8F1D1D] shadow-[3px_3px_0_#D32F2F]" role="alert">
          {error}
        </div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex min-h-11 items-center gap-2 font-bold"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
          <span className="underline decoration-[#FCB625] decoration-4 underline-offset-4">{t("userDash.jobProfiles.detailBack")}</span>
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const categoryName = profile.category?.name ?? profile.categoryId;
  const keywords = profile.keywords?.filter(Boolean) ?? [];

  return (
    <div className="min-w-0 space-y-8 text-[#234196]">
      <Link
        href="/dashboard/jobs"
        className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-bold"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
        <span className="underline decoration-[#FCB625] decoration-4 underline-offset-4">{t("userDash.jobProfiles.detailBack")}</span>
      </Link>

      <header className="rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[5px_5px_0_#234196] sm:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="sticker -rotate-1 bg-[#FCB625] text-[9px]">
            {categoryName}
          </span>
          {profile.status && profile.status !== "ACTIVE" && (
            <span className="sticker bg-[#F0F4FC] text-[9px]">
              {profile.status}
            </span>
          )}
        </div>
        <h1 className="mt-5 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          {profile.title}
        </h1>
        <p className="mt-3 text-sm text-[#5A6B8F]">
          {t("userDash.jobProfiles.detailUpdated")}:{" "}
          {formatDetailDate(profile.updatedAt ?? profile.createdAt, lang)}
        </p>
        <button
          type="button"
          onClick={() => setCvModalOpen(true)}
          className="chunky-primary mt-6 min-h-12 px-6 text-sm"
        >
          {t("userDash.jobProfiles.interviewNow")}
          <span className="material-symbols-outlined text-[22px]">play_arrow</span>
        </button>
      </header>

      {keywords.length > 0 && (
        <section>
          <h2 className="mb-4 font-headline text-2xl font-bold">
            {t("userDash.jobProfiles.detailKeywords")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span
                key={k}
                className="sticker bg-[#F0F4FC] text-[9px]"
              >
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      {keywords.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-[#234196] bg-[#F0F4FC] p-6 text-sm text-[#5A6B8F]">{t("userDash.jobProfiles.detailEmpty")}</p>
      )}

      {String(profile.description || "").trim() && (
        <section className="rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[3px_3px_0_#234196] sm:p-8">
          <h2 className="mb-5 font-headline text-2xl font-bold">
            {t("userDash.jobProfiles.detailDescription")}
          </h2>
          <div className="text-sm leading-7 text-[#234196]">
            <ReactMarkdown
              components={{
                h2: (p) => <h3 className="mt-5 mb-2 text-base font-extrabold" {...p} />,
                h3: (p) => <h4 className="mt-4 mb-2 text-sm font-bold" {...p} />,
                p: (p) => <p className="my-2" {...p} />,
                ul: (p) => <ul className="my-2 list-disc pl-5" {...p} />,
                ol: (p) => <ol className="my-2 list-decimal pl-5" {...p} />,
                li: (p) => <li className="my-1" {...p} />,
                strong: (p) => <strong className="font-semibold" {...p} />,
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
