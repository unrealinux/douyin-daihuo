import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPerformanceSummary } from "@/services/performanceService";
import { selectPendingSchedules } from "@/lib/scheduleUtils";

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 3600 * 1000);

  const [productCount, noScriptCount, weekSchedules, recentPublished, perfSummary, pendingRaw] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { scriptIdeas: { none: {} } } }),
    prisma.schedule.count({ where: { scheduledAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.schedule.count({
      where: { publishStatus: "PUBLISHED", publishedAt: { gte: weekAgo } },
    }),
    getPerformanceSummary(),
    prisma.schedule.findMany({
      where: { publishStatus: "PLANNED" },
      orderBy: { scheduledAt: "asc" },
      include: { asset: { select: { id: true, title: true, fileName: true } } },
      take: 30,
    }),
  ]);

  const pendingSchedules = selectPendingSchedules(pendingRaw, now).slice(0, 6);

  return NextResponse.json({
    productCount,
    noScriptCount,
    weekSchedules,
    recentPublished,
    perfSummary,
    pendingSchedules,
  });
}
