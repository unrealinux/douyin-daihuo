import { ScriptStyle } from "@prisma/client";
import { prisma } from "@/lib/db";
import { aggregateSamples, type AggregateRow, type PerfSample } from "@/lib/insightsUtils";
import { PLATFORM_LABEL } from "@/lib/selectionUtils";

export type InsightDimension = "track" | "platform" | "account" | "product" | "style";

export const INSIGHT_DIMENSIONS: Array<{ key: InsightDimension; label: string }> = [
  { key: "track", label: "赛道" },
  { key: "platform", label: "平台" },
  { key: "account", label: "账号" },
  { key: "product", label: "商品" },
  { key: "style", label: "风格" },
];

const STYLE_LABEL: Record<ScriptStyle, string> = {
  SPOKEN: "口播带货",
  REVIEW: "测评",
  STORY: "剧情",
  UNBOXING: "开箱",
};

type ScheduleWithRelations = {
  performance: {
    views: number;
    likes: number;
    favorites: number;
    shares: number;
    comments: number;
    orderCount: number;
    gmv: number;
    commission: number;
    completionRate: number | null;
    threeSecRate: number | null;
  } | null;
  account: { name: string; platform: string | null } | null;
  asset: {
    product: { name: string; track: string | null; platform: string | null } | null;
    script: { style: ScriptStyle } | null;
  } | null;
};

function groupOf(s: ScheduleWithRelations, dimension: InsightDimension): string {
  switch (dimension) {
    case "track":
      return s.asset?.product?.track || "未分类赛道";
    case "platform": {
      const p = s.account?.platform ?? s.asset?.product?.platform;
      return p ? PLATFORM_LABEL[p as keyof typeof PLATFORM_LABEL] ?? p : "未指定平台";
    }
    case "account":
      return s.account?.name || "未分配账号";
    case "product":
      return s.asset?.product?.name || "未关联商品";
    case "style":
      return s.asset?.script?.style ? STYLE_LABEL[s.asset.script.style] : "未指定风格";
    default:
      return "未分类";
  }
}

/** 按维度聚合已有回填效果的内容，默认按 GMV 倒序。 */
export async function getInsights(dimension: InsightDimension): Promise<AggregateRow[]> {
  const schedules = (await prisma.schedule.findMany({
    where: { performance: { isNot: null } },
    include: {
      performance: true,
      account: { select: { name: true, platform: true } },
      asset: {
        include: {
          product: { select: { name: true, track: true, platform: true } },
          script: { select: { style: true } },
        },
      },
    },
  })) as unknown as ScheduleWithRelations[];

  const samples: PerfSample[] = schedules.map((s) => {
    const p = s.performance!;
    return {
      group: groupOf(s, dimension),
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

  return aggregateSamples(samples).sort((a, b) => b.gmv - a.gmv || b.views - a.views);
}

export interface DimensionInsights {
  dimension: InsightDimension;
  rows: AggregateRow[];
}

export async function getInsightBundle(): Promise<DimensionInsights[]> {
  const dimensions: InsightDimension[] = ["track", "platform", "account", "product", "style"];
  const result: DimensionInsights[] = [];
  for (const dimension of dimensions) {
    result.push({ dimension, rows: await getInsights(dimension) });
  }
  return result;
}
