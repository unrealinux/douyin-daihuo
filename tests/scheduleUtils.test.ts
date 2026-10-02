import { describe, it, expect } from "vitest";
import {
  dateKey,
  groupSchedulesByDay,
  selectPendingSchedules,
  isOverdue,
  PENDING_WINDOW_MS,
} from "@/lib/scheduleUtils";

const mk = (o: Partial<{ id: number; scheduledAt: Date | string; publishStatus: string }>) => ({
  id: o.id ?? 1,
  scheduledAt: o.scheduledAt ?? new Date("2026-08-31T10:00:00"),
  publishStatus: o.publishStatus ?? "PLANNED",
});

describe("dateKey", () => {
  it("formats local YYYY-MM-DD with padding", () => {
    expect(dateKey(new Date(2026, 7, 5))).toBe("2026-08-05");
    expect(dateKey("2026-11-30T08:00:00")).toBe("2026-11-30");
  });
});

describe("groupSchedulesByDay", () => {
  it("groups schedules by their day", () => {
    const schedules = [
      mk({ id: 1, scheduledAt: new Date(2026, 7, 31, 9) }),
      mk({ id: 2, scheduledAt: new Date(2026, 7, 31, 20) }),
      mk({ id: 3, scheduledAt: new Date(2026, 8, 1, 9) }),
    ];
    const grouped = groupSchedulesByDay(schedules);
    expect(Object.keys(grouped).sort()).toEqual(["2026-08-31", "2026-09-01"]);
    expect(grouped["2026-08-31"]).toHaveLength(2);
    expect(grouped["2026-09-01"]).toHaveLength(1);
  });
});

describe("selectPendingSchedules", () => {
  const now = new Date("2026-08-31T12:00:00");

  it("includes overdue and within-24h PLANNED schedules", () => {
    const schedules = [
      mk({ id: 1, scheduledAt: new Date("2026-08-31T10:00:00") }), // overdue
      mk({ id: 2, scheduledAt: new Date("2026-08-31T20:00:00") }), // within 24h
      mk({ id: 3, scheduledAt: new Date("2026-09-05T10:00:00") }), // beyond 24h
      mk({ id: 4, scheduledAt: new Date("2026-08-31T10:00:00"), publishStatus: "PUBLISHED" }), // not planned
    ];
    const out = selectPendingSchedules(schedules, now);
    expect(out.map((s) => s.id)).toEqual([1, 2]);
  });

  it("sorts by scheduledAt ascending", () => {
    const schedules = [
      mk({ id: 2, scheduledAt: new Date("2026-08-31T20:00:00") }),
      mk({ id: 1, scheduledAt: new Date("2026-08-31T10:00:00") }),
    ];
    expect(selectPendingSchedules(schedules, now).map((s) => s.id)).toEqual([1, 2]);
  });

  it("respects the 24h window constant", () => {
    expect(PENDING_WINDOW_MS).toBe(24 * 3600 * 1000);
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-08-31T12:00:00");
  it("is true for past PLANNED schedule", () => {
    expect(isOverdue(mk({ scheduledAt: new Date("2026-08-31T10:00:00") }), now)).toBe(true);
  });
  it("is false for future PLANNED schedule", () => {
    expect(isOverdue(mk({ scheduledAt: new Date("2026-08-31T20:00:00") }), now)).toBe(false);
  });
  it("is false for non-PLANNED schedule", () => {
    expect(isOverdue(mk({ scheduledAt: new Date("2026-08-30T10:00:00"), publishStatus: "PUBLISHED" }), now)).toBe(false);
  });
});
