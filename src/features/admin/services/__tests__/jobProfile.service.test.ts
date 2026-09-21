import { describe, it, expect, vi } from "vitest";

const { post, get, patch } = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/apiClient", () => ({ default: { post, get, patch } }));

import {
  jobProfileApi,
  serializeFinalizePayload,
  initialFinalizeForm,
  type CanonicalFinalizeFormState,
} from "../jobProfile.service";

describe("Admin Job Finalize Serializer & API Contract (PR5)", () => {
  // [Test I] finalize form sends listingStatus, không dùng legacy status
  it("[Test I] sends listingStatus and does not include legacy status property", () => {
    const form: CanonicalFinalizeFormState = {
      ...initialFinalizeForm,
      title: "Senior Backend Engineer",
      listingStatus: "ACTIVE",
    };

    const payload = serializeFinalizePayload(form, "Senior Backend Engineer");

    expect(payload.listingStatus).toBe("ACTIVE");
    expect((payload as Record<string, unknown>).status).toBeUndefined();

    const draftForm: CanonicalFinalizeFormState = {
      ...initialFinalizeForm,
      title: "Draft Role",
      listingStatus: "DRAFT",
    };

    const draftPayload = serializeFinalizePayload(draftForm, "Draft Role");
    expect(draftPayload.listingStatus).toBe("DRAFT");
    expect((draftPayload as Record<string, unknown>).status).toBeUndefined();
  });

  // [Test J] empty form values serialize null
  it("[Test J] serializes empty strings as null and empty numeric inputs as null", () => {
    const emptyForm: CanonicalFinalizeFormState = {
      title: "",
      companyName: "   ",
      companyLogoUrl: "",
      location: "  ",
      workMode: "",
      employmentType: "",
      seniority: "",
      experienceMinYears: "  ",
      experienceMaxYears: "",
      salaryMin: "   ",
      salaryMax: "",
      salaryCurrency: "",
      salaryPeriod: "",
      salaryNegotiable: "unknown",
      primaryTaxonomyConceptId: "",
      keywords: "",
      sourceType: "",
      sourceKey: "",
      sourceName: "",
      sourceUrl: "",
      applyUrl: "",
      externalJobId: "",
      postedAt: "  ",
      listingStatus: "ACTIVE",
    };

    const payload = serializeFinalizePayload(emptyForm, "Job Title", "");

    expect(payload.title).toBe("Job Title");
    expect(payload.companyName).toBeNull();
    expect(payload.companyLogoUrl).toBeNull();
    expect(payload.location).toBeNull();
    expect(payload.workMode).toBeNull();
    expect(payload.employmentType).toBeNull();
    expect(payload.seniority).toBeNull();
    expect(payload.experience).toBeNull();
    expect(payload.salary).toBeNull();
    expect(payload.primaryTaxonomyConceptId).toBeNull();
    expect(payload.externalJobId).toBeNull();
    expect(payload.postedAt).toBeNull();
    expect(payload.description).toBeNull();
    expect(payload.keywords).toEqual([]);
    expect(payload.source?.name).toBeNull();
    expect(payload.source?.url).toBeNull();
    expect(payload.source?.applyUrl).toBeNull();
    // Default source type & key fallback
    expect(payload.source?.type).toBe("internal_upload");
    expect(payload.source?.key).toBe("default");
  });

  it("serializes valid populated fields and numeric 0 properly", () => {
    const populatedForm: CanonicalFinalizeFormState = {
      title: "Junior Dev",
      companyName: "NSTAGE",
      companyLogoUrl: "https://example.com/logo.png",
      location: "Hà Nội",
      workMode: "hybrid",
      employmentType: "full_time",
      seniority: "junior",
      experienceMinYears: "0",
      experienceMaxYears: "2",
      salaryMin: "15000000",
      salaryMax: "25000000",
      salaryCurrency: "VND",
      salaryPeriod: "month",
      salaryNegotiable: "no",
      primaryTaxonomyConceptId: "tech.game-dev",
      keywords: "unity, c#, mobile",
      sourceType: "partner_api",
      sourceKey: "key-123",
      sourceName: "NSTAGE Official",
      sourceUrl: "https://nstage.vn/jobs/1",
      applyUrl: "https://nstage.vn/apply/1",
      externalJobId: "ext-999",
      postedAt: "2026-03-20T10:00:00Z",
      listingStatus: "ACTIVE",
    };

    const payload = serializeFinalizePayload(
      populatedForm,
      "Junior Dev",
      "<p>Job description html</p>"
    );

    expect(payload.title).toBe("Junior Dev");
    expect(payload.companyName).toBe("NSTAGE");
    expect(payload.companyLogoUrl).toBe("https://example.com/logo.png");
    expect(payload.location).toBe("Hà Nội");
    expect(payload.workMode).toBe("hybrid");
    expect(payload.employmentType).toBe("full_time");
    expect(payload.seniority).toBe("junior");
    expect(payload.experience).toEqual({ minYears: 0, maxYears: 2 });
    expect(payload.salary).toEqual({
      min: 15_000_000,
      max: 25_000_000,
      currency: "VND",
      period: "month",
      negotiable: false,
    });
    expect(payload.primaryTaxonomyConceptId).toBe("tech.game-dev");
    expect(payload.keywords).toEqual(["unity", "c#", "mobile"]);
    expect(payload.source).toEqual({
      type: "partner_api",
      key: "key-123",
      name: "NSTAGE Official",
      url: "https://nstage.vn/jobs/1",
      applyUrl: "https://nstage.vn/apply/1",
    });
    expect(payload.externalJobId).toBe("ext-999");
    expect(payload.postedAt).toBe("2026-03-20T10:00:00Z");
    expect(payload.listingStatus).toBe("ACTIVE");
    expect(payload.description).toBe("<p>Job description html</p>");
  });

  it("calls jobProfileApi.finalizeUpload with correct endpoint and payload", async () => {
    post.mockResolvedValueOnce({ data: { id: "job-finalized-1" } });

    const payload = serializeFinalizePayload(
      {
        ...initialFinalizeForm,
        companyName: "NSTAGE",
        listingStatus: "ACTIVE",
      },
      "Unity Developer"
    );

    const res = await jobProfileApi.finalizeUpload("upload-123", payload);

    expect(post).toHaveBeenCalledWith(
      "/admin/job-descriptions/uploads/upload-123/finalize",
      expect.objectContaining({
        title: "Unity Developer",
        companyName: "NSTAGE",
        listingStatus: "ACTIVE",
      })
    );
    expect(res.data.id).toBe("job-finalized-1");
  });

  it("supports canonical seniority 'fresher' and canonical source types", () => {
    const fresherForm: CanonicalFinalizeFormState = {
      ...initialFinalizeForm,
      title: "Fresher Java Developer",
      seniority: "fresher",
      sourceType: "greenhouse",
      listingStatus: "ACTIVE",
    };

    const payload = serializeFinalizePayload(fresherForm, "Fresher Java Developer");
    expect(payload.seniority).toBe("fresher");
    expect(payload.source?.type).toBe("greenhouse");
  });
});
