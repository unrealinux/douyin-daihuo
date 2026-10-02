/** 配音气口辅助：SOP 要求给机器音注入真人呼吸感，并规避生僻字读错。 */

export interface BreathCue {
  mark: string;
  effect: string;
}

export const BREATH_CUES: BreathCue[] = [
  { mark: "——", effect: "尾音拖长 1.5 倍，接大转折，悬念感拉满" },
  { mark: "……", effect: "停顿 0.8 秒、音量下沉 20%，制造沧桑叹息感" },
  { mark: "同音转译", effect: "生僻字 / 多音字替换为现代同音字，规避读错被嘲" },
];

/** 历史/国学高频多音字、生僻字 → TTS 同音字。 */
export const POLYPHONE_MAP: Record<string, string> = {
  削藩: "靴藩",
  单于: "善于",
  龟兹: "秋慈",
  冒顿: "墨毒",
  会稽: "快计",
  阿房宫: "婀旁宫",
  大宛: "大渊",
  月氏: "肉支",
  吐蕃: "土波",
  女娲: "女蛙",
  帝喾: "帝酷",
  皋陶: "高姚",
  郦食其: "丽义基",
  金日磾: "金密低",
  万俟卨: "莫齐谢",
};

/** 找出文本中命中的多音字/生僻字，供 UI 提示。 */
export function findPolyphones(text: string): Array<{ from: string; to: string }> {
  const hits: Array<{ from: string; to: string }> = [];
  for (const [from, to] of Object.entries(POLYPHONE_MAP)) {
    if (text.includes(from)) hits.push({ from, to });
  }
  return hits;
}

/** 生成给 TTS/剪映朗读用的文本：替换生僻字为同音字，其余保持原样。 */
export function toTtsText(text: string): string {
  let out = text ?? "";
  for (const [from, to] of Object.entries(POLYPHONE_MAP)) {
    out = out.split(from).join(to);
  }
  return out;
}

/**
 * 给口播稿补气口提示：过长的句子在首个逗号处插入省略号停顿。
 * 仅用于配音参考，不修改原文展示。
 */
export function suggestBreathMarks(text: string, maxLen = 24): string {
  return (text || "")
    .split(/(?<=[。！？!?])/)
    .map((sentence) => {
      const s = sentence.trim();
      if (!s) return "";
      if (s.length <= maxLen) return s;
      const idx = s.indexOf("，");
      if (idx <= 0 || idx >= s.length - 1) return s;
      return `${s.slice(0, idx + 1)}……${s.slice(idx + 1)}`;
    })
    .filter(Boolean)
    .join("");
}
