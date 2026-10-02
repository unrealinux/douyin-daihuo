/** 结构化分镜：SOP 要求产出「9:16 分镜提示词」，便于批量生图与剪映组装。 */

export interface Shot {
  index: number;
  /** 画面描述 / 生图提示词（SOP 红线：只画意境，不得出现书本封面） */
  scene: string;
  camera?: string;
  durationSec?: number;
  /** 画幅，默认 9:16 */
  size?: string;
  /** 对应口播段落 */
  narration?: string;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function firstStr(source: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = str(source[k]);
    if (v) return v;
  }
  return "";
}

/** 容错解析 LLM 返回的 shots：支持字符串数组或对象数组，字段名可替换。 */
export function normalizeShots(raw: unknown): Shot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i): Shot | null => {
      if (typeof item === "string") {
        const scene = item.trim();
        return scene ? { index: i + 1, scene } : null;
      }
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const scene = firstStr(o, ["scene", "prompt", "imagePrompt", "shot", "description", "visual"]);
      if (!scene) return null;
      const idx = Number(o.index);
      const dur = Number(o.durationSec ?? o.duration);
      const size = firstStr(o, ["size", "aspectRatio", "ratio"]) || "9:16";
      return {
        index: Number.isFinite(idx) && idx > 0 ? Math.round(idx) : i + 1,
        scene,
        camera: firstStr(o, ["camera", "shotType", "movement"]) || undefined,
        durationSec: Number.isFinite(dur) && dur > 0 ? Math.round(dur) : undefined,
        size,
        narration: firstStr(o, ["narration", "voiceover", "line", "text"]) || undefined,
      };
    })
    .filter((s): s is Shot => s !== null);
}

export function parseShotsJson(raw?: string | null): Shot[] {
  if (!raw) return [];
  try {
    return normalizeShots(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** 生成「分镜提示词.txt」内容。 */
export function shotsToPromptLines(shots: Shot[]): string {
  return shots
    .map((s) => {
      const meta = [s.size, s.camera, s.durationSec ? `${s.durationSec}s` : ""].filter(Boolean).join(" · ");
      return `【${String(s.index).padStart(2, "0")}】${s.scene}${meta ? `（${meta}）` : ""}`;
    })
    .join("\n");
}

/** 无结构化分镜时，把口播正文按句切分并归并成若干段，用于「分段内容.txt」。 */
export function splitToSegments(body: string, count = 5): string[] {
  const sentences = (body || "")
    .split(/(?<=[。！？!?])/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return [];
  const groups = Math.max(1, Math.min(count, sentences.length));
  const per = Math.ceil(sentences.length / groups);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += per) {
    out.push(sentences.slice(i, i + per).join(""));
  }
  return out;
}
