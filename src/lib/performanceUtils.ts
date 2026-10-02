export interface PerformanceInput {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  favorites?: number;
  orderCount?: number;
  gmv?: number;
  commission?: number;
  /** 完播率（%），SOP 合格线 >20 */
  completionRate?: number;
  /** 3 秒播放率（%），SOP 合格线 >30 */
  threeSecRate?: number;
  /** 平均播放时长（秒） */
  avgWatchSec?: number;
}

export interface PerformanceValues {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  orderCount: number;
  gmv: number;
  commission: number;
  completionRate: number;
  threeSecRate: number;
  avgWatchSec: number;
}

/** 可持久化的指标字段，与 schema.prisma 的 Performance 模型保持一致。 */
export const PERFORMANCE_KEYS = [
  "views",
  "likes",
  "comments",
  "shares",
  "favorites",
  "orderCount",
  "gmv",
  "commission",
  "completionRate",
  "threeSecRate",
  "avgWatchSec",
] as const;

export type PerformanceKey = (typeof PERFORMANCE_KEYS)[number];

const clampNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const clampInt = (v: unknown): number => Math.round(clampNum(v));

/** 百分比类指标限制在 0-100。 */
const clampRate = (v: unknown): number => Math.min(100, clampNum(v));

/** 归一化前端提交的效果指标：非法/负数回退为 0，计数取整、比例限制 0-100。 */
export function normalizePerformanceInput(input: PerformanceInput): PerformanceValues {
  return {
    views: clampInt(input.views),
    likes: clampInt(input.likes),
    comments: clampInt(input.comments),
    shares: clampInt(input.shares),
    favorites: clampInt(input.favorites),
    orderCount: clampInt(input.orderCount),
    gmv: clampNum(input.gmv),
    commission: clampNum(input.commission),
    completionRate: clampRate(input.completionRate),
    threeSecRate: clampRate(input.threeSecRate),
    avgWatchSec: clampNum(input.avgWatchSec),
  };
}

export type DiagnosisLevel = "good" | "warn" | "unknown";

export interface Diagnosis {
  level: DiagnosisLevel;
  issues: string[];
  suggestions: string[];
}

export const COMPLETION_RATE_PASS = 20;
export const THREE_SEC_RATE_PASS = 30;
export const VIEWS_LOW = 200;

/**
 * 按 SOP「数据复盘」基线给出诊断：
 * 播放量 <200 考虑换号；完播率 <20 打磨文案；3 秒播放率 <30 强化钩子。
 */
export function diagnosePerformance(input: PerformanceInput): Diagnosis {
  const hasAny =
    input.views !== undefined ||
    input.completionRate !== undefined ||
    input.threeSecRate !== undefined ||
    input.avgWatchSec !== undefined;
  if (!hasAny) {
    return { level: "unknown", issues: [], suggestions: ["录入播放/完播率/3 秒播放率后自动生成复盘建议"] };
  }

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (input.views !== undefined && input.views < VIEWS_LOW) {
    issues.push(`播放量 ${input.views} 偏低（<${VIEWS_LOW}）`);
    suggestions.push("新号有 10–15 天保护期；长期低播放可考虑换号，号有天生残的");
  }
  if (input.completionRate !== undefined && input.completionRate < COMPLETION_RATE_PASS) {
    issues.push(`完播率 ${input.completionRate}% 未达 ${COMPLETION_RATE_PASS}% 合格线`);
    suggestions.push("继续打磨文案，图书带货文案是重中之重");
  }
  if (input.threeSecRate !== undefined && input.threeSecRate < THREE_SEC_RATE_PASS) {
    issues.push(`3 秒播放率 ${input.threeSecRate}% 未达 ${THREE_SEC_RATE_PASS}% 合格线`);
    suggestions.push("强化前 3 秒爆款钩子，多看对标爆款文案");
  }

  if (issues.length === 0) {
    return { level: "good", issues, suggestions: ["核心指标达标，可增加素材、放大投放"] };
  }
  return { level: "warn", issues, suggestions };
}
