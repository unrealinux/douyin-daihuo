import { Platform } from "@prisma/client";

/** 从商品链接推断来源平台，识别不出来返回 null。 */
export function inferPlatform(url: string | null | undefined): Platform | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);

  if (is("douyin.com") || is("jinritemai.com")) return Platform.DOUYIN;
  if (is("xiaohongshu.com")) return Platform.XIAOHONGSHU;
  if (is("kuaishou.com")) return Platform.KUAISHOU;
  if (is("weixin.qq.com") || is("channels.weixin.qq.com")) return Platform.VIDEO_ACCOUNT;
  if (is("taobao.com") || is("tmall.com") || is("jd.com") || is("yangkeduo.com")) {
    return Platform.OTHER;
  }
  return null;
}

/** 解析价格文本，返回 >=0 的数值；无法解析返回 null。支持 "¥1,299.00"、"1299元"。 */
export function parsePriceText(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
