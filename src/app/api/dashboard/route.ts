import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 3600 * 1000);

  const [productCount, noScriptCount, weekSchedules, recentPublished] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { scriptIdeas: { none: {} } } }),
    prisma.schedule.count({ where: { scheduledAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.schedule.count({
      where: { publishStatus: "PUBLISHED", publishedAt: { gte: weekAgo } },
    }),
  ]);

  return NextResponse.json({ productCount, noScriptCount, weekSchedules, recentPublished });
}
