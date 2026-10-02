import { describe, it, expect } from "vitest";
import { normalizePerformanceInput } from "@/lib/performanceUtils";

describe("normalizePerformanceInput", () => {
  it("defaults missing and invalid fields to 0", () => {
    const out = normalizePerformanceInput({});
    expect(out).toEqual({
      views: 0, likes: 0, comments: 0, shares: 0, favorites: 0,
      orderCount: 0, gmv: 0, commission: 0,
    });
  });

  it("clamps negatives and non-numeric to 0", () => {
    const out = normalizePerformanceInput({
      views: -5, likes: Number.NaN, gmv: "abc" as unknown as number, commission: -10,
    });
    expect(out.views).toBe(0);
    expect(out.likes).toBe(0);
    expect(out.gmv).toBe(0);
    expect(out.commission).toBe(0);
  });

  it("rounds counts and keeps amounts as numbers", () => {
    const out = normalizePerformanceInput({ views: 12.6, orderCount: 3.2, gmv: 199.9, commission: 59.9 });
    expect(out.views).toBe(13);
    expect(out.orderCount).toBe(3);
    expect(out.gmv).toBe(199.9);
    expect(out.commission).toBe(59.9);
  });
});
