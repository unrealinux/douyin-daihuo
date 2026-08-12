import "dotenv/config";
import { chromium, type Browser } from "playwright";
import { ScrapeTaskStatus } from "@prisma/client";
import { spawn } from "child_process";
import path from "path";
import { prisma } from "../lib/db";
import { getCrawlerConfig } from "../services/settingService";

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

    const rows: Array<{
      name: string;
      url?: string;
      category?: string;
      price?: number;
      commissionRate?: number;
      dailySales?: number;
    }> = [];

    if (task.type === "KEYWORD" && task.keyword) {
      // 抖音精选联盟/搜索页没有稳定公开结构，这里用通用电商搜索 fallback。
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

    await prisma.$transaction([
      ...rows.map((row) =>
        prisma.product.create({
          data: {
            name: row.name,
            url: row.url,
            category: row.category,
            price: row.price,
            commissionRate: row.commissionRate,
            dailySales: row.dailySales,
            source: "CRAWLER",
          },
        })
      ),
      prisma.scrapeTask.update({
        where: { id: taskId },
        data: {
          status: ScrapeTaskStatus.SUCCESS,
          message: `成功抓取 ${rows.length} 条并入库`,
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
      const delay = Math.pow(2, retries) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      respawn(taskId);
    } else {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: {
          status: ScrapeTaskStatus.FAILED,
          message: `抓取失败：${e instanceof Error ? e.message : String(e)}`,
          finishedAt: new Date(),
        },
      });
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
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
