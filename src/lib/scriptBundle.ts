import { parseHashtagsJson } from "@/services/scriptParser";
import { parseShotsJson, shotsToPromptLines, splitToSegments, type Shot } from "./shotUtils";

/**
 * SOP 标准化素材包：按官方文件清单产出 5 个文件，便于直接交给生图/配音/剪辑。
 * 新文案.txt / 分段内容.txt / 分镜提示词.txt / 封面提示词.txt / 发布信息.md
 */

export interface ScriptBundleSource {
  id: number;
  title?: string | null;
  hook?: string | null;
  body: string;
  shotScript?: string | null;
  shots?: string | null;
  coverPrompt?: string | null;
  commentScript?: string | null;
  hashtags?: string | null;
  durationSec?: number | null;
  product?: { name: string } | null;
  benchmark?: { title: string; track?: string | null; url?: string | null } | null;
}

export interface BundleFile {
  name: string;
  content: string;
}

/** 缺省封面提示词（3:4），只画意境，绝不出现书本封面。 */
export function defaultCoverPrompt(s: ScriptBundleSource): string {
  const subject = s.product?.name ?? s.title ?? "主题";
  return [
    `竖版 3:4 封面，主题：${subject}`,
    "构图留出上方标题安全区，光影强烈、情绪浓烈",
    "中国风水墨 / 电影写实质感，高对比，画面干净",
    "禁止出现任何书籍、书封、文字水印",
  ].join("；");
}

export function buildScriptBundle(s: ScriptBundleSource): BundleFile[] {
  const shots: Shot[] = parseShotsJson(s.shots);
  const tags = parseHashtagsJson(s.hashtags);
  const segments = shots.some((sh) => sh.narration)
    ? shots.map((sh) => sh.narration as string)
    : splitToSegments(s.body, 5);

  const shotPrompts = shots.length
    ? shotsToPromptLines(shots)
    : s.shotScript?.trim() ||
      segments
        .map((seg, i) => `【${String(i + 1).padStart(2, "0")}】待补画面提示词（对应口播）：${seg}`)
        .join("\n");

  const publishInfo = [
    `# 发布信息${s.title ? `：${s.title}` : ""}`,
    "",
    "## 标题",
    s.title || "（待填）",
    "",
    "## 黄金 3 秒钩子",
    s.hook || "（待填）",
    "",
    "## 话题标签",
    tags.length ? tags.join(" ") : "（待填）",
    "",
    "## 评论区带货话术",
    s.commentScript?.trim() || "（待填）",
    "",
    "## 对标来源（仅作学习拆解，禁止搬运）",
    s.benchmark ? `- ${s.benchmark.title}${s.benchmark.track ? ` · ${s.benchmark.track}` : ""}${s.benchmark.url ? ` ${s.benchmark.url}` : ""}` : "- 未引用",
    "",
    "## 发布前风控自查",
    "- [ ] AI 画面未出现书本封面",
    "- [ ] 史实 / 人名已人工校对",
    "- [ ] 二创相似度 <10%，非搬运",
    "- [ ] 商品已挂车，承接路径通畅",
    "",
  ].join("\n");

  return [
    { name: "新文案.txt", content: s.body },
    { name: "分段内容.txt", content: segments.map((seg, i) => `【${String(i + 1).padStart(2, "0")}】${seg}`).join("\n\n") },
    { name: "分镜提示词.txt", content: shotPrompts },
    { name: "封面提示词.txt", content: s.coverPrompt?.trim() || defaultCoverPrompt(s) },
    { name: "发布信息.md", content: publishInfo },
  ];
}
