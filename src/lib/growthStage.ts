/**
 * 成长路线评估：把 SOP 的四阶段路线落成可计算进度。
 * 四阶段：跟爆款 → 深耕单品 → 批量测品 → 深耕品类。
 */

export interface GrowthInput {
  totalOrders: number;
  publishedCount: number;
  /** 从首次发布至今的月数（可为小数） */
  monthsActive: number;
  /** 已产生内容的赛道/品类数量 */
  categoryCount: number;
  /** 是否存在单品累计出单 ≥50 的爆品 */
  hasWinningProduct?: boolean;
}

export interface GrowthStageInfo {
  stage: 1 | 2 | 3 | 4;
  name: string;
  goal: string;
  period: string;
  actions: string[];
  next?: string;
  /** 当前阶段完成度 0-100 */
  progress: number;
}

const STAGES = {
  1: { name: "阶段 1 · 跟爆款", goal: "出第一单 / 破万播放", period: "约 1 个月" },
  2: { name: "阶段 2 · 深耕单品", goal: "形成可复制的单品内容模板", period: "约 3 个月" },
  3: { name: "阶段 3 · 批量测品", goal: "找到竞争小的潜力新品与增长点", period: "3–6 个月" },
  4: { name: "阶段 4 · 深耕品类", goal: "稳定的品类盈利模式 + 矩阵放大", period: "6 个月–1 年+" },
} as const;

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function evaluateGrowthStage(input: GrowthInput): GrowthStageInfo {
  const { totalOrders, publishedCount, monthsActive, hasWinningProduct } = input;

  if (publishedCount <= 0) {
    return {
      ...STAGES[1],
      stage: 1,
      actions: [
        "选 1 个赛道（图书优先视频号 / 女装优先抖音），锁定 10 个目标商品",
        "建立对标库，拆解 3–5 条爆款结构",
        "完整跑通「选参考 → 二创 → 成片 → 发布」并发出第一条",
      ],
      next: "发出第一条内容后开始记录数据",
      progress: 0,
    };
  }

  if (monthsActive >= 6) {
    return {
      ...STAGES[4],
      stage: 4,
      actions: [
        "从单品运营升级为细分品类运营（历史/国学/家庭教育等）",
        "结合寒暑假、开学季、节日、节气提前布局内容",
        "开展多商品、多模板、多账号矩阵测试",
        "研究直播承接，提升爆款后的转化率",
      ],
      next: "拓展新品类或新账号，复制已验证模型",
      progress: 100,
    };
  }

  if (monthsActive >= 3) {
    return {
      ...STAGES[3],
      stage: 3,
      actions: [
        "跨平台找已起量、但本平台竞争小的潜力新品",
        "同一周期批量测试多款商品 × 多套素材 × 多种文案风格",
        "数据好的加素材，数据差的及时止损",
      ],
      next: "沉淀出 3–5 个稳定出单品，进入深耕品类阶段",
      progress: clamp((monthsActive / 6) * 100),
    };
  }

  if (totalOrders >= 50 || hasWinningProduct) {
    return {
      ...STAGES[2],
      stage: 2,
      actions: [
        "锁定一款确定性爆品，围绕它深挖多角度二创",
        "拆解不同开场方式、核心卖点、痛点与内容结构",
        "不要一条没爆就换书，把一款爆品的流量吃透",
      ],
      next: "形成标准化单品模板后，开始批量测品",
      progress: clamp((monthsActive / 3) * 100),
    };
  }

  return {
    ...STAGES[1],
    stage: 1,
    actions: [
      "跟进已验证的爆款内容，1:1 借鉴结构与节奏",
      "用对标库沉淀选题，二创相似度控制在 10% 以下",
      "发布后按完播率 / 3 秒播放率 / 评论数据迭代",
    ],
    next: "累计 50 单后进入「深耕单品」阶段",
    progress: clamp((totalOrders / 50) * 100),
  };
}

export function monthsBetween(from: Date, to: Date = new Date()): number {
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return 0;
  return Math.round((ms / (30 * 24 * 3600 * 1000)) * 10) / 10;
}
