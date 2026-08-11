import { describe, it, expect } from "vitest";
import { parseScriptJson } from "@/services/scriptParser";

describe("scriptParser", () => {
  it("parses valid json", () => {
    const raw = JSON.stringify({
      title: "标题", hook: "3秒钩子", body: "正文", shotScript: "分镜",
      hashtags: ["#tag1", "#tag2"], durationSec: 45,
    });
    const s = parseScriptJson(raw);
    expect(s.title).toBe("标题");
    expect(s.hashtags).toEqual(["#tag1", "#tag2"]);
    expect(s.durationSec).toBe(45);
  });

  it("strips code fences", () => {
    const s = parseScriptJson("```json\n{\"title\":\"t\",\"body\":\"b\"}\n```");
    expect(s.title).toBe("t");
  });

  it("extracts json from markdown text", () => {
    const s = parseScriptJson("以下是结果：\n{\"title\":\"t\",\"body\":\"b\"}\n完");
    expect(s.title).toBe("t");
  });

  it("defaults missing fields", () => {
    const s = parseScriptJson("{\"body\":\"only body\"}");
    expect(s.title).toBe("");
    expect(s.hashtags).toEqual([]);
    expect(s.durationSec).toBe(30);
  });

  it("throws on no json", () => {
    expect(() => parseScriptJson("nothing here")).toThrow();
  });
});
