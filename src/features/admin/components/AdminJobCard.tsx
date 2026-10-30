"use client";

import Link from "next/link";
import { ArrowRight, Edit, Trash2 } from "lucide-react";
import JobCardHeader from "@/components/jobs/JobCardHeader";
import JobMetadata from "@/components/jobs/JobMetadata";
import JobSalary from "@/components/jobs/JobSalary";
import { mapJobToJobCard, formatRelativeTime } from "@/components/jobs/job-card.utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import AdminRowAction from "./primitives/AdminRowAction";
import AdminStatusBadge, { type AdminStatusType } from "./primitives/AdminStatusBadge";

type ListingState = "ACTIVE" | "DRAFT" | "ARCHIVED";

const STATUS: Record<ListingState, { tone: AdminStatusType; key: string }> = {
  ACTIVE: { tone: "success", key: "fixAdmin.jp.status.active" },
  DRAFT: { tone: "draft", key: "fixAdmin.jp.status.draft" },
  ARCHIVED: { tone: "archived", key: "fixAdmin.jp.status.archived" },
};

export function listingState(profile: JobProfile): ListingState {
  const raw = String(profile.status ?? profile.listingStatus ?? "").toUpperCase();
  if (raw === "DRAFT" || raw === "ARCHIVED") return raw;
  return "ACTIVE";
}

/**
 * Admin JD card, built from the same parts as the candidate's job card
 * (logo + title + company, location/type/seniority, salary) so a JD looks the
 * same on both sides. The footer carries the listing status and the admin
 * actions instead of the candidate's save button and "Luyện phỏng vấn".
 */
export default function AdminJobCard({
  profile,
  onEdit,
  onDelete,
}: {
  profile: JobProfile;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t, lang } = useLanguage();
  const job = mapJobToJobCard(profile);
  const state = STATUS[listingState(profile)];
  const href = `/admin/job-descriptions/${encodeURIComponent(profile.id)}`;
  const updated = formatRelativeTime(profile.updatedAt ?? profile.createdAt ?? "", lang);
  const keywords = (profile.keywords ?? []).filter(Boolean).slice(0, 3);

  return (
    <article className="group relative flex h-full min-w-0 flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#204195]/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Whole card opens the JD; buttons sit above this layer. */}
      <Link
        href={href}
        className="absolute inset-0 z-[1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#204195]/30"
        aria-label={job.company?.name ? `${job.title} - ${job.company.name}` : job.title}
      />

      <div className="relative z-[2] flex flex-1 flex-col space-y-3.5">
        <JobCardHeader
          title={job.title}
          company={job.company}
          category={job.category}
          trailing={null}
        />
        <JobMetadata
          location={job.location}
          employmentType={job.employmentType}
          seniority={job.seniority}
          experience={job.experience}
        />
        <JobSalary salary={job.salary} />
        {keywords.length ? (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                title={keyword}
                className="max-w-full truncate rounded-md border border-[#DCE4F3] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium text-[#607096]"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative z-[2] mt-4 space-y-2.5 border-t border-[#EAEFF8] pt-3 text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <AdminStatusBadge status={state.tone} label={t(state.key)} size="sm" className="whitespace-nowrap" />
          {updated ? (
            <span className="truncate text-[11px] text-[#9AA6C2]">
              {t("admin.jobProfile.card.updated")}: {updated}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="relative z-[3] flex items-center gap-1.5">
            <AdminRowAction icon={Edit} label={t("admin.jobProfile.card.edit")} onClick={() => onEdit(profile.id)} />
            <AdminRowAction icon={Trash2} tone="danger" iconOnly label={t("admin.jobProfile.card.delete")} onClick={() => onDelete(profile.id)} />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#204195] transition-transform duration-150 group-hover:translate-x-0.5 sm:text-xs">
            {t("jobs.card.viewJob")}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
