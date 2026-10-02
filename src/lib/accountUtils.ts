import { aggregateSamples, type PerfSample } from "./insightsUtils";

export const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "运营中",
  PAUSED: "已暂停",
  DEAD: "已弃用",
};

export interface AccountPerf {
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

export interface AccountScheduleLike {
  publishStatus: string;
  performance?: AccountPerf | null;
}

export interface AccountStats {
  total: number;
  published: number;
  /** 已回填效果的内容数 */
  measured: number;
  views: number;
  orderCount: number;
  gmv: number;
  commission: number;
  avgViews: number;
  avgCompletionRate: number | null;
  avgThreeSecRate: number | null;
  conversionRate: number | null;
  gmvPerPost: number;
}

/** 单个账号的矩阵表现：排期数 / 已发布 / 已测效果与核心指标。 */
export function computeAccountStats(schedules: AccountScheduleLike[]): AccountStats {
  const total = schedules.length;
  const published = schedules.filter((s) => s.publishStatus === "PUBLISHED").length;
  const samples: PerfSample[] = schedules
    .filter((s) => s.performance)
    .map((s) => {
      const p = s.performance as AccountPerf;
      return {
        group: "account",
        views: p.views,
        likes: p.likes,
        favorites: p.favorites,
        shares: p.shares,
        comments: p.comments,
        orderCount: p.orderCount,
        gmv: p.gmv,
        commission: p.commission,
        completionRate: p.completionRate,
        threeSecRate: p.threeSecRate,
      };
    });

  const [agg] = aggregateSamples(samples.length ? samples : [{ group: "account" }]);
  return {
    total,
    published,
    measured: samples.length,
    views: agg?.views ?? 0,
    orderCount: agg?.orderCount ?? 0,
    gmv: agg?.gmv ?? 0,
    commission: agg?.commission ?? 0,
    avgViews: samples.length ? agg?.avgViews ?? 0 : 0,
    avgCompletionRate: samples.length ? agg?.avgCompletionRate ?? null : null,
    avgThreeSecRate: samples.length ? agg?.avgThreeSecRate ?? null : null,
    conversionRate: samples.length ? agg?.conversionRate ?? null : null,
    gmvPerPost: samples.length ? agg?.gmvPerPost ?? 0 : 0,
  };
}
