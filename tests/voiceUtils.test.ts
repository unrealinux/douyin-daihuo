import { describe, it, expect } from "vitest";
import { findPolyphones, suggestBreathMarks, toTtsText } from "@/lib/voiceUtils";

describe("toTtsText", () => {
  it("replaces polyphones with homophones", () => {
    expect(toTtsText("他要削藩")).toBe("他要靴藩");
    expect(toTtsText("单于与龟兹")).toBe("善于与秋慈");
  });

  it("leaves other text unchanged", () => {
    expect(toTtsText("康熙八岁登基")).toBe("康熙八岁登基");
  });
});

describe("findPolyphones", () => {
  it("lists matched entries", () => {
    const hits = findPolyphones("冒顿单于");
    expect(hits.map((h) => h.from).sort()).toEqual(["冒顿", "单于"].sort());
  });

  it("returns empty when none match", () => {
    expect(findPolyphones("普通文案")).toEqual([]);
  });
});

describe("suggestBreathMarks", () => {
  it("inserts a pause for long sentences", () => {
    const out = suggestBreathMarks("这是一个非常长的句子，长到需要停顿一下再继续说完才好。");
    expect(out).toContain("……");
  });

  it("keeps short sentences untouched", () => {
    expect(suggestBreathMarks("他八岁登基。")).toBe("他八岁登基。");
  });
});
