import { describe, it, expect } from "vitest";
import {
  diagnosePerformance,
  normalizePerformanceInput,
  PERFORMANCE_KEYS,
} from "@/lib/performanceUtils";

describe("normalizePerformanceInput", () => {
  it("defaults missing and invalid fields to 0", () => {
    const out = normalizePerformanceInput({});
    expect(out).toEqual({
      views: 0, likes: 0, comments: 0, shares: 0, favorites: 0,
      orderCount: 0, gmv: 0, commission: 0,
      completionRate: 0, threeSecRate: 0, avgWatchSec: 0,
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

  it("clamps rates to 0-100 and keeps decimals", () => {
    const out = normalizePerformanceInput({ completionRate: 25.5, threeSecRate: 180, avgWatchSec: 12.3 });
    expect(out.completionRate).toBe(25.5);
    expect(out.threeSecRate).toBe(100);
    expect(out.avgWatchSec).toBe(12.3);
  });

  it("exposes the same key set used for persistence", () => {
    expect([...PERFORMANCE_KEYS]).toContain("completionRate");
    expect(Object.keys(normalizePerformanceInput({})).sort()).toEqual([...PERFORMANCE_KEYS].sort());
  });
});

describe("diagnosePerformance", () => {
  it("returns unknown when no data", () => {
    expect(diagnosePerformance({}).level).toBe("unknown");
  });

  it("returns good when all baselines pass", () => {
    const d = diagnosePerformance({ views: 5000, completionRate: 25, threeSecRate: 45 });
    expect(d.level).toBe("good");
    expect(d.issues).toHaveLength(0);
  });

  it("flags low completion and 3s rate with SOP suggestions", () => {
    const d = diagnosePerformance({ views: 1000, completionRate: 12, threeSecRate: 20 });
    expect(d.level).toBe("warn");
    expect(d.issues.join()).toContain("完播率");
    expect(d.issues.join()).toContain("3 秒播放率");
    expect(d.suggestions.join()).toContain("打磨文案");
    expect(d.suggestions.join()).toContain("钩子");
  });

  it("suggests switching account when views stay below 200", () => {
    const d = diagnosePerformance({ views: 150 });
    expect(d.level).toBe("warn");
    expect(d.suggestions.join()).toContain("换号");
  });
});
