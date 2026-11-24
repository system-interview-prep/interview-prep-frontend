import { describe, expect, it } from "vitest";
import { formatVnd, PRICING_PLANS } from "../data/pricing.data";
import { RESOURCE_ITEMS, RESOURCE_TOPICS } from "../data/resources.data";

describe("Pricing Data Integrity", () => {
  it("formats VND currency correctly without decimals", () => {
    expect(formatVnd(99000)).toBe("99.000");
    expect(formatVnd(249000)).toBe("249.000");
    expect(formatVnd(49000)).toBe("49.000");
  });

  it("contains exact pricing plan amounts", () => {
    const starter = PRICING_PLANS.find((p) => p.id === "starter");
    const pro = PRICING_PLANS.find((p) => p.id === "pro");
    const flex = PRICING_PLANS.find((p) => p.id === "flex");

    expect(starter?.price).toBe(99000);
    expect(pro?.price).toBe(249000);
    expect(flex?.price).toBe(49000);
  });
});

describe("Resources Data Integrity", () => {
  it("stores readMinutes as a positive number", () => {
    RESOURCE_ITEMS.forEach((item) => {
      expect(typeof item.readMinutes).toBe("number");
      expect(item.readMinutes).toBeGreaterThan(0);
    });
  });

  it("has valid topic IDs defined", () => {
    const topicIds = RESOURCE_TOPICS.map((t) => t.id);
    expect(topicIds).toContain("all");
    expect(topicIds).toContain("cv");
    expect(topicIds).toContain("matching");
    expect(topicIds).toContain("interview");
    expect(topicIds).toContain("voice");
    expect(topicIds).toContain("career");
    expect(topicIds).toContain("offer");
  });
});
