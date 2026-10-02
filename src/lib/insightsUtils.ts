/**
 * 效果聚合：把「已测内容」按赛道 / 平台 / 账号 / 商品 / 风格分组，
 * 输出可比指标（平均播放、完播率、3 秒播放率、转化率、GMV）。
 */

export interface PerfSample {
  group: string;
  label?: string;
  views?: number | null;
  likes?: number | null;
  favorites?: number | null;
  shares?: number | null;
  comments?: number | null;
  orderCount?: number | null;
  gmv?: number | null;
  commission?: number | null;
  completionRate?: number | null;
  threeSecRate?: number | null;
}

export interface AggregateRow {
  group: string;
  label: string;
  posts: number;
  views: number;
  likes: number;
  favorites: number;
  shares: number;
  comments: number;
  orderCount: number;
  gmv: number;
  commission: number;
  /** 平均播放量（内容生产能力） */
  avgViews: number;
  /** 平均完播率 %，仅统计已录入的记录 */
  avgCompletionRate: number | null;
  /** 平均 3 秒播放率 % */
  avgThreeSecRate: number | null;
  /** 转化率 % = 成交单 / 播放 */
  conversionRate: number | null;
  /** 单条内容平均 GMV */
  gmvPerPost: number;
}

const n = (v: number | null | undefined): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function aggregateSamples(samples: PerfSample[]): AggregateRow[] {
  const map = new Map<string, AggregateRow & { completionSum: number; completionCount: number; threeSecSum: number; threeSecCount: number }>();
  for (const s of samples) {
    const key = s.group || "未分类";
    const row =
      map.get(key) ??
      ({
        group: key,
        label: s.label ?? key,
        posts: 0,
        views: 0,
        likes: 0,
        favorites: 0,
        shares: 0,
        comments: 0,
        orderCount: 0,
        gmv: 0,
        commission: 0,
        avgViews: 0,
        avgCompletionRate: null,
        avgThreeSecRate: null,
        conversionRate: null,
        gmvPerPost: 0,
        completionSum: 0,
        completionCount: 0,
        threeSecSum: 0,
        threeSecCount: 0,
      } as AggregateRow & { completionSum: number; completionCount: number; threeSecSum: number; threeSecCount: number });

    row.posts += 1;
    row.views += n(s.views);
    row.likes += n(s.likes);
    row.favorites += n(s.favorites);
    row.shares += n(s.shares);
    row.comments += n(s.comments);
    row.orderCount += n(s.orderCount);
    row.gmv += n(s.gmv);
    row.commission += n(s.commission);
    if (typeof s.completionRate === "number" && Number.isFinite(s.completionRate)) {
      row.completionSum += s.completionRate;
      row.completionCount += 1;
    }
    if (typeof s.threeSecRate === "number" && Number.isFinite(s.threeSecRate)) {
      row.threeSecSum += s.threeSecRate;
      row.threeSecCount += 1;
    }
    map.set(key, row);
  }

  return [...map.values()].map((row) => ({
    group: row.group,
    label: row.label,
    posts: row.posts,
    views: row.views,
    likes: row.likes,
    favorites: row.favorites,
    shares: row.shares,
    comments: row.comments,
    orderCount: row.orderCount,
    gmv: row.gmv,
    commission: row.commission,
    avgViews: row.posts ? Math.round(row.views / row.posts) : 0,
    avgCompletionRate: row.completionCount
      ? Math.round((row.completionSum / row.completionCount) * 10) / 10
      : null,
    avgThreeSecRate: row.threeSecCount
      ? Math.round((row.threeSecSum / row.threeSecCount) * 10) / 10
      : null,
    conversionRate: row.views > 0 ? Math.round((row.orderCount / row.views) * 10000) / 100 : null,
    gmvPerPost: row.posts ? Math.round((row.gmv / row.posts) * 100) / 100 : 0,
  }));
}

export type InsightSort = "gmv" | "commission" | "views" | "conversion" | "posts";

export function sortAggregateRows(rows: AggregateRow[], by: InsightSort = "gmv"): AggregateRow[] {
  const value = (r: AggregateRow): number => {
    switch (by) {
      case "commission":
        return r.commission;
      case "views":
        return r.views;
      case "conversion":
        return r.conversionRate ?? -1;
      case "posts":
        return r.posts;
      case "gmv":
      default:
        return r.gmv;
    }
  };
  return [...rows].sort((a, b) => value(b) - value(a));
}

/** 汇总整体指标，用于洞察页头部。 */
export function summarizeAggregates(rows: AggregateRow[]): AggregateRow | null {
  if (rows.length === 0) return null;
  const total = rows.reduce(
    (acc, r) => {
      acc.posts += r.posts;
      acc.views += r.views;
      acc.likes += r.likes;
      acc.orderCount += r.orderCount;
      acc.gmv += r.gmv;
      acc.commission += r.commission;
      return acc;
    },
    { posts: 0, views: 0, likes: 0, orderCount: 0, gmv: 0, commission: 0 }
  );
  return {
    group: "ALL",
    label: "全部",
    ...total,
    favorites: 0,
    shares: 0,
    comments: 0,
    avgViews: total.posts ? Math.round(total.views / total.posts) : 0,
    avgCompletionRate: null,
    avgThreeSecRate: null,
    conversionRate: total.views > 0 ? Math.round((total.orderCount / total.views) * 10000) / 100 : null,
    gmvPerPost: total.posts ? Math.round((total.gmv / total.posts) * 100) / 100 : 0,
  };
}
