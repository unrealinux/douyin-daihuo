import { describe, it, expect } from "vitest";
import {
  checkScriptCompliance,
  findBookMentions,
  findExtremeWords,
  findInternalLeaks,
} from "@/lib/complianceCheck";

describe("findBookMentions", () => {
  it("detects book imagery words", () => {
    expect(findBookMentions("堆叠的古旧线装书")).toContain("线装书");
    expect(findBookMentions("书架上摆满书籍")).toEqual(expect.arrayContaining(["书架", "书籍"]));
  });

  it("detects book titles in brackets", () => {
    expect(findBookMentions("老人手拿一本《资治通鉴》")).toContain("《资治通鉴》");
  });

  it("ignores negated mentions", () => {
    expect(findBookMentions("禁止出现书籍")).toEqual([]);
    expect(findBookMentions("画面不要出现书本")).toEqual([]);
  });
});

describe("findInternalLeaks", () => {
  it("flags commission and unit price terms", () => {
    expect(findInternalLeaks("佣金40%，适合懂行的人")).toContain("佣金");
    expect(findInternalLeaks("客单价128元转化率高")).toEqual(expect.arrayContaining(["客单价", "转化率"]));
  });

  it("passes clean copy", () => {
    expect(findInternalLeaks("这本书讲透了大清兴衰")).toEqual([]);
  });
});

describe("findExtremeWords", () => {
  it("flags ad-law extreme words", () => {
    expect(findExtremeWords("史上最好的历史书")).toContain("最好");
    expect(findExtremeWords("百分百有效")).toEqual([]);
  });
});

describe("checkScriptCompliance", () => {
  it("is ok for clean output", () => {
    const r = checkScriptCompliance({
      title: "康熙王朝",
      hook: "他八岁登基",
      body: "康熙八岁登基，十四岁亲政，一生擒鳌拜、平三藩、收台湾。",
      shots: JSON.stringify([{ scene: "深宫夜读，烛影摇红" }]),
      coverPrompt: "3:4 封面，少年天子剪影，暖金色调",
    });
    expect(r.ok).toBe(true);
    expect(r.redlineCount).toBe(0);
  });

  it("flags book imagery as a red line", () => {
    const r = checkScriptCompliance({
      body: "正文",
      shots: JSON.stringify([{ scene: "老人手拿一本《资治通鉴》" }]),
      coverPrompt: "堆叠的古旧线装书",
    });
    expect(r.ok).toBe(false);
    expect(r.redlineCount).toBeGreaterThanOrEqual(2);
    expect(r.issues.some((i) => i.rule === "禁画书封")).toBe(true);
  });

  it("flags internal leaks in body as a red line", () => {
    const r = checkScriptCompliance({ body: "佣金40%，点下方链接购买" });
    expect(r.ok).toBe(false);
    expect(r.issues.find((i) => i.rule === "内部信息泄漏")?.evidence).toContain("佣金");
  });

  it("adds warnings for extreme words and fact checking", () => {
    const r = checkScriptCompliance({
      title: "史上最好的历史书",
      body: "这是清朝最强的皇帝",
      coverPrompt: "山水意境",
    });
    expect(r.redlineCount).toBe(0);
    expect(r.warnCount).toBeGreaterThanOrEqual(2);
    expect(r.issues.map((i) => i.rule)).toEqual(expect.arrayContaining(["广告法极限词", "史实校验"]));
  });
});
