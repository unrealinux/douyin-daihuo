import { ScrapeTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCrawlerConfig } from "./settingService";
import { spawn } from "child_process";
import path from "path";

export interface TaskCreateInput {
  type: "KEYWORD" | "LINK";
  keyword?: string;
  url?: string;
  productId?: number;
}

export async function createTask(input: TaskCreateInput) {
  return prisma.scrapeTask.create({
    data: {
      type: input.type,
      keyword: input.keyword,
      url: input.url,
      productId: input.productId,
      status: ScrapeTaskStatus.QUEUED,
    },
  });
}

export async function listTasks() {
  return prisma.scrapeTask.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true } } },
    take: 50,
  });
}

export async function getTask(id: number) {
  return prisma.scrapeTask.findUnique({ where: { id } });
}

const POLL_COOLDOWN_MS = 15_000;
let lastPollAt = 0;

export function spawnRunner(taskId: number) {
  const runnerPath = path.join(process.cwd(), "src", "crawlers", "runner.ts");
  const child = spawn("npx", ["tsx", runnerPath, String(taskId)], {
    detached: true,
    stdio: "ignore",
    shell: true,
  });
  child.unref();
}

export async function retryTask(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const task = await prisma.scrapeTask.findUnique({ where: { id } });
  if (!task || task.status !== ScrapeTaskStatus.FAILED) return null;
  const updated = await prisma.scrapeTask.update({
    where: { id },
    data: { status: ScrapeTaskStatus.QUEUED, message: null, retryCount: { increment: 1 } },
  });
  spawnRunner(id);
  return updated;
}

/** 拉起排队中的任务；runner 内原子抢占，重复 spawn 安全 */
export async function pollQueuedTasks() {
  // 任务页每 2 秒轮询一次，不加节流会对同一个 QUEUED 任务反复开进程
  // shortcut: 进程持续起不来时每 15 秒仍会重试一次，不会自动置为 FAILED，需手动删除任务
  const now = Date.now();
  if (now - lastPollAt < POLL_COOLDOWN_MS) return 0;
  lastPollAt = now;

  const queued = await prisma.scrapeTask.findMany({
    where: { status: ScrapeTaskStatus.QUEUED },
    take: 5,
    orderBy: { createdAt: "asc" },
  });
  for (const t of queued) {
    spawnRunner(t.id);
  }
  return queued.length;
}

export async function checkPlaywright() {
  try {
    const { chromium } = await import("playwright");
    const cfg = await getCrawlerConfig();
    const executable = chromium.executablePath();
    const fs = await import("fs");
    return { installed: fs.existsSync(executable), crawlerConfig: cfg };
  } catch (e) {
    return { installed: false, error: String(e) };
  }
}
