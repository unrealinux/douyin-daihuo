import { describe, it, expect } from "vitest";
import { computeAccountStats } from "@/lib/accountUtils";

describe("computeAccountStats", () => {
  it("counts total and published, and aggregates measured rows", () => {
    const stats = computeAccountStats([
      { publishStatus: "PUBLISHED", performance: { views: 1000, orderCount: 10, gmv: 500, completionRate: 20 } },
      { publishStatus: "PUBLISHED", performance: { views: 3000, orderCount: 20, gmv: 1500, completionRate: 30 } },
      { publishStatus: "PLANNED", performance: null },
      { publishStatus: "SKIPPED", performance: null },
    ]);
    expect(stats.total).toBe(4);
    expect(stats.published).toBe(2);
    expect(stats.measured).toBe(2);
    expect(stats.views).toBe(4000);
    expect(stats.orderCount).toBe(30);
    expect(stats.gmv).toBe(2000);
    expect(stats.avgViews).toBe(2000);
    expect(stats.avgCompletionRate).toBe(25);
    expect(stats.gmvPerPost).toBe(1000);
  });

  it("returns zeros when nothing measured", () => {
    const stats = computeAccountStats([{ publishStatus: "PLANNED", performance: null }]);
    expect(stats.measured).toBe(0);
    expect(stats.views).toBe(0);
    expect(stats.avgViews).toBe(0);
    expect(stats.avgCompletionRate).toBeNull();
    expect(stats.conversionRate).toBeNull();
  });

  it("handles empty schedules", () => {
    const stats = computeAccountStats([]);
    expect(stats.total).toBe(0);
    expect(stats.published).toBe(0);
  });
});
