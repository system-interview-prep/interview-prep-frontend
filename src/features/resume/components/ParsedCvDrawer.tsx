"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import StatusNote from "@components/shared/StatusNote";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { userCvApi, type UserCvDto } from "../services/userCv.service";

/** Loosely-typed view of CanonicalResume: the drawer only reads, and tolerates missing fields. */
type Rec = Record<string, unknown>;
const arr = (value: unknown): Rec[] => (Array.isArray(value) ? (value as Rec[]) : []);
const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const dateOf = (value: unknown): string => str((value as Rec | null)?.value);

function period(item: Rec, presentLabel: string): string {
  const start = dateOf(item.startDate);
  const end = item.isCurrent ? presentLabel : dateOf(item.endDate);
  if (!start && !end) return "";
  return `${start || "?"} – ${end || "?"}`;
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-[#14244B]">
        {title}
        <span className="rounded-full bg-[#F0F4FC] px-2 text-[11px] font-semibold tabular-nums text-[#607096]">{count}</span>
      </h3>
      {children}
    </section>
  );
}

export function ParsedCvDrawer({ cvId, fileName, onClose }: { cvId: string; fileName: string; onClose: () => void }) {
  const { t } = useLanguage();
  const [cv, setCv] = useState<UserCvDto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    userCvApi
      .get(cvId)
      .then((response) => active && setCv(response.data))
      .catch(() => active && setError(true));
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      active = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [cvId, onClose]);

  const data = (cv?.parsedData ?? {}) as Rec;
  const profile = (data.profile ?? {}) as Rec;
  const skills = arr(data.skills);
  const employment = arr(data.employment);
  const education = arr(data.education);
  const projects = arr(data.projects);
  const certifications = arr(data.certifications);
  const languages = arr(data.languages);
  const empty = (key: string) => <p className="text-xs text-[#607096]">{t(key)}</p>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#14244B]/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="parsed-cv-title"
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-[#F8FAFC] shadow-[0_0_60px_-20px_rgba(20,36,75,0.6)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#DCE4F3] bg-white px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="parsed-cv-title" className="text-lg font-bold text-[#14244B]">
              {t("parsedCv.title")}
            </h2>
            <p className="truncate text-xs text-[#607096]" title={fileName}>{fileName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("parsedCv.close")}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#14244B]"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-w-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 [overflow-wrap:anywhere] sm:px-5">
          <StatusNote text={t("parsedCv.explain")} />

          {error ? (
            <p className="rounded-2xl bg-[#FDF2F2] px-3.5 py-2.5 text-sm text-[#C43B3B]" role="alert">{t("parsedCv.error")}</p>
          ) : !cv ? (
            <div className="flex justify-center py-10" role="status" aria-label={t("userDash.loading")}>
              <div className="anim-shimmer h-28 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {(str(profile.headline) || str(profile.summary)) && (
                <section className="space-y-1">
                  {str(profile.headline) && <p className="text-sm font-semibold text-[#14244B]">{str(profile.headline)}</p>}
                  {str(profile.summary) && <p className="text-sm leading-6 text-[#607096]">{str(profile.summary)}</p>}
                </section>
              )}

              <Section title={t("parsedCv.skills")} count={skills.length}>
                {skills.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {skills.map((skill, index) => {
                      const months = typeof skill.experienceMonths === "number" ? skill.experienceMonths : null;
                      const label = str((skill.concept as Rec | undefined)?.label) || str(skill.rawLabel);
                      return (
                        <li
                          key={str(skill.claimId) || index}
                          className="max-w-full rounded-full bg-white px-2.5 py-1 text-xs text-[#14244B] border border-[#DCE4F3]"
                          title={str(skill.rawLabel) !== label ? str(skill.rawLabel) : undefined}
                        >
                          {label}
                          {months ? <span className="text-[#607096]"> · {fmt(t("parsedCv.months"), { n: months })}</span> : null}
                          {skill.assertionSource === "inferred" ? (
                            <span className="text-[#8A5A00]"> · {t("parsedCv.inferred")}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  empty("parsedCv.noneFound")
                )}
              </Section>

              <Section title={t("parsedCv.experience")} count={employment.length}>
                {employment.length ? (
                  <ol className="space-y-3">
                    {employment.map((job, index) => (
                      <li key={str(job.employmentId) || index} className="rounded-2xl bg-white p-3.5 border border-[#DCE4F3]">
                        <p className="text-sm font-semibold text-[#14244B]">
                          {str(job.jobTitle)}
                          {str(job.organization) ? <span className="font-normal text-[#607096]"> · {str(job.organization)}</span> : null}
                        </p>
                        {period(job, t("parsedCv.present")) && (
                          <p className="text-xs text-[#204195]">{period(job, t("parsedCv.present"))}</p>
                        )}
                        {arr(job.achievements).length > 0 && (
                          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-5 text-[#607096]">
                            {arr(job.achievements).map((item, i) => (
                              <li key={i}>{str(item.text)}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  empty("parsedCv.noneFound")
                )}
              </Section>

              <Section title={t("parsedCv.projects")} count={projects.length}>
                {projects.length ? (
                  <ul className="space-y-2">
                    {projects.map((project, index) => (
                      <li key={str(project.projectId) || index} className="text-sm">
                        <span className="font-semibold text-[#14244B]">{str(project.name)}</span>
                        {str(project.description) ? (
                          <p className="text-xs leading-5 text-[#607096]">{str(project.description)}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  empty("parsedCv.noneFound")
                )}
              </Section>

              <Section title={t("parsedCv.education")} count={education.length}>
                {education.length ? (
                  <ul className="space-y-1.5 text-sm">
                    {education.map((item, index) => (
                      <li key={str(item.educationId) || index}>
                        <span className="font-semibold text-[#14244B]">{str(item.institution)}</span>
                        {[str(item.degree), str(item.fieldOfStudy)].filter(Boolean).length > 0 && (
                          <span className="text-[#607096]"> · {[str(item.degree), str(item.fieldOfStudy)].filter(Boolean).join(", ")}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  empty("parsedCv.noneFound")
                )}
              </Section>

              {(certifications.length > 0 || languages.length > 0) && (
                <Section
                  title={t("parsedCv.other")}
                  count={certifications.length + languages.length}
                >
                  <ul className="space-y-1 text-sm text-[#607096]">
                    {certifications.map((item, index) => (
                      <li key={`c${index}`}>
                        {str(item.name)}
                        {str(item.issuer) ? ` · ${str(item.issuer)}` : ""}
                      </li>
                    ))}
                    {languages.map((item, index) => (
                      <li key={`l${index}`}>
                        {str(item.code).toUpperCase()}
                        {str(item.level) ? ` · ${str(item.level)}` : ""}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {cv.rawText?.trim() ? (
                <details className="rounded-2xl bg-white border border-[#DCE4F3]">
                  <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-[#14244B]">
                    {fmt(t("parsedCv.rawText"), { n: cv.rawText.length.toLocaleString() })}
                  </summary>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words border-t border-[#EAEFF8] px-3.5 py-3 font-mono text-[11.5px] leading-5 text-[#607096]">
                    {cv.rawText}
                  </pre>
                </details>
              ) : null}

              <p className="text-xs leading-5 text-[#607096]">{t("fixApp.parsedCv.wrongHint")}</p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default ParsedCvDrawer;
