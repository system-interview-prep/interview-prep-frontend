"use client";

import Link from "next/link";

type UserJobProfileCardProps = {
  jobId: string;
  viewDetailAria: string;
  title: string;
  categoryLabel: string;
  keywordsLine: string;
  updatedShort: string;
  updatedPrefix: string;
  interviewCta: string;
  onInterview: () => void;
  /** Show keyword line when non-empty */
  showKeywords?: boolean;
};

export function UserJobProfileCard({
  jobId,
  viewDetailAria,
  title,
  categoryLabel,
  keywordsLine,
  updatedShort,
  updatedPrefix,
  interviewCta,
  onInterview,
  showKeywords = true,
}: UserJobProfileCardProps) {
  const hasKeywords = showKeywords && keywordsLine && keywordsLine !== "—";

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border-2 border-[#234196] bg-white p-5 text-[#234196] shadow-[3px_3px_0_#234196] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#234196] motion-reduce:transition-none">
      <Link
        href={`/dashboard/jobs/${jobId}`}
        className="absolute inset-0 z-[1] rounded-2xl"
        aria-label={viewDetailAria}
      />
      <div className="relative z-[2] flex min-h-0 flex-1 flex-col pointer-events-none">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="sticker inline-flex max-w-[85%] truncate bg-[#F0F4FC] text-[9px]">
            {categoryLabel}
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#234196] bg-[#FCB625]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">work</span>
          </span>
        </div>
        <h3 className="line-clamp-2 font-headline text-xl font-bold leading-snug">{title}</h3>
        {hasKeywords && (
          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-[#5A6B8F]">{keywordsLine}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#234196] pt-4">
          <p className="text-[11px] text-[#5A6B8F]">
            <span className="font-semibold">{updatedPrefix}</span> {updatedShort}
          </p>
          <button
            type="button"
            onClick={onInterview}
            className="chunky-primary pointer-events-auto relative z-[3] min-h-11 shrink-0 px-4 text-xs"
          >
            {interviewCta}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">play_arrow</span>
          </button>
        </div>
      </div>
    </article>
  );
}
