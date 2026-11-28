import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: "vi" }),
}));

import { JobCard } from "../JobCard";
import type { JobCardData } from "../job-card.types";

const job: JobCardData = {
  id: "job-123",
  title: "Full Stack Developer",
  company: { name: "Example Co" },
  fit: {
    met: 2,
    total: 8,
    cvId: "cv-1",
    cvName: "Candidate CV.pdf",
    analyzedAt: "2026-11-03T08:00:00Z",
    attemptId: "fit-attempt-1",
  },
};

describe("JobCard navigation", () => {
  it("keeps the detail link clickable through card content and interactive controls", () => {
    const html = renderToStaticMarkup(
      <JobCard job={job} onInterview={() => undefined} onToggleSave={() => undefined} />,
    );

    expect(html).toContain('href="/dashboard/jobs/job-123"');
    expect(html).toContain('href="/interview/cv-score?candidateId=cv-1&amp;jobId=job-123&amp;fitAttemptId=fit-attempt-1"');
    expect(html).toContain("pointer-events-none relative z-[2]");
    expect(html).toContain("pointer-events-auto relative z-[3]");
    expect(html).toContain("Full Stack Developer");
  });

  it("does not link a legacy summary without an attempt id to a new matching run", () => {
    const legacyJob = { ...job, fit: { ...job.fit!, attemptId: null } };
    const html = renderToStaticMarkup(<JobCard job={legacyJob} />);

    expect(html).toContain("jobs.fit.label");
    expect(html).not.toContain("/interview/cv-score");
  });
});
