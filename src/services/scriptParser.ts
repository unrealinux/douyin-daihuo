import { normalizeShots, type Shot } from "@/lib/shotUtils";

export interface GeneratedScript {
  title: string;
  hook: string;
  body: string;
  shotScript: string;
  shots: Shot[];
  coverPrompt: string;
  commentScript: string;
  hashtags: string[];
  durationSec: number;
}

export function parseHashtagsJson(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw.split(/\s+/).filter(Boolean);
  }
}

export function formatScriptPlaintext(s: {
  title?: string | null;
  hook?: string | null;
  body: string;
  shotScript?: string | null;
  hashtags?: string | null;
}): string {
  const tags = parseHashtagsJson(s.hashtags);
  const parts = [
    s.title ? `标题：${s.title}` : null,
    s.hook ? `黄金3秒钩子：${s.hook}` : null,
    `口播正文：\n${s.body}`,
    s.shotScript ? `分镜脚本：\n${s.shotScript}` : null,
    tags.length ? `标签：${tags.join(" ")}` : null,
  ];
  return parts.filter(Boolean).join("\n\n");
}

export function parseScriptJson(raw: string): GeneratedScript {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("no json in llm output");
    obj = JSON.parse(cleaned.slice(start, end + 1));
  }
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : d;
  };
  return {
    title: str(obj.title),
    hook: str(obj.hook),
    body: str(obj.body),
    shotScript: typeof obj.shotScript === "string" ? obj.shotScript : JSON.stringify(obj.shotScript ?? ""),
    shots: normalizeShots(obj.shots),
    coverPrompt: str(obj.coverPrompt),
    commentScript: str(obj.commentScript) || str(obj.comment) || str(obj.commentScripts),
    hashtags: Array.isArray(obj.hashtags) ? obj.hashtags.map(String) : [],
    durationSec: num(obj.durationSec, 30),
  };
}
