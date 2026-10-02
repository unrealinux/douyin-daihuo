import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

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
  return prisma.schedule.update({ where: { id }, data: input });
}

export async function deleteSchedule(id: number) {
  return prisma.schedule.delete({ where: { id } });
}

export function sortSchedules<T extends { scheduledAt: Date }>(items: T[], order: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) =>
    order === "asc"
      ? a.scheduledAt.getTime() - b.scheduledAt.getTime()
      : b.scheduledAt.getTime() - a.scheduledAt.getTime()
  );
}
