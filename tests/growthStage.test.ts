import { describe, it, expect } from "vitest";
import {
  evaluateGrowthStage,
  monthsBetween,
  detectWinningProduct,
  WINNING_PRODUCT_ORDERS,
} from "@/lib/growthStage";

describe("evaluateGrowthStage", () => {
  const base = { trackCount: 1, accountCount: 1 };

  it("stage 1 with no publications", () => {
    const g = evaluateGrowthStage({ ...base, totalOrders: 0, publishedCount: 0, monthsActive: 0 });
    expect(g.stage).toBe(1);
    expect(g.progress).toBe(0);
    expect(g.next).toContain("第一条");
  });

  it("stage 1 while ramping to 50 orders", () => {
    const g = evaluateGrowthStage({ ...base, totalOrders: 20, publishedCount: 15, monthsActive: 1 });
    expect(g.stage).toBe(1);
    expect(g.progress).toBe(40);
  });

  it("stage 2 after 50 orders", () => {
    const g = evaluateGrowthStage({ ...base, totalOrders: 60, publishedCount: 30, monthsActive: 2 });
    expect(g.stage).toBe(2);
  });

  it("stage 2 starts at 50% and rises with time", () => {
    const entry = evaluateGrowthStage({ ...base, totalOrders: 60, publishedCount: 30, monthsActive: 0 });
    const later = evaluateGrowthStage({ ...base, totalOrders: 60, publishedCount: 30, monthsActive: 1.5 });
    expect(entry.progress).toBe(50);
    expect(later.progress).toBe(75);
  });

  it("stage 3 after 3 months", () => {
    const g = evaluateGrowthStage({ ...base, totalOrders: 200, publishedCount: 60, monthsActive: 3.5 });
    expect(g.stage).toBe(3);
    expect(g.goal).toContain("潜力新品");
  });

  it("stage 4 when 6 months are done and a second track exists", () => {
    const g = evaluateGrowthStage({ ...base, trackCount: 4, totalOrders: 900, publishedCount: 200, monthsActive: 7 });
    expect(g.stage).toBe(4);
    expect(g.progress).toBe(100);
  });

  it("stage 4 also unlocks from a second account", () => {
    const g = evaluateGrowthStage({ ...base, accountCount: 2, totalOrders: 900, publishedCount: 200, monthsActive: 7 });
    expect(g.stage).toBe(4);
  });

  it("stays on stage 3 after 6 months with a single track and account", () => {
    const g = evaluateGrowthStage({ ...base, totalOrders: 900, publishedCount: 200, monthsActive: 7 });
    expect(g.stage).toBe(3);
    expect(g.next).toContain("第 2 个赛道");
  });

  it("promotes to stage 2 when a winning product exists", () => {
    const g = evaluateGrowthStage({ ...base, totalOrders: 10, publishedCount: 12, monthsActive: 2, hasWinningProduct: true });
    expect(g.stage).toBe(2);
  });
});

describe("detectWinningProduct", () => {
  it("is false with no samples", () => {
    expect(detectWinningProduct([])).toBe(false);
  });

  it("sums one product across several schedules", () => {
    expect(
      detectWinningProduct([
        { productId: 1, orderCount: 30 },
        { productId: 1, orderCount: 25 },
      ])
    ).toBe(true);
  });

  it("does not count orders spread across different products", () => {
    expect(
      detectWinningProduct([
        { productId: 1, orderCount: 40 },
        { productId: 2, orderCount: 20 },
      ])
    ).toBe(false);
  });

  it("treats the threshold as inclusive", () => {
    expect(detectWinningProduct([{ productId: 1, orderCount: WINNING_PRODUCT_ORDERS }])).toBe(true);
    expect(detectWinningProduct([{ productId: 1, orderCount: WINNING_PRODUCT_ORDERS - 1 }])).toBe(false);
  });

  it("ignores schedules with no linked product", () => {
    expect(
      detectWinningProduct([
        { productId: null, orderCount: 500 },
        { productId: 2, orderCount: 10 },
      ])
    ).toBe(false);
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
