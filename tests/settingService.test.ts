import { describe, it, expect } from "vitest";
import { parseLlmConfig, parseCrawlerConfig, DEFAULT_LLM, DEFAULT_CRAWLER } from "@/services/settingService";

describe("settingService", () => {
  it("parseLlmConfig returns defaults when raw is null", () => {
    expect(parseLlmConfig(null)).toEqual(DEFAULT_LLM);
  });

  it("parseLlmConfig merges partial json over defaults", () => {
    const cfg = parseLlmConfig(JSON.stringify({ model: "deepseek-chat" }));
    expect(cfg.model).toBe("deepseek-chat");
    expect(cfg.temperature).toBe(DEFAULT_LLM.temperature);
  });

  it("parseLlmConfig falls back on bad json", () => {
    expect(parseLlmConfig("not-json")).toEqual(DEFAULT_LLM);
  });

  it("parseCrawlerConfig returns defaults when raw is null", () => {
    expect(parseCrawlerConfig(null)).toEqual(DEFAULT_CRAWLER);
  });

  it("parseCrawlerConfig parses proxyUrl", () => {
    const cfg = parseCrawlerConfig(JSON.stringify({ proxyUrl: "http://127.0.0.1:7890" }));
    expect(cfg.proxyUrl).toBe("http://127.0.0.1:7890");
  });
});
