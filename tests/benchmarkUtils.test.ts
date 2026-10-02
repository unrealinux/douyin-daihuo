import { describe, it, expect } from "vitest";
import { heatScore, sortBenchmarks } from "@/lib/benchmarkUtils";

describe("heatScore", () => {
  it("weights shares and comments above likes", () => {
    expect(heatScore({ likes: 10 })).toBe(100);
    expect(heatScore({ shares: 10 })).toBe(200);
    expect(heatScore({ comments: 10 })).toBe(150);
  });

  it("handles missing values as 0", () => {
    expect(heatScore({})).toBe(0);
    expect(heatScore({ views: null, likes: null })).toBe(0);
  });
});

describe("sortBenchmarks", () => {
  const items = [
    { id: 1, likes: 5, createdAt: new Date("2024-01-01") },
    { id: 2, likes: 100, createdAt: new Date("2026-01-01") },
    { id: 3, likes: 50, createdAt: new Date("2025-01-01") },
  ];

  it("sorts by recency by default", () => {
    expect(sortBenchmarks(items).map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("sorts by heat when requested", () => {
    expect(sortBenchmarks(items, "hot").map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("does not mutate input", () => {
    const before = items.map((i) => i.id);
    sortBenchmarks(items, "hot");
    expect(items.map((i) => i.id)).toEqual(before);
  });
});
