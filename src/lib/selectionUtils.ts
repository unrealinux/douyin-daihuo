import type { Platform } from "@prisma/client";

/**
 * 选品评分：把生财 SOP「图书赛道四大标准」落成可计算规则。
 * 四大标准：高佣金与高溢价(客单价 50-200) / 高信息密度强情绪 / 用户画像匹配 / 低竞争垂直化。
 * 其中「信息密度、画像、竞争度」无法从结构化字段判断，交由 track/notes 人工把握；
 * 这里量化可计算的部分：客单价、佣金率、单笔佣金、日销、趋势。
 */

export const PRICE_MIN = 50;
export const PRICE_MAX = 200;
export const RATE_GOOD = 30;
export const RATE_OK = 20;
export const COMMISSION_GOOD = 30;
export const COMMISSION_OK = 15;

export const TRACKS = ["图书", "女装", "短剧", "图文", "其他"] as const;
export type Track = (typeof TRACKS)[number];

export const PLATFORM_LABEL: Record<Platform, string> = {
  VIDEO_ACCOUNT: "视频号",
  DOUYIN: "抖音",
  XIAOHONGSHU: "小红书",
  KUAISHOU: "快手",
  OTHER: "其他",
};

/** SOP 建议：图书优先视频号，女装优先抖音，短剧优先视频号。 */
export const TRACK_PLATFORM_HINT: Record<string, Platform> = {
  图书: "VIDEO_ACCOUNT",
  女装: "DOUYIN",
  短剧: "VIDEO_ACCOUNT",
  图文: "DOUYIN",
};

export interface SelectionInput {
  price?: number | null;
  commissionRate?: number | null;
  dailySales?: number | null;
  trend?: "UP" | "STEADY" | "DOWN" | null;
}

export type SelectionGrade = "A" | "B" | "C" | "D";

export interface SelectionResult {
  score: number;
  grade: SelectionGrade;
  /** 单笔预估佣金（元）= 客单价 × 佣金率 */
  unitCommission: number | null;
  highlights: string[];
  warnings: string[];
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** 单笔预估佣金（元）。缺任一参数返回 null。 */
export function unitCommission(price?: number | null, rate?: number | null): number | null {
  if (!isNum(price) || !isNum(rate)) return null;
  return Math.round(price * (rate / 100) * 100) / 100;
}

function gradeOf(score: number): SelectionGrade {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

/** 按 SOP 四大标准量化打分，返回 0-100 分、评级与理由。 */
export function evaluateProduct(input: SelectionInput): SelectionResult {
  let score = 0;
  const highlights: string[] = [];
  const warnings: string[] = [];

  // 1. 客单价：50-200 元最佳（同样工作量，佣金绝对值更高）
  if (!isNum(input.price)) {
    warnings.push("未填客单价，无法判断溢价空间");
  } else if (input.price >= PRICE_MIN && input.price <= PRICE_MAX) {
    score += 30;
    highlights.push(`客单价 ${input.price} 元，处在 50–200 元高佣黄金区间`);
  } else if (input.price < PRICE_MIN) {
    score += 5;
    warnings.push(`客单价 ${input.price} 元偏低，单笔佣金绝对值受限`);
  } else {
    score += 15;
    warnings.push(`客单价 ${input.price} 元偏高，转化难度上升`);
  }

  // 2. 佣金率：选品中心建议 ≥30%
  if (!isNum(input.commissionRate)) {
    warnings.push("未填佣金率，无法判断利润空间");
  } else if (input.commissionRate >= RATE_GOOD) {
    score += 25;
    highlights.push(`佣金率 ${input.commissionRate}%，达到 30% 优秀线`);
  } else if (input.commissionRate >= RATE_OK) {
    score += 15;
    highlights.push(`佣金率 ${input.commissionRate}%，可用但略低于优秀线`);
  } else {
    warnings.push(`佣金率 ${input.commissionRate}% 低于 20%，利润空间不足`);
  }

  // 3. 单笔佣金：决定一条视频的产出上限
  const unit = unitCommission(input.price, input.commissionRate);
  if (unit !== null) {
    if (unit >= COMMISSION_GOOD) {
      score += 25;
      highlights.push(`单笔预估佣金 ${unit} 元，产出上限可观`);
    } else if (unit >= COMMISSION_OK) {
      score += 15;
    } else {
      warnings.push(`单笔预估佣金仅 ${unit} 元，需要靠量取胜`);
    }
  }

  // 4. 销量与趋势：市场验证 + 是否正在起量
  if (isNum(input.dailySales)) {
    if (input.dailySales >= 1000) {
      score += 10;
      highlights.push(`日销 ${input.dailySales}，已被市场验证`);
    } else if (input.dailySales >= 100) {
      score += 5;
    }
  }
  if (input.trend === "UP") {
    score += 10;
    highlights.push("趋势向上，正在起量");
  } else if (input.trend === "DOWN") {
    score -= 10;
    warnings.push("趋势向下，谨慎投入");
  }

  const clamped = Math.max(0, Math.min(100, score));
  return { score: clamped, grade: gradeOf(clamped), unitCommission: unit, highlights, warnings };
}
