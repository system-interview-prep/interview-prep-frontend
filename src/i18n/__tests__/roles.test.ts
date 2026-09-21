import { describe, it, expect } from "vitest";
import { formatUserRole } from "../roles";
import { getDictionary } from "../i18n";

describe("formatUserRole and role translations", () => {
  const enDict = getDictionary("en");
  const viDict = getDictionary("vi");
  const tEn = (key: string) => enDict[key] ?? key;
  const tVi = (key: string) => viDict[key] ?? key;

  it("translates CANDIDATE correctly in English and Vietnamese", () => {
    expect(formatUserRole("CANDIDATE", tEn)).toBe("Candidate");
    expect(formatUserRole("CANDIDATE", tVi)).toBe("Ứng viên");
  });

  it("handles lowercase candidate correctly", () => {
    expect(formatUserRole("candidate", tEn)).toBe("Candidate");
    expect(formatUserRole("candidate", tVi)).toBe("Ứng viên");
  });

  it("translates ADMIN correctly", () => {
    expect(formatUserRole("ADMIN", tEn)).toBe("Administrator");
    expect(formatUserRole("ADMIN", tVi)).toBe("Quản trị viên");
  });

  it("falls back to roleFallback when role is null or empty", () => {
    expect(formatUserRole(null, tEn)).toBe("Candidate");
    expect(formatUserRole(null, tVi)).toBe("Ứng viên");
    expect(formatUserRole("", tEn)).toBe("Candidate");
    expect(formatUserRole(undefined, tVi)).toBe("Ứng viên");
  });

  it("gracefully returns role string if unknown, without leaking key", () => {
    expect(formatUserRole("SPECIAL_ROLE", tEn)).toBe("SPECIAL_ROLE");
  });

  it("includes profile.badge key in en and vi", () => {
    expect(enDict["profile.badge"]).toBe("Profile & settings");
    expect(viDict["profile.badge"]).toBe("Hồ sơ & cài đặt");
  });
});
