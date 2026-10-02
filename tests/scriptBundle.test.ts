import { describe, it, expect } from "vitest";
import { buildScriptBundle, defaultCoverPrompt } from "@/lib/scriptBundle";

const base = {
  id: 1,
  title: "康熙王朝",
  hook: "他八岁登基",
  body: "康熙八岁登基。十四岁亲政。一生擒鳌拜。平三藩。收台湾。",
  hashtags: JSON.stringify(["#历史", "#读书"]),
  durationSec: 60,
};

describe("buildScriptBundle", () => {
  it("produces the five SOP files", () => {
    const files = buildScriptBundle(base);
    expect(files.map((f) => f.name)).toEqual([
      "新文案.txt",
      "分段内容.txt",
      "分镜提示词.txt",
      "封面提示词.txt",
      "发布信息.md",
    ]);
  });

  it("uses structured shots for prompts when present", () => {
    const files = buildScriptBundle({
      ...base,
      shots: JSON.stringify([{ scene: "深宫夜读", camera: "推近", durationSec: 5 }]),
    });
    const prompts = files.find((f) => f.name === "分镜提示词.txt")!;
    expect(prompts.content).toContain("深宫夜读");
    const segments = files.find((f) => f.name === "分段内容.txt")!;
    expect(segments.content).toContain("【01】");
  });

  it("prefers shot narration for segments", () => {
    const files = buildScriptBundle({
      ...base,
      shots: JSON.stringify([{ scene: "a", narration: "他彻夜未眠" }]),
    });
    expect(files.find((f) => f.name === "分段内容.txt")!.content).toContain("他彻夜未眠");
  });

  it("falls back to shotScript then placeholder", () => {
    const withScript = buildScriptBundle({ ...base, shotScript: "镜头一：宫门" });
    expect(withScript.find((f) => f.name === "分镜提示词.txt")!.content).toContain("镜头一");

    const placeholder = buildScriptBundle(base).find((f) => f.name === "分镜提示词.txt")!;
    expect(placeholder.content).toContain("待补画面提示词");
  });

  it("includes red lines and benchmark in publish info", () => {
    const files = buildScriptBundle({
      ...base,
      benchmark: { title: "对标A", track: "图书", url: "https://x" },
    });
    const info = files.find((f) => f.name === "发布信息.md")!;
    expect(info.content).toContain("书本封面");
    expect(info.content).toContain("相似度 <10%");
    expect(info.content).toContain("对标A");
    expect(info.content).toContain("#历史");
  });

  it("uses provided cover prompt, otherwise a safe default", () => {
    expect(buildScriptBundle({ ...base, coverPrompt: "自定义封面" }).find((f) => f.name === "封面提示词.txt")!.content).toBe("自定义封面");
    expect(defaultCoverPrompt(base)).toContain("禁止出现任何书籍");
  });
});
