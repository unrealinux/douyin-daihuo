import { describe, it, expect } from "vitest";
import { filterProducts } from "@/services/productService";

type Item = { name: string; category?: string | null; commissionRate?: number | null; dailySales?: number | null; status: string; updatedAt: Date };

const mk = (o: Partial<Item>): Item => ({
  name: o.name ?? "x",
  category: o.category ?? null,
  commissionRate: o.commissionRate ?? null,
  dailySales: o.dailySales ?? null,
  status: o.status ?? "CANDIDATE",
  updatedAt: o.updatedAt ?? new Date(0),
});

describe("filterProducts", () => {
  it("filters by status", () => {
    const items = [mk({ name: "a", status: "CANDIDATE" }), mk({ name: "b", status: "SELECTED" })];
    expect(filterProducts(items, { status: "SELECTED" })).toHaveLength(1);
  });

  it("filters by minRate", () => {
    const items = [mk({ name: "a", commissionRate: 10 }), mk({ name: "b", commissionRate: 50 })];
    const out = filterProducts(items, { minRate: 30 });
    expect(out.map((p) => p.name)).toEqual(["b"]);
  });

  it("sorts by commissionRate desc", () => {
    const items = [mk({ name: "a", commissionRate: 10 }), mk({ name: "b", commissionRate: 50 })];
    const out = filterProducts(items, { sort: "commissionRate" });
    expect(out.map((p) => p.name)).toEqual(["b", "a"]);
  });

  it("sorts by updatedAt desc", () => {
    const items = [
      mk({ name: "old", updatedAt: new Date("2024-01-01") }),
      mk({ name: "mid", updatedAt: new Date("2025-01-01") }),
      mk({ name: "new", updatedAt: new Date("2026-01-01") }),
    ];
    const out = filterProducts(items, { sort: "updatedAt" });
    expect(out.map((p) => p.name)).toEqual(["new", "mid", "old"]);
  });

  it("filters by keyword", () => {
    const items = [mk({ name: "Apple Watch" }), mk({ name: "香蕉" })];
    const out = filterProducts(items, { keyword: "apple" });
    expect(out.map((p) => p.name)).toEqual(["Apple Watch"]);
  });
});
