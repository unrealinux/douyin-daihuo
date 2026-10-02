import { describe, it, expect } from "vitest";
import { aggregateSamples, sortAggregateRows, summarizeAggregates } from "@/lib/insightsUtils";

describe("aggregateSamples", () => {
  it("groups and sums metrics", () => {
    const rows = aggregateSamples([
      { group: "图书", views: 1000, orderCount: 10, gmv: 500, completionRate: 20, threeSecRate: 40 },
      { group: "图书", views: 3000, orderCount: 20, gmv: 1500, completionRate: 30 },
      { group: "女装", views: 2000, orderCount: 5, gmv: 200 },
    ]);
    const book = rows.find((r) => r.group === "图书")!;
    expect(book.posts).toBe(2);
    expect(book.views).toBe(4000);
    expect(book.orderCount).toBe(30);
    expect(book.gmv).toBe(2000);
    expect(book.avgViews).toBe(2000);
    expect(book.avgCompletionRate).toBe(25);
    expect(book.avgThreeSecRate).toBe(40);
    expect(book.gmvPerPost).toBe(1000);
    expect(book.conversionRate).toBeCloseTo(0.75, 2);
  });

  it("ignores null rates when averaging", () => {
    const rows = aggregateSamples([
      { group: "a", completionRate: null },
      { group: "a", completionRate: 30 },
    ]);
    expect(rows[0].avgCompletionRate).toBe(30);
  });

  it("returns null rates when never measured", () => {
    const rows = aggregateSamples([{ group: "a", views: 100 }]);
    expect(rows[0].avgCompletionRate).toBeNull();
    expect(rows[0].avgThreeSecRate).toBeNull();
    expect(rows[0].conversionRate).toBe(0);
  });

  it("handles empty input", () => {
    expect(aggregateSamples([])).toEqual([]);
  });
});

describe("sortAggregateRows", () => {
  const rows = [
    { group: "a", label: "a", posts: 1, views: 100, likes: 0, favorites: 0, shares: 0, comments: 0, orderCount: 1, gmv: 900, commission: 10, avgViews: 100, avgCompletionRate: null, avgThreeSecRate: null, conversionRate: 1, gmvPerPost: 900 },
    { group: "b", label: "b", posts: 5, views: 5000, likes: 0, favorites: 0, shares: 0, comments: 0, orderCount: 50, gmv: 100, commission: 99, avgViews: 1000, avgCompletionRate: null, avgThreeSecRate: null, conversionRate: 1, gmvPerPost: 20 },
  ];

  it("sorts by gmv by default", () => {
    expect(sortAggregateRows(rows)[0].group).toBe("a");
  });

  it("sorts by views", () => {
    expect(sortAggregateRows(rows, "views")[0].group).toBe("b");
  });

  it("sorts by commission", () => {
    expect(sortAggregateRows(rows, "commission")[0].group).toBe("b");
  });
});

describe("summarizeAggregates", () => {
  it("returns null for empty rows", () => {
    expect(summarizeAggregates([])).toBeNull();
  });

  it("totals posts, views, orders and gmv", () => {
    const rows = aggregateSamples([
      { group: "a", views: 100, orderCount: 1, gmv: 100 },
      { group: "b", views: 200, orderCount: 2, gmv: 200 },
    ]);
    const s = summarizeAggregates(rows)!;
    expect(s.posts).toBe(2);
    expect(s.views).toBe(300);
    expect(s.orderCount).toBe(3);
    expect(s.gmv).toBe(300);
    expect(s.avgViews).toBe(150);
  });
});
