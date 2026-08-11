export interface GeneratedScript {
  title: string;
  hook: string;
  body: string;
  shotScript: string;
  hashtags: string[];
  durationSec: number;
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
    hashtags: Array.isArray(obj.hashtags) ? obj.hashtags.map(String) : [],
    durationSec: num(obj.durationSec, 30),
  };
}
