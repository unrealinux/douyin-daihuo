import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertPublishable } from "@/lib/publishChecklist";

export async function listSchedules() {
  return prisma.schedule.findMany({
    orderBy: { scheduledAt: "asc" },
    include: {
      account: { select: { id: true, name: true, platform: true } },
      asset: { include: { product: { select: { id: true, name: true } } } },
    },
  });
}

export async function createSchedule(assetId: number, scheduledAt: Date, accountId?: number) {
  return prisma.schedule.create({ data: { assetId, scheduledAt, accountId: accountId ?? null } });
}

export async function updateSchedule(id: number, input: Partial<{
  scheduledAt: Date;
  publishStatus: PublishStatus;
  publishUrl?: string;
  publishedAt?: Date;
  accountId?: number | null;
  checklist?: string;
  publishTitle?: string;
  publishHashtags?: string;
  commentScript?: string;
}>) {
  if (input.publishStatus === PublishStatus.PUBLISHED) {
    const current = await prisma.schedule.findUnique({ where: { id }, select: { checklist: true } });
    // 不存在时交给 update 抛 P2025，避免把 404 误报成 400
    if (current) assertPublishable(current.checklist, input.checklist);
  }
  return prisma.schedule.update({ where: { id }, data: input });
}

export async function deleteSchedule(id: number) {
  // Performance 是 required 关系且默认 Restrict，不先删会抛 P2003
  const [, schedule] = await prisma.$transaction([
    prisma.performance.deleteMany({ where: { scheduleId: id } }),
    prisma.schedule.delete({ where: { id } }),
  ]);
  return schedule;
}

export function sortSchedules<T extends { scheduledAt: Date }>(items: T[], order: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) =>
    order === "asc"
      ? a.scheduledAt.getTime() - b.scheduledAt.getTime()
      : b.scheduledAt.getTime() - a.scheduledAt.getTime()
  );
}
