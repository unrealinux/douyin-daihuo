export interface ScheduleLike {
  id: number;
  scheduledAt: Date | string;
  publishStatus: string;
  asset?: { title?: string | null; fileName: string } | null;
}

/** 本地时区 YYYY-MM-DD，用于按天聚合。 */
export function dateKey(d: Date | string): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** 按天分组排期，day -> schedules。 */
export function groupSchedulesByDay<S extends ScheduleLike>(schedules: S[]): Record<string, S[]> {
  const out: Record<string, S[]> = {};
  for (const s of schedules) {
    (out[dateKey(s.scheduledAt)] ??= []).push(s);
  }
  return out;
}

export const PENDING_WINDOW_MS = 24 * 3600 * 1000;

/** 待发布提醒：PLANNED 且已到期或未来 24h 内，按时间升序。 */
export function selectPendingSchedules<S extends ScheduleLike>(schedules: S[], now: Date = new Date()): S[] {
  const cutoff = new Date(now.getTime() + PENDING_WINDOW_MS);
  return schedules
    .filter((s) => s.publishStatus === "PLANNED" && new Date(s.scheduledAt).getTime() <= cutoff.getTime())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/** 计划发布但已过预定时间，仍未发布。 */
export function isOverdue(s: ScheduleLike, now: Date = new Date()): boolean {
  return s.publishStatus === "PLANNED" && new Date(s.scheduledAt).getTime() < now.getTime();
}
