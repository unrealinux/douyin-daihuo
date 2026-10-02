import { describe, it, expect } from "vitest";
import { evaluateProduct, unitCommission } from "@/lib/selectionUtils";

describe("unitCommission", () => {
  it("computes price * rate", () => {
    expect(unitCommission(128, 40)).toBe(51.2);
  });

  it("returns null when data missing", () => {
    expect(unitCommission(null, 40)).toBeNull();
    expect(unitCommission(128, null)).toBeNull();
  });
});

describe("evaluateProduct (SOP 四大标准)", () => {
  it("gives A to an ideal book: 50-200 price, >=30% rate, high commission, sales up", () => {
    const r = evaluateProduct({ price: 128, commissionRate: 40, dailySales: 5000, trend: "UP" });
    expect(r.grade).toBe("A");
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.unitCommission).toBe(51.2);
    expect(r.warnings).toHaveLength(0);
  });

  it("warns on low price and low commission rate", () => {
    const r = evaluateProduct({ price: 19.9, commissionRate: 10, dailySales: 10, trend: "DOWN" });
    expect(r.grade).toBe("D");
    expect(r.warnings.join()).toContain("偏低");
    expect(r.warnings.join()).toContain("利润空间");
    expect(r.warnings.join()).toContain("趋势向下");
  });

  it("warns when price/rate missing", () => {
    const r = evaluateProduct({});
    expect(r.warnings.join()).toContain("未填客单价");
    expect(r.warnings.join()).toContain("未填佣金率");
  });

  it("caps score at 100", () => {
    const r = evaluateProduct({ price: 100, commissionRate: 50, dailySales: 99999, trend: "UP" });
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
