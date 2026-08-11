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
  const task = await prisma.scrapeTask.findUnique({ where: { id } });
  if (!task) return null;
  const updated = await prisma.scrapeTask.update({
    where: { id },
    data: { status: ScrapeTaskStatus.QUEUED, message: null, retryCount: { increment: 1 } },
  });
  spawnRunner(id);
  return updated;
}

export async function pollQueuedTasks() {
  const queued = await prisma.scrapeTask.findMany({
    where: { status: ScrapeTaskStatus.QUEUED },
    take: 5,
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
