import { describe, expect, it } from "vitest";
import { normalizeUserCvDto } from "../services/userCv.service";

describe("normalizeUserCvDto", () => {
  it("preserves the parser text used by the CV matching report", () => {
    expect(normalizeUserCvDto({ id: "cv-1", rawText: "Parsed CV text" }).rawText)
      .toBe("Parsed CV text");
  });

  it("accepts the snake-case raw text returned by older API responses", () => {
    expect(normalizeUserCvDto({ id: "cv-1", raw_text: "Parsed CV text" }).rawText)
      .toBe("Parsed CV text");
  });

  it("preserves canonical CV sections and normalizes snake-case fields for the parsed-data drawer", () => {
    const cv = normalizeUserCvDto({
      id: "cv-1",
      parsedData: {
        schema_version: "2.1",
        profile: { headline: "AI Engineer Intern" },
        skills: [{ claim_id: "skill-1", raw_label: "Python", experience_months: 12 }],
        employment: [{ employment_id: "work-1", job_title: "AI Engineer Intern", achievements: [{ text: "Built an NLP classifier" }] }],
        projects: [{ project_id: "project-1", name: "Resume Matcher" }],
        education: [{ education_id: "education-1", institution: "IUH", field_of_study: "Computer Science" }],
        certifications: [{ certification_id: "cert-1", name: "Google AI Essentials", issuer: "Google" }],
        languages: [{ code: "eng", level: "B2" }],
      },
    });

    expect(cv.parsedData?.skills).toHaveLength(1);
    expect(cv.parsedData?.skills?.[0]).toMatchObject({ claimId: "skill-1", rawLabel: "Python", experienceMonths: 12 });
    expect(cv.parsedData?.employment?.[0]).toMatchObject({ employmentId: "work-1", jobTitle: "AI Engineer Intern" });
    expect(cv.parsedData?.projects?.[0]?.name).toBe("Resume Matcher");
    expect(cv.parsedData?.education?.[0]?.fieldOfStudy).toBe("Computer Science");
    expect(cv.parsedData?.certifications?.[0]?.name).toBe("Google AI Essentials");
    expect(cv.parsedData?.languages?.[0]?.level).toBe("B2");
  });

  it("unwraps the legacy resume envelope", () => {
    const cv = normalizeUserCvDto({
      id: "cv-1",
      parsed_data: { resume: { projects: [{ project_id: "p-1", name: "NLP Project" }] }, identity: { full_name: "Private Name" } },
    });

    expect(cv.parsedData?.projects?.[0]).toMatchObject({ projectId: "p-1", name: "NLP Project" });
    expect(cv.parsedData).not.toHaveProperty("identity");
  });
});
