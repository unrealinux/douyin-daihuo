import { prisma } from "@/lib/db";
import { normalizePerformanceInput, type PerformanceInput } from "@/lib/performanceUtils";

const KEYS = ["views", "likes", "comments", "shares", "favorites", "orderCount", "gmv", "commission"] as const;

/** 为指定排期新增或更新效果数据（1:1）。只更新显式传入的指标，未传字段保持不变。 */
export async function upsertPerformance(scheduleId: number, input: PerformanceInput) {
  const values = normalizePerformanceInput(input);
  const patch = Object.fromEntries(
    KEYS.filter((k) => input[k] !== undefined && input[k] !== null).map((k) => [k, values[k]])
  );
  return prisma.performance.upsert({
    where: { scheduleId },
    create: { scheduleId, ...values },
    update: patch,
  });
}

/** 列出全部效果记录，含排期/素材/商品信息。 */
export async function listPerformance() {
  return prisma.performance.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      schedule: {
        include: {
          asset: { include: { product: { select: { id: true, name: true } } } },
        },
      },
    },
  });
}

export interface PerformanceSummary {
  count: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  orderCount: number;
  gmv: number;
  commission: number;
}

/** 全量聚合效果指标，供仪表盘展示。 */
export async function getPerformanceSummary(): Promise<PerformanceSummary> {
  const agg = await prisma.performance.aggregate({
    _count: { _all: true },
    _sum: {
      views: true,
      likes: true,
      comments: true,
      shares: true,
      favorites: true,
      orderCount: true,
      gmv: true,
      commission: true,
    },
  });
  return {
    count: agg._count._all,
    views: agg._sum.views ?? 0,
    likes: agg._sum.likes ?? 0,
    comments: agg._sum.comments ?? 0,
    shares: agg._sum.shares ?? 0,
    favorites: agg._sum.favorites ?? 0,
    orderCount: agg._sum.orderCount ?? 0,
    gmv: agg._sum.gmv ?? 0,
    commission: agg._sum.commission ?? 0,
  };
}
