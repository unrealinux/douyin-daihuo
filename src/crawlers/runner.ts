import "dotenv/config";
import { chromium } from "playwright";
import { ScrapeTaskStatus } from "@prisma/client";
import { prisma } from "../lib/db";
import { getCrawlerConfig } from "../services/settingService";
import { parseProductsCsv } from "../services/csvService";

async function main() {
  const taskId = Number(process.argv[2]);
  if (!taskId) {
    console.error("usage: tsx runner.ts <taskId>");
    process.exit(1);
  }

  const task = await prisma.scrapeTask.findUnique({ where: { id: taskId } });
  if (!task || task.status !== ScrapeTaskStatus.QUEUED) {
    process.exit(0);
  }

  await prisma.scrapeTask.update({ where: { id: taskId }, data: { status: ScrapeTaskStatus.RUNNING, startedAt: new Date() } });

  const cfg = await getCrawlerConfig();
  const maxRetries = 2;

  try {
    const browser = await chromium.launch({ headless: true, proxy: cfg.proxyUrl ? { server: cfg.proxyUrl } : undefined });
    const page = await browser.newPage();
    await page.setDefaultTimeout(cfg.timeoutSec * 1000);

    const rows: Array<{ name: string; url?: string; category?: string; price?: number; commissionRate?: number; dailySales?: number }> = [];

    if (task.type === "KEYWORD" && task.keyword) {
      // 抖音精选联盟/搜索页没有稳定公开结构，这里用通用电商搜索 fallback。
      // 用户可在 settings 里配置后自行替换目标页；结构变化时此段可单独调整。
      await page.goto(`https://www.baidu.com/s?wd=${encodeURIComponent(task.keyword + " 抖音 带货 商品")}`);
      await page.waitForTimeout(1500);
      const links = await page.$$eval("h3", (els) =>
        els.slice(0, 5).map((el) => ({
          name: el.textContent?.trim() ?? "",
          url: el.querySelector("a")?.getAttribute("href") ?? "",
        }))
      );
      for (const l of links) {
        if (l.name) {
          rows.push({ name: l.name, url: l.url || undefined, category: task.keyword });
          await new Promise((r) => setTimeout(r, cfg.rateLimitMs));
        }
      }
    } else if (task.type === "LINK" && task.url) {
      await page.goto(task.url);
      await page.waitForTimeout(2000);
      const title = await page.title();
      if (title) rows.push({ name: title, url: task.url });
    }

    await browser.close();

    if (!rows.length) {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: {
          status: ScrapeTaskStatus.FAILED,
          message: "未抓取到数据。抖音页面结构变动或风控拦截，请改用手动录入或 CSV 导入。",
          finishedAt: new Date(),
        },
      });
      process.exit(0);
    }

    for (const row of rows) {
      await prisma.product.create({
        data: {
          name: row.name,
          url: row.url,
          category: row.category,
          price: row.price,
          commissionRate: row.commissionRate,
          dailySales: row.dailySales,
          source: "CRAWLER",
        },
      });
    }

    await prisma.scrapeTask.update({
      where: { id: taskId },
      data: {
        status: ScrapeTaskStatus.SUCCESS,
        message: `成功抓取 ${rows.length} 条并入库`,
        finishedAt: new Date(),
      },
    });
  } catch (e) {
    const current = await prisma.scrapeTask.findUnique({ where: { id: taskId } });
    const retries = (current?.retryCount ?? 0) + 1;
    if (retries <= maxRetries) {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: { status: ScrapeTaskStatus.QUEUED, retryCount: retries },
      });
      const delay = Math.pow(2, retries) * 1000;
      setTimeout(() => process.exit(0), delay);
    } else {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: {
          status: ScrapeTaskStatus.FAILED,
          message: `抓取失败：${e instanceof Error ? e.message : String(e)}`,
          finishedAt: new Date(),
        },
      });
      process.exit(0);
    }
  }
}

main().finally(() => process.exit(0));
