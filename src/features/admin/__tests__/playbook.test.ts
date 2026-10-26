import { describe, expect, it } from "vitest";
import { groupEntries, type PlaybookEntry } from "@features/admin/services/playbook.service";

const entry = (id: string, status: PlaybookEntry["status"], helpful = 0, harmful = 0): PlaybookEntry => ({
  id, status, helpful, harmful, step: "probe", skill: null, text: id, origin: "reflection", replacesId: null,
  source: {}, note: null, decidedAt: null, createdAt: null,
});

describe("interviewer playbook", () => {
  it("groups by status, most net-helpful active lessons first", () => {
    const groups = groupEntries([entry("a", "ACTIVE", 1, 3), entry("b", "PROPOSED"), entry("c", "ACTIVE", 4, 0), entry("d", "RETIRED")]);
    expect(groups.ACTIVE.map((e) => e.id)).toEqual(["c", "a"]);
    expect(groups.PROPOSED.map((e) => e.id)).toEqual(["b"]);
    expect(groups.RETIRED.map((e) => e.id)).toEqual(["d"]);
  });
});
