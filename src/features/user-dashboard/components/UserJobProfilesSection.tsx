"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import {
  JobCard,
  JobCardSkeleton,
  mapJobToJobCard,
} from "@/components/jobs";

const PREVIEW_LIMIT = 6;

function isActiveProfile(profile: JobProfile): boolean {
  return profile.status === "ACTIVE";
}

export default function UserJobProfilesSection() {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvModalJob, setCvModalJob] = useState<JobProfile | null>(null);

  // Client-side saved jobs
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => {
    try {
      if (typeof window === "undefined") return new Set();
      const raw = localStorage.getItem("candidate.saved_job_ids");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleToggleSave = useCallback((jobId: string, currentSaved: boolean) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (currentSaved) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      try {
        localStorage.setItem("candidate.saved_job_ids", JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.list({
          limit: PREVIEW_LIMIT,
          order: "desc",
        });
        if (!cancelled) setProfiles((data.items ?? []).filter(isActiveProfile));
      } catch (e: unknown) {
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("admin.jobProfile.error.load");
        if (!cancelled) {
          setError(msg);
          setProfiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <section className="mb-16">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-[#14244B] md:text-3xl">
            {t("userDash.jobProfiles.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#607096]">{t("userDash.jobProfiles.previewSubtitle")}</p>
        </div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#204195] hover:underline"
        >
          {t("userDash.jobProfiles.viewAll")}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#607096]">{t("userDash.jobProfiles.empty")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => {
            const cardData = mapJobToJobCard(p, { savedJobIds });
            return (
              <JobCard
                key={p.id}
                job={cardData}
                onToggleSave={handleToggleSave}
                onInterview={() => setCvModalJob(p)}
              />
            );
          })}
        </div>
      )}

      <JobInterviewCvModal
        open={cvModalJob !== null}
        jobTitle={cvModalJob?.title ?? ""}
        jobProfileId={cvModalJob?.id}
        onClose={() => setCvModalJob(null)}
      />
    </section>
  );
}
