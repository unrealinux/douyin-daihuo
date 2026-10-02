/**
 * 二创查重辅助：用中文字符二元组 Jaccard 相似度估算改写稿与对标逐字稿的相似程度。
 * 这是内部风控参考值（非平台官方查重），SOP 要求：目标 <10%，底线 <30%。
 */

const PUNCT = /[\s，。！？、：；“”‘’（）《》【】…—\-·,.!?;:"'()<>[\]{}|/\\~`@#$%^&*+=_]/g;

export function normalizeText(text: string): string {
  return (text || "")
    .replace(/<[^>]+>/g, "")
    .replace(PUNCT, "")
    .toLowerCase();
}

/** 连续 2 个字符的集合（中文按字，英文按字符，足够鲁棒）。 */
export function charBigrams(text: string): Set<string> {
  const s = normalizeText(text);
  const grams = new Set<string>();
  if (s.length < 2) {
    if (s.length === 1) grams.add(s);
    return grams;
  }
  for (let i = 0; i < s.length - 1; i++) grams.add(s.slice(i, i + 2));
  return grams;
}

/** Jaccard 相似度，返回 0-1。任一文本为空返回 0。 */
export function similarityRatio(a: string, b: string): number {
  const ga = charBigrams(a);
  const gb = charBigrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  const union = ga.size + gb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export type SimilarityLevel = "safe" | "caution" | "risky";

/** 按 SOP 阈值分档：<10% 安全，<30% 需谨慎，≥30% 高风险。 */
export function similarityLevel(ratio: number): SimilarityLevel {
  if (ratio < 0.1) return "safe";
  if (ratio < 0.3) return "caution";
  return "risky";
}

/** 相似度百分比展示，保留 1 位小数。 */
export function similarityPercent(ratio: number): number {
  return Math.round(ratio * 1000) / 10;
}
