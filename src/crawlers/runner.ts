import "dotenv/config";
import { chromium, type Browser } from "playwright";
import { ScrapeTaskStatus } from "@prisma/client";
import { spawn } from "child_process";
import path from "path";
import { prisma } from "../lib/db";
import { getCrawlerConfig } from "../services/settingService";
import { inferPlatform, parsePriceText } from "../lib/productParse";

function respawn(taskId: number) {
  const runnerPath = path.join(process.cwd(), "src", "crawlers", "runner.ts");
  const child = spawn("npx", ["tsx", runnerPath, String(taskId)], {
    detached: true,
    stdio: "ignore",
    shell: true,
  });
  child.unref();
}

async function claimTask(taskId: number): Promise<boolean> {
  const result = await prisma.scrapeTask.updateMany({
    where: { id: taskId, status: ScrapeTaskStatus.QUEUED },
    data: { status: ScrapeTaskStatus.RUNNING, startedAt: new Date() },
  });
  return result.count === 1;
}

async function markFailed(taskId: number, message: string) {
  await prisma.scrapeTask.update({
    where: { id: taskId },
    data: { status: ScrapeTaskStatus.FAILED, message, finishedAt: new Date() },
  });
}

/**
 * 在页面里执行的取数脚本。必须写成字符串：tsx/esbuild 会给具名函数插入 __name 辅助，
 * 传函数引用进去会在浏览器里抛 "__name is not defined"。
 */
const READ_FACTS_JS = `(() => {
  const meta = (sel) => { const el = document.querySelector(sel); return el && el.content ? el.content.trim() : ""; };
  const prices = [];
  const pushPrice = (v) => { const n = typeof v === "number" ? v : Number(v); if (isFinite(n) && n >= 0) prices.push(n); };
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.offers) {
      if (Array.isArray(node.offers)) node.offers.forEach((o) => pushPrice(o && o.price));
      else pushPrice(node.offers.price);
    }
    Object.keys(node).forEach((k) => { if (k !== "offers") walk(node[k]); });
  };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    try { walk(JSON.parse(el.textContent || "null")); } catch (e) { /* 坏 JSON-LD 直接跳过 */ }
  });
  return {
    title: meta('meta[property="og:title"]') || (document.title || "").trim(),
    image: meta('meta[property="og:image"]'),
    priceRaw: meta('meta[property="product:price:amount"]') || (prices.length ? String(prices[0]) : ""),
  };
})()`;

async function main() {
  const taskId = Number(process.argv[2]);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    console.error("usage: tsx runner.ts <taskId>");
    process.exit(1);
  }

  if (!(await claimTask(taskId))) {
    process.exit(0);
  }

  const task = await prisma.scrapeTask.findUnique({ where: { id: taskId } });
  if (!task) {
    process.exit(0);
  }

  if (task.type !== "LINK" || !task.url) {
    await markFailed(taskId, "关键词抓取已停用：请改为粘贴商品链接，逐条解析标题与价格");
    process.exit(0);
  }

  const cfg = await getCrawlerConfig();
  const maxRetries = 2;
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      proxy: cfg.proxyUrl ? { server: cfg.proxyUrl } : undefined,
    });
    const page = await browser.newPage();
    await page.setDefaultTimeout(cfg.timeoutSec * 1000);
    await page.goto(task.url, { waitUntil: "domcontentloaded" });

    const facts = (await page.evaluate(READ_FACTS_JS)) as { title: string; image: string; priceRaw: string };
    const name = facts.title.trim();
    if (!name) {
      await markFailed(taskId, "页面没有可用标题（可能需要登录、被反爬，或链接不是商品详情页）");
      process.exit(0);
    }

    const price = parsePriceText(facts.priceRaw);
    const platform = inferPlatform(task.url);
    const missing = [price === null ? "价格" : "", facts.image ? "" : "图片"].filter(Boolean);

    await prisma.$transaction([
      prisma.product.create({
        data: {
          name,
          url: task.url,
          imageUrl: facts.image || null,
          price,
          platform,
          source: "CRAWLER",
        },
      }),
      prisma.scrapeTask.update({
        where: { id: taskId },
        data: {
          status: ScrapeTaskStatus.SUCCESS,
          message:
            `已解析标题` +
            (missing.length ? `，页面未提供：${missing.join("、")}（佣金/日销需在精选联盟后台核对）` : " · 价格 · 图片"),
          finishedAt: new Date(),
        },
      }),
    ]);
  } catch (e) {
    const current = await prisma.scrapeTask.findUnique({ where: { id: taskId } });
    const retries = (current?.retryCount ?? 0) + 1;
    if (retries <= maxRetries) {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: { status: ScrapeTaskStatus.QUEUED, retryCount: retries, message: null },
      });
      await new Promise((r) => setTimeout(r, Math.pow(2, retries) * 1000));
      respawn(taskId);
    } else {
      await markFailed(taskId, `抓取失败：${e instanceof Error ? e.message : String(e)}`);
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // 关闭失败不影响任务结果
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
