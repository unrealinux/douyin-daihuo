/** 发布前自检清单：来自 SOP 阶段⑤「发布与运营」+ 风控红线。 */

export interface ChecklistItem {
  key: string;
  label: string;
  /** 是否属于风控红线（未勾选不允许发布） */
  redline?: boolean;
}

export const PUBLISH_CHECKLIST: ChecklistItem[] = [
  { key: "visual", label: "画面清晰无穿帮、无水印、无低清" },
  { key: "subtitle", label: "字幕无错字，与配音同步" },
  { key: "voice", label: "配音无读错字、无念经感" },
  { key: "product", label: "商品已挂车 / 关联橱窗，承接路径通畅" },
  { key: "audioSync", label: "音画同步，无突然静音或爆音" },
  { key: "noBookCover", label: "AI 画面未出现书本封面", redline: true },
  { key: "facts", label: "史实 / 人名已人工校对", redline: true },
  { key: "similarity", label: "二创相似度 <10%，非搬运", redline: true },
];

export type ChecklistState = Record<string, boolean>;

/** 解析已存清单，并与默认清单对齐（新增项默认未勾选，未知项丢弃）。 */
export function parseChecklist(raw?: string | null): ChecklistState {
  let saved: Record<string, unknown> = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") saved = parsed as Record<string, unknown>;
    } catch {
      saved = {};
    }
  }
  const out: ChecklistState = {};
  for (const item of PUBLISH_CHECKLIST) out[item.key] = saved[item.key] === true;
  return out;
}

export function serializeChecklist(state: ChecklistState): string {
  const out: ChecklistState = {};
  for (const item of PUBLISH_CHECKLIST) out[item.key] = state[item.key] === true;
  return JSON.stringify(out);
}

export interface ChecklistProgress {
  done: number;
  total: number;
  ready: boolean;
  /** 未完成项名称 */
  missing: string[];
  /** 未完成的风控红线项 */
  redlineMissing: string[];
}

export function checklistProgress(state: ChecklistState): ChecklistProgress {
  const total = PUBLISH_CHECKLIST.length;
  const missing: string[] = [];
  const redlineMissing: string[] = [];
  let done = 0;
  for (const item of PUBLISH_CHECKLIST) {
    if (state[item.key]) {
      done++;
    } else {
      missing.push(item.label);
      if (item.redline) redlineMissing.push(item.label);
    }
  }
  return { done, total, ready: done === total, missing, redlineMissing };
}
