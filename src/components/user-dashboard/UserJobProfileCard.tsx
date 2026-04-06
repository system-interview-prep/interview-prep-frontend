"use client";

type UserJobProfileCardProps = {
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
    <article className="flex h-full flex-col rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="inline-flex max-w-[85%] items-center rounded-full bg-primary/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          {categoryLabel}
        </span>
        <span className="material-symbols-outlined shrink-0 text-[22px] text-primary/40">work</span>
      </div>
      <h3 className="font-headline text-lg font-bold leading-snug text-on-surface line-clamp-2">
        {title}
      </h3>
      {hasKeywords && (
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-on-surface-variant">{keywordsLine}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/10 pt-4">
        <p className="text-[11px] text-on-surface-variant">
          <span className="font-medium text-on-surface-variant/80">{updatedPrefix}</span> {updatedShort}
        </p>
        <button
          type="button"
          onClick={onInterview}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition hover:opacity-95 active:scale-[0.98]"
        >
          {interviewCta}
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
        </button>
      </div>
    </article>
  );
}
