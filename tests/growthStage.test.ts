import { describe, it, expect } from "vitest";
import { evaluateGrowthStage, monthsBetween } from "@/lib/growthStage";

describe("evaluateGrowthStage", () => {
  it("stage 1 with no publications", () => {
    const g = evaluateGrowthStage({ totalOrders: 0, publishedCount: 0, monthsActive: 0, categoryCount: 0 });
    expect(g.stage).toBe(1);
    expect(g.progress).toBe(0);
    expect(g.next).toContain("第一条");
  });

  it("stage 1 while ramping to 50 orders", () => {
    const g = evaluateGrowthStage({ totalOrders: 20, publishedCount: 15, monthsActive: 1, categoryCount: 1 });
    expect(g.stage).toBe(1);
    expect(g.progress).toBe(40);
  });

  it("stage 2 after 50 orders", () => {
    const g = evaluateGrowthStage({ totalOrders: 60, publishedCount: 30, monthsActive: 2, categoryCount: 1 });
    expect(g.stage).toBe(2);
  });

  it("stage 3 after 3 months", () => {
    const g = evaluateGrowthStage({ totalOrders: 200, publishedCount: 60, monthsActive: 3.5, categoryCount: 2 });
    expect(g.stage).toBe(3);
    expect(g.goal).toContain("潜力新品");
  });

  it("stage 4 after 6 months", () => {
    const g = evaluateGrowthStage({ totalOrders: 900, publishedCount: 200, monthsActive: 7, categoryCount: 4 });
    expect(g.stage).toBe(4);
    expect(g.progress).toBe(100);
  });

  it("promotes to stage 2 when a winning product exists", () => {
    const g = evaluateGrowthStage({ totalOrders: 10, publishedCount: 12, monthsActive: 2, categoryCount: 1, hasWinningProduct: true });
    expect(g.stage).toBe(2);
  });
});

describe("monthsBetween", () => {
  it("returns 0 for future dates", () => {
    expect(monthsBetween(new Date("2030-01-01"), new Date("2024-01-01"))).toBe(0);
  });

  it("counts whole months", () => {
    expect(monthsBetween(new Date("2024-01-01"), new Date("2024-04-01"))).toBe(3);
  });
});
