import { describe, expect, it } from "vitest";
import { adminHomePath, canOpenAdminPath, primaryAdminRole } from "@features/admin/access";
import { actionPermission, actionVisible } from "@features/admin/components/AdminQuestionDetailClient";
import { bankAbilities, viewParams } from "@features/admin/components/AdminQuestionBankClient";
import type { QuestionDetail } from "@features/admin/services/questionBank.service";

describe("admin access by role", () => {
  it("lets ADMIN everywhere and the question author only to their pages", () => {
    expect(canOpenAdminPath("/admin/users", ["ADMIN"])).toBe(true);
    expect(canOpenAdminPath("/admin/users", ["QUESTION_AUTHOR"])).toBe(false);
    expect(canOpenAdminPath("/admin/question-bank/abc", ["QUESTION_AUTHOR"])).toBe(true);
    expect(canOpenAdminPath("/admin/rubrics", ["QUESTION_AUTHOR"])).toBe(true);
    expect(canOpenAdminPath("/admin/question-quality", ["QUESTION_AUTHOR"])).toBe(false);
    // Reviewer and bank admin were folded into ADMIN (28/10): they open nothing.
    expect(canOpenAdminPath("/admin/question-bank", ["QUESTION_REVIEWER"])).toBe(false);
    expect(canOpenAdminPath("/admin/question-bank", ["QUESTION_BANK_ADMIN"])).toBe(false);
    // Profile not read yet: never flash "no access".
    expect(canOpenAdminPath("/admin/users", null)).toBe(true);
  });

  it("opens the console where the role works", () => {
    expect(adminHomePath(["ADMIN", "QUESTION_AUTHOR"])).toBe("/admin/dashboard");
    expect(adminHomePath(["QUESTION_AUTHOR"])).toBe("/admin/question-bank");
    expect(primaryAdminRole(["QUESTION_AUTHOR", "QUESTION_REVIEWER"])).toBe("QUESTION_AUTHOR");
    expect(primaryAdminRole(["QUESTION_AUTHOR", "ADMIN"])).toBe("ADMIN");
  });
});

function detail(status: string, actions?: QuestionDetail["actions"], rubric = true) {
  return {
    actions,
    currentVersion: { status },
    rubric: rubric ? {} : null,
  } as unknown as QuestionDetail;
}

describe("question actions", () => {
  it("uses the backend permission and shows a locked button only when the reason helps", () => {
    const own = detail("IN_REVIEW", { review: { allowed: false, reason: "own_question" } } as QuestionDetail["actions"]);
    expect(actionPermission(own, "review")).toEqual({ allowed: false, reason: "own_question" });
    expect(actionVisible({ allowed: false, reason: "own_question" })).toBe(true);
    expect(actionVisible({ allowed: false, reason: "no_role" })).toBe(false);
    expect(actionVisible({ allowed: false, reason: "not_in_review" })).toBe(false);
  });

  it("falls back to the status when the backend sends no permissions", () => {
    expect(actionPermission(detail("DRAFT"), "submit").allowed).toBe(true);
    expect(actionPermission(detail("DRAFT", undefined, false), "submit").allowed).toBe(false);
    expect(actionPermission(detail("APPROVED"), "revise").allowed).toBe(true);
    expect(actionPermission(detail("APPROVED"), "review").allowed).toBe(false);
  });
});

describe("question list views", () => {
  it("maps a view to list filters", () => {
    expect(viewParams("all")).toEqual({});
    expect(viewParams("ai")).toEqual({ source: "ai" });
    expect(viewParams("review")).toEqual({ mine: "review" });
  });

  it("offers adding and importing only to roles that can", () => {
    expect(bankAbilities(["QUESTION_REVIEWER"])).toEqual({ add: false, import: false });
    expect(bankAbilities(["QUESTION_BANK_ADMIN"])).toEqual({ add: false, import: false });
    expect(bankAbilities(["QUESTION_AUTHOR"])).toEqual({ add: true, import: true });
    expect(bankAbilities(["ADMIN"])).toEqual({ add: true, import: true });
  });
});

describe("assignable roles", () => {
  it("drops retired roles before saving and never leaves the list empty", async () => {
    const { assignableOf } = await import("@features/admin/components/AdminUsersClient");
    expect(assignableOf(["QUESTION_AUTHOR", "QUESTION_REVIEWER"])).toEqual(["QUESTION_AUTHOR"]);
    expect(assignableOf(["QUESTION_BANK_ADMIN"])).toEqual(["CANDIDATE"]);
  });
});
