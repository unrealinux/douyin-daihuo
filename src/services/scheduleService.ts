import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listSchedules() {
  return prisma.schedule.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { asset: { include: { product: { select: { id: true, name: true } } } } },
  });
}

export async function createSchedule(assetId: number, scheduledAt: Date) {
  return prisma.schedule.create({ data: { assetId, scheduledAt } });
}

export async function updateSchedule(id: number, input: Partial<{
  scheduledAt: Date;
  publishStatus: PublishStatus;
  publishUrl?: string;
  publishedAt?: Date;
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
