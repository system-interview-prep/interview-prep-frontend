import { describe, expect, it } from "vitest";

import { resolveInterviewAccessToken } from "../aiService";

describe("resolveInterviewAccessToken", () => {
  it("prefers the canonical localStorage token over the cookie", () => {
    expect(
      resolveInterviewAccessToken(
        "local-token",
        "access_token=cookie-token; role=CANDIDATE",
      ),
    ).toBe("local-token");
  });

  it("falls back to the decoded access_token cookie", () => {
    expect(
      resolveInterviewAccessToken(
        null,
        "role=CANDIDATE; access_token=cookie%20token",
      ),
    ).toBe("cookie token");
  });

  it("returns null when neither token source is available", () => {
    expect(resolveInterviewAccessToken(null, "role=CANDIDATE")).toBeNull();
  });
});
