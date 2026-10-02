export interface PerformanceInput {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  favorites?: number;
  orderCount?: number;
  gmv?: number;
  commission?: number;
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
}

const clampNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const clampInt = (v: unknown): number => Math.round(clampNum(v));

/** 归一化前端提交的效果指标：非法/负数回退为 0，计数取整、金额保留数值。 */
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
  };
}
