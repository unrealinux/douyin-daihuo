import { describe, it, expect } from "vitest";
import { similarityLevel, similarityPercent, similarityRatio } from "@/lib/similarity";

describe("similarityRatio", () => {
  it("returns 1 for identical text", () => {
    expect(similarityRatio("康熙八岁登基", "康熙八岁登基")).toBeCloseTo(1, 5);
  });

  it("returns 0 for empty input", () => {
    expect(similarityRatio("", "康熙八岁登基")).toBe(0);
    expect(similarityRatio("康熙八岁登基", "")).toBe(0);
  });

  it("ignores punctuation and whitespace", () => {
    expect(similarityRatio("康熙，八岁登基！", "康熙八岁登基")).toBeCloseTo(1, 5);
  });

  it("scores a rewritten script much lower than a copy", () => {
    const source = "康熙八岁登基，十四岁亲政，一生擒鳌拜平三藩收台湾，是清朝在位最久的皇帝。";
    const copy = source;
    const rewrite = "一个少年天子，如何在权臣环伺中夺回皇权？他用了六十年，写下大清最长的帝王篇章。";
    expect(similarityRatio(copy, source)).toBeGreaterThan(0.9);
    expect(similarityRatio(rewrite, source)).toBeLessThan(0.1);
  });
});

describe("similarityLevel / similarityPercent", () => {
  it("classifies by SOP thresholds", () => {
    expect(similarityLevel(0.05)).toBe("safe");
    expect(similarityLevel(0.1)).toBe("caution");
    expect(similarityLevel(0.29)).toBe("caution");
    expect(similarityLevel(0.3)).toBe("risky");
  });

  it("formats percent with one decimal", () => {
    expect(similarityPercent(0.1234)).toBe(12.3);
  });
});
