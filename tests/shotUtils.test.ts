import { describe, it, expect } from "vitest";
import { normalizeShots, parseShotsJson, shotsToPromptLines, splitToSegments } from "@/lib/shotUtils";

describe("normalizeShots", () => {
  it("accepts plain string arrays", () => {
    const shots = normalizeShots(["深宫夜读", "金戈铁马"]);
    expect(shots).toHaveLength(2);
    expect(shots[0]).toEqual({ index: 1, scene: "深宫夜读" });
  });

  it("accepts object arrays with alias fields", () => {
    const shots = normalizeShots([
      { prompt: "烛影摇红", camera: "推近", durationSec: 5.4, narration: "他彻夜未眠" },
    ]);
    expect(shots[0].scene).toBe("烛影摇红");
    expect(shots[0].camera).toBe("推近");
    expect(shots[0].durationSec).toBe(5);
    expect(shots[0].size).toBe("9:16");
    expect(shots[0].narration).toBe("他彻夜未眠");
  });

  it("drops entries without a scene", () => {
    expect(normalizeShots([{ camera: "摇" }, "", null, 3])).toHaveLength(0);
  });

  it("returns empty for non-arrays", () => {
    expect(normalizeShots(undefined)).toEqual([]);
    expect(normalizeShots("x")).toEqual([]);
  });
});

describe("parseShotsJson", () => {
  it("parses stored json", () => {
    expect(parseShotsJson(JSON.stringify(["A", "B"]))).toHaveLength(2);
  });

  it("returns empty on invalid json", () => {
    expect(parseShotsJson("{oops")).toEqual([]);
    expect(parseShotsJson(null)).toEqual([]);
  });
});

describe("shotsToPromptLines", () => {
  it("zero-pads index and includes meta", () => {
    const lines = shotsToPromptLines([
      { index: 1, scene: "深宫", camera: "推近", durationSec: 5, size: "9:16" },
    ]);
    expect(lines).toBe("【01】深宫（9:16 · 推近 · 5s）");
  });
});

describe("splitToSegments", () => {
  it("groups sentences into requested segments", () => {
    const segs = splitToSegments("一。二。三。四。", 2);
    expect(segs).toEqual(["一。二。", "三。四。"]);
  });

  it("returns empty for empty body", () => {
    expect(splitToSegments("", 3)).toEqual([]);
  });
});
