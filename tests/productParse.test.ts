import { describe, it, expect } from "vitest";
import { Platform } from "@prisma/client";
import { inferPlatform, parsePriceText } from "@/lib/productParse";

describe("inferPlatform", () => {
  it("maps known marketplaces", () => {
    expect(inferPlatform("https://www.douyin.com/user/x")).toBe(Platform.DOUYIN);
    expect(inferPlatform("https://haohuo.jinritemai.com/views/product/detail?id=1")).toBe(Platform.DOUYIN);
    expect(inferPlatform("https://www.xiaohongshu.com/goods/1")).toBe(Platform.XIAOHONGSHU);
    expect(inferPlatform("https://www.kuaishou.com/short-video/1")).toBe(Platform.KUAISHOU);
    expect(inferPlatform("https://channels.weixin.qq.com/x")).toBe(Platform.VIDEO_ACCOUNT);
    expect(inferPlatform("https://item.taobao.com/item.htm?id=1")).toBe(Platform.OTHER);
  });

  it("does not match a look-alike host", () => {
    expect(inferPlatform("https://evil-douyin.com/x")).toBeNull();
  });

  it("returns null for unknown or invalid urls", () => {
    expect(inferPlatform("https://example.com/x")).toBeNull();
    expect(inferPlatform("not a url")).toBeNull();
    expect(inferPlatform(null)).toBeNull();
  });
});

describe("parsePriceText", () => {
  it("parses common price formats", () => {
    expect(parsePriceText("¥1,299.00")).toBe(1299);
    expect(parsePriceText("1299")).toBe(1299);
    expect(parsePriceText("￥199.9元")).toBe(199.9);
    expect(parsePriceText("  88 ")).toBe(88);
  });

  it("returns null when there is no number", () => {
    expect(parsePriceText("面议")).toBeNull();
    expect(parsePriceText("")).toBeNull();
    expect(parsePriceText(null)).toBeNull();
  });

  it("keeps two decimals", () => {
    expect(parsePriceText("19.999")).toBe(20);
  });
});
