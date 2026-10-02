import { parseShotsJson } from "./shotUtils";

/**
 * 生成结果合规校验：把 SOP 的风控红线做成可自动检测的规则。
 * 纯函数，可在生成后即时提示，也可在脚本详情里重新计算。
 */

export type ComplianceLevel = "redline" | "warn";

export interface ComplianceIssue {
  rule: string;
  level: ComplianceLevel;
  field: string;
  message: string;
  evidence: string;
}

export interface ComplianceReport {
  ok: boolean;
  issues: ComplianceIssue[];
  redlineCount: number;
  warnCount: number;
}

export interface ComplianceInput {
  title?: string | null;
  hook?: string | null;
  body: string;
  shots?: string | null;
  coverPrompt?: string | null;
}

const NEGATION = /(禁止|不要|不得|严禁|无需|避免|没有|无|非|不出现|不画|不可)/;

/** 找出文本中对「书」的正面提及（排除"禁止出现书籍"这类否定表述）。 */
export function findBookMentions(text: string): string[] {
  if (!text) return [];
  const patterns = [/(书籍|书本|线装书|书封|书架|书页|图书|古籍|竹简|书)/g, /《[^》]{1,40}》/g];
  const hits: string[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 8), m.index);
      if (NEGATION.test(before)) continue;
      hits.push(m[0]);
    }
  }
  return hits;
}

const INTERNAL_TERMS = ["佣金", "客单价", "转化率", "利润率", "GMV", "gmv", "挂车", "选品", "投产比", "ROI"];

/** 口播正文里出现内部经营信息（佣金/客单价等）属于事故，观众不该听到。 */
export function findInternalLeaks(text: string): string[] {
  if (!text) return [];
  return INTERNAL_TERMS.filter((t) => text.includes(t));
}

const AD_EXTREME = ["最佳", "最好", "最强", "第一品牌", "绝对", "100%", "根治", "特效", "国家级", "顶级", "永久"];

export function findExtremeWords(text: string): string[] {
  if (!text) return [];
  return AD_EXTREME.filter((t) => text.includes(t));
}

const FACT_TERMS = ["历史", "皇帝", "朝代", "古代", "战争", "王朝", "革命", "元年", "年间", "史料"];

export function checkScriptCompliance(input: ComplianceInput): ComplianceReport {
  const issues: ComplianceIssue[] = [];
  const shots = parseShotsJson(input.shots);
  const shotText = shots.map((s) => s.scene).join("\n");

  // 红线 1：生图/封面画面不得出现书本
  for (const [field, text] of [
    ["分镜提示词", shotText],
    ["封面提示词", input.coverPrompt ?? ""],
  ] as const) {
    const hits = findBookMentions(text);
    if (hits.length) {
      issues.push({
        rule: "禁画书封",
        level: "redline",
        field,
        message: `${field}出现书籍画面（易判非真实图书展示/侵权下架），改为只画意境`,
        evidence: Array.from(new Set(hits)).join("、"),
      });
    }
  }

  // 红线 2：口播不得泄漏佣金等内部信息
  const leaks = findInternalLeaks(input.body);
  if (leaks.length) {
    issues.push({
      rule: "内部信息泄漏",
      level: "redline",
      field: "口播正文",
      message: "口播正文出现佣金/客单价等内部经营信息，观众不应听到",
      evidence: leaks.join("、"),
    });
  }

  // 提醒 3：广告法极限词
  const extremes = findExtremeWords(`${input.title ?? ""}${input.hook ?? ""}${input.body}`);
  if (extremes.length) {
    issues.push({
      rule: "广告法极限词",
      level: "warn",
      field: "标题/钩子/口播",
      message: "出现可能触发广告法风险的极限词，建议替换",
      evidence: extremes.join("、"),
    });
  }

  // 提醒 4：史实类内容需人工校验
  const factText = `${input.title ?? ""}${input.body}${shotText}`;
  if (FACT_TERMS.some((t) => factText.includes(t))) {
    issues.push({
      rule: "史实校验",
      level: "warn",
      field: "整体",
      message: "检测到历史/史实相关内容，发布前须人工核对人名与事件",
      evidence: FACT_TERMS.filter((t) => factText.includes(t)).slice(0, 3).join("、"),
    });
  }

  const redlineCount = issues.filter((i) => i.level === "redline").length;
  const warnCount = issues.filter((i) => i.level === "warn").length;
  return { ok: redlineCount === 0, issues, redlineCount, warnCount };
}
