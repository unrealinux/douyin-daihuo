import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPerformanceSummary } from "@/services/performanceService";
import { selectPendingSchedules } from "@/lib/scheduleUtils";
import { evaluateGrowthStage, monthsBetween } from "@/lib/growthStage";

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 3600 * 1000);

  const [productCount, noScriptCount, weekSchedules, recentPublished, perfSummary, pendingRaw, accountCount, publishedTotal, firstPublished, trackRows] = await Promise.all([
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
    prisma.account.count(),
    prisma.schedule.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.schedule.findFirst({
      where: { publishStatus: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { publishedAt: "asc" },
      select: { publishedAt: true },
    }),
    prisma.product.findMany({ where: { track: { not: null } }, select: { track: true }, distinct: ["track"] }),
  ]);

  const pendingSchedules = selectPendingSchedules(pendingRaw, now).slice(0, 6);

  const growth = evaluateGrowthStage({
    totalOrders: perfSummary.orderCount,
    publishedCount: publishedTotal,
    monthsActive: firstPublished?.publishedAt ? monthsBetween(firstPublished.publishedAt, now) : 0,
    categoryCount: trackRows.length,
  });

  return NextResponse.json({
    productCount,
    noScriptCount,
    weekSchedules,
    recentPublished,
    perfSummary,
    pendingSchedules,
    accountCount,
    growth,
  });
}
