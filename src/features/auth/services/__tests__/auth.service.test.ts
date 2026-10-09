import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apiClient", () => ({ default: {}, authApi: {} }));

import { completeAuthSession } from "../auth.service";

const session = (roles: string[]) => ({
  access_token: "token",
  user: { id: "u1", email: "u@x.io", name: "U", roles, provider: "local", picture: null, avatar: null },
});

describe("completeAuthSession", () => {
  it("routes question-bank actors to the admin console", () => {
    for (const role of ["QUESTION_AUTHOR", "QUESTION_REVIEWER", "QUESTION_BANK_ADMIN", "ADMIN"]) {
      expect(completeAuthSession(session([role]), "ADMIN").isAdmin).toBe(true);
    }
  });

  it("keeps candidates out of the admin console", () => {
    expect(completeAuthSession(session(["CANDIDATE"])).isAdmin).toBe(false);
    expect(() => completeAuthSession(session(["CANDIDATE"]), "ADMIN")).toThrow();
  });
});
