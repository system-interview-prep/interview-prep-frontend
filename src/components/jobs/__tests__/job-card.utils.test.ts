import { describe, it, expect } from "vitest";
import {
  mapJobToJobCard,
  formatSalary,
  formatExperience,
  getCompanyInitials,
  formatRelativeTime,
  normalizeWorkplaceType,
  normalizeEmploymentType,
  normalizeSeniority,
} from "../job-card.utils";

describe("Job Card Utilities & Normalizer (PR5)", () => {
  it("normalizes workplace types accurately", () => {
    expect(normalizeWorkplaceType("Remote")).toBe("remote");
    expect(normalizeWorkplaceType("làm việc từ xa")).toBe("remote");
    expect(normalizeWorkplaceType("hybrid")).toBe("hybrid");
    expect(normalizeWorkplaceType("linh hoạt")).toBe("hybrid");
    expect(normalizeWorkplaceType("on_site")).toBe("onsite");
    expect(normalizeWorkplaceType("tại văn phòng")).toBe("onsite");
    expect(normalizeWorkplaceType("N/A")).toBeUndefined();
    expect(normalizeWorkplaceType(null)).toBeUndefined();
  });

  it("normalizes employment types accurately", () => {
    expect(normalizeEmploymentType("full_time")).toBe("full_time");
    expect(normalizeEmploymentType("toàn thời gian")).toBe("full_time");
    expect(normalizeEmploymentType("part_time")).toBe("part_time");
    expect(normalizeEmploymentType("internship")).toBe("internship");
    expect(normalizeEmploymentType("contract")).toBe("contract");
    expect(normalizeEmploymentType("temporary")).toBe("temporary");
    expect(normalizeEmploymentType("unknown")).toBeUndefined();
  });

  it("normalizes seniority levels accurately", () => {
    expect(normalizeSeniority("intern")).toBe("intern");
    expect(normalizeSeniority("thực tập")).toBe("intern");
    expect(normalizeSeniority("entry")).toBe("fresher");
    expect(normalizeSeniority("fresher")).toBe("fresher");
    expect(normalizeSeniority("junior")).toBe("junior");
    expect(normalizeSeniority("mid")).toBe("mid");
    expect(normalizeSeniority("middle")).toBe("mid");
    expect(normalizeSeniority("senior")).toBe("senior");
    expect(normalizeSeniority("lead")).toBe("lead");
    expect(normalizeSeniority("manager")).toBe("manager");
    expect(normalizeSeniority("undefined")).toBeUndefined();
  });

  it("computes company initials for avatar fallback", () => {
    expect(getCompanyInitials("FPT Software")).toBe("FS");
    expect(getCompanyInitials("Canva")).toBe("CA");
    expect(getCompanyInitials("Google Cloud Platform")).toBe("GC");
    expect(getCompanyInitials("")).toBe("CO");
  });

  // [Test A] map API company NSTAGE -> JobCard company NSTAGE
  it("[Test A] maps API company NSTAGE directly to JobCard company NSTAGE", () => {
    const rawNStage = {
      id: "01aaa05b-c5e6-464f-a691-8c3bf56bb96b",
      title: "Unity Developer - Game Mobil",
      company: {
        name: "NSTAGE",
        logoUrl: null,
      },
      location: "Hà Nội",
      workMode: null,
      employmentType: null,
      seniority: null,
      experience: {
        minYears: 2,
        maxYears: null,
      },
      salary: null,
      primaryTaxonomy: {
        conceptId: "technology.game-development",
        label: "Game Development",
        version: "v1",
        kind: "role",
      },
      postedAt: null,
      createdAt: "2026-03-20T10:00:00Z",
    };

    const mapped = mapJobToJobCard(rawNStage);
    expect(mapped.id).toBe("01aaa05b-c5e6-464f-a691-8c3bf56bb96b");
    expect(mapped.title).toBe("Unity Developer - Game Mobil");
    expect(mapped.company?.name).toBe("NSTAGE");
    expect(mapped.company?.logoUrl).toBeNull();
    expect(mapped.category).toBe("Game Development");
    expect(mapped.location?.display).toBe("Hà Nội");
    expect(mapped.location?.workplaceType).toBeUndefined();
    expect(mapped.employmentType).toBeUndefined();
    expect(mapped.seniority).toBeUndefined();
    expect(mapped.experience).toEqual({ minYears: 2, maxYears: null });
    expect(mapped.salary).toBeUndefined();
    expect(mapped.postedAt).toBeUndefined();
  });

  // [Test B] taxonomy không map thành company
  it("[Test B] taxonomy does not map to company name, stays as category badge", () => {
    const rawTaxonomyJob = {
      id: "job-tax-1",
      title: "Unity Developer - Game Mobil",
      primaryTaxonomy: {
        conceptId: "technology.game-development",
        label: "Game Development",
        version: "v1",
        kind: "role",
      },
      company: null,
      location: "Hà Nội",
    };

    const mapped = mapJobToJobCard(rawTaxonomyJob);
    expect(mapped.company).toBeUndefined();
    expect(mapped.category).toBe("Game Development");
    expect(mapped.location?.display).toBe("Hà Nội");
  });

  it("handles company object with only logoUrl safely when company name is null", () => {
    const jobWithOnlyLogo = {
      id: "job-logo-only",
      title: "Designer",
      company: {
        name: null,
        logoUrl: "https://example.com/logo.png",
      },
    };
    const mapped = mapJobToJobCard(jobWithOnlyLogo);
    expect(mapped.company).toBeDefined();
    expect(mapped.company?.name).toBeNull();
    expect(mapped.company?.logoUrl).toBe("https://example.com/logo.png");
  });

  // [Test C] experience min=2 -> "2+ năm kinh nghiệm"
  it("[Test C] formats experience min=2 as '2+ năm kinh nghiệm'", () => {
    expect(formatExperience({ minYears: 2, maxYears: null })).toBe("2+ năm kinh nghiệm");
    expect(formatExperience({ minYears: 2, maxYears: null }, "vi")).toBe("2+ năm kinh nghiệm");
    expect(formatExperience({ minYears: 2, maxYears: null }, "en")).toBe("2+ yrs experience");
  });

  // [Test D] min=2 max=4 -> "2–4 năm kinh nghiệm"
  it("[Test D] formats experience min=2 max=4 as '2–4 năm kinh nghiệm', null as null", () => {
    expect(formatExperience({ minYears: 2, maxYears: 4 })).toBe("2–4 năm kinh nghiệm");
    expect(formatExperience({ minYears: 2, maxYears: 4 }, "vi")).toBe("2–4 năm kinh nghiệm");
    expect(formatExperience({ minYears: 2, maxYears: 4 }, "en")).toBe("2–4 yrs experience");
    expect(formatExperience({ minYears: null, maxYears: null })).toBeNull();
    expect(formatExperience(undefined)).toBeNull();
  });

  // [Test E] workMode null -> không render
  it("[Test E] when workMode is null, does not render workplaceType", () => {
    const jobWithNullWorkMode = {
      id: "job-e",
      title: "Backend Engineer",
      location: "Hà Nội",
      workMode: null,
    };
    const mapped = mapJobToJobCard(jobWithNullWorkMode);
    expect(mapped.location?.display).toBe("Hà Nội");
    expect(mapped.location?.workplaceType).toBeUndefined();
  });

  // [Test F] salary null -> không render
  it("[Test F] when salary is null, salary is undefined and formatSalary returns null", () => {
    const jobWithNullSalary = {
      id: "job-f",
      title: "Product Manager",
      salary: null,
    };
    const mapped = mapJobToJobCard(jobWithNullSalary);
    expect(mapped.salary).toBeUndefined();
    expect(formatSalary(mapped.salary)).toBeNull();
    expect(formatSalary(undefined)).toBeNull();
    expect(formatSalary({})).toBeNull();
  });

  // [Test G] postedAt null -> không dùng createdAt
  it("[Test G] when postedAt is null, does not fallback to createdAt", () => {
    const jobNoPostedAt = {
      id: "job-g",
      title: "Mobile Developer",
      postedAt: null,
      createdAt: "2026-03-20T10:00:00Z",
      updatedAt: "2026-03-21T10:00:00Z",
    };
    const mapped = mapJobToJobCard(jobNoPostedAt);
    expect(mapped.postedAt).toBeUndefined();
  });

  // [Test H] verified không tự xuất hiện
  it("[Test H] verified does not appear automatically or from structuredData", () => {
    const jobWithoutVerified = {
      id: "job-h1",
      title: "Backend Engineer",
      company: { name: "NSTAGE" },
      structuredData: { verified: true }, // structuredData is audit-only!
    };
    const mapped1 = mapJobToJobCard(jobWithoutVerified);
    expect(mapped1.company?.verified).toBe(false);

    const jobWithExplicitFalse = {
      id: "job-h2",
      title: "Backend Engineer",
      company: { name: "NSTAGE", verified: false },
    };
    const mapped2 = mapJobToJobCard(jobWithExplicitFalse);
    expect(mapped2.company?.verified).toBe(false);

    const jobWithExplicitTrue = {
      id: "job-h3",
      title: "Backend Engineer",
      company: { name: "NSTAGE", verified: true },
    };
    const mapped3 = mapJobToJobCard(jobWithExplicitTrue);
    expect(mapped3.company?.verified).toBe(true);
  });

  // [Test K] salary negotiable semantics đúng
  it("[Test K] handles salary negotiable semantics correctly", () => {
    // Numeric salary format
    const numericSalary = {
      min: 20_000_000,
      max: 30_000_000,
      currency: "VND",
      period: "month" as const,
    };
    expect(formatSalary(numericSalary, undefined, "vi")).toBe("20M – 30M VND / tháng");

    // Negotiable true without numeric
    const negotiableSalary = {
      min: null,
      max: null,
      negotiable: true,
    };
    expect(formatSalary(negotiableSalary, undefined, "vi")).toBe("Thỏa thuận");
    expect(formatSalary(negotiableSalary, undefined, "en")).toBe("Negotiable");

    // Negotiable null / false without numeric -> must NOT render "Thỏa thuận"
    const nullNegotiableSalary = {
      min: null,
      max: null,
      negotiable: null,
    };
    expect(formatSalary(nullNegotiableSalary)).toBeNull();

    const falseNegotiableSalary = {
      min: null,
      max: null,
      negotiable: false,
    };
    expect(formatSalary(falseNegotiableSalary)).toBeNull();
  });

  // [Test L] API nested nullable types không crash
  it("[Test L] handles nested nullable types safely without crashing", () => {
    const nullableJob = {
      id: "job-nulls",
      title: "Fullstack Developer",
      company: null,
      experience: null,
      salary: null,
      location: null,
      workMode: null,
      employmentType: null,
      seniority: null,
      primaryTaxonomy: null,
      source: null,
      postedAt: null,
      keywords: null,
      description: null,
      structuredData: null,
    };

    expect(() => mapJobToJobCard(nullableJob)).not.toThrow();
    const mapped = mapJobToJobCard(nullableJob);
    expect(mapped.id).toBe("job-nulls");
    expect(mapped.title).toBe("Fullstack Developer");
    expect(mapped.company).toBeUndefined();
    expect(mapped.experience).toBeUndefined();
    expect(mapped.salary).toBeUndefined();
    expect(mapped.location).toBeUndefined();
  });

  it("handles relative time formatting correctly", () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString(), "vi")).toBe("Vừa xong");
    expect(formatRelativeTime(now.toISOString(), "en")).toBe("Just now");

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo.toISOString(), "vi")).toBe("2 ngày trước");
    expect(formatRelativeTime(twoDaysAgo.toISOString(), "en")).toBe("2d ago");
  });

  it("filters out dirty strings like 'N/A', 'null', 'unknown' and never leaks N/A", () => {
    const dirty = {
      id: "job-dirty",
      title: "Frontend Developer",
      companyName: "N/A",
      location: "null",
      workMode: "unknown",
      seniority: "not provided",
      salary: {
        display: "N/A",
      },
    };

    const mapped = mapJobToJobCard(dirty);

    expect(mapped.company).toBeUndefined();
    expect(mapped.location).toBeUndefined();
    expect(mapped.seniority).toBeUndefined();
    expect(mapped.salary).toBeUndefined();
  });

  it("preserves normalized camelCase and snake_case for workMode, employmentType, seniority", () => {
    const snakeCaseJob = {
      id: "job-snake",
      title: "Cloud Architect",
      work_mode: "on_site",
      employment_type: "full_time",
      seniority_level: "senior",
    };
    const mappedSnake = mapJobToJobCard(snakeCaseJob);
    expect(mappedSnake.location?.workplaceType).toBe("onsite");
    expect(mappedSnake.employmentType).toBe("full_time");
    expect(mappedSnake.seniority).toBe("senior");

    const camelCaseJob = {
      id: "job-camel",
      title: "QA Engineer",
      workMode: "hybrid",
      employmentType: "contract",
      seniority: "lead",
    };
    const mappedCamel = mapJobToJobCard(camelCaseJob);
    expect(mappedCamel.location?.workplaceType).toBe("hybrid");
    expect(mappedCamel.employmentType).toBe("contract");
    expect(mappedCamel.seniority).toBe("lead");
  });
});
