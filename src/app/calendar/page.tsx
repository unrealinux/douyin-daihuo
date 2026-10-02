"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { Button, Card } from "@/components/ui";
import { dateKey, groupSchedulesByDay } from "@/lib/scheduleUtils";

interface Schedule {
  id: number;
  assetId?: number;
  scheduledAt: string;
  publishStatus: string;
  publishUrl?: string | null;
  asset?: { title?: string | null; fileName: string } | null;
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const STATUS_COLOR: Record<string, string> = {
  PLANNED: "bg-cyan-400",
  PUBLISHED: "bg-success",
  SKIPPED: "bg-white/30",
};

function scheduleTitle(s: Schedule): string {
  return s.asset?.title ?? s.asset?.fileName ?? "素材已删除";
}

/** 以周一为起点铺满 6 行共 42 格。 */
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function toLabel(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export default function CalendarPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(() => dateKey(now));

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await fetch("/api/schedules");
      if (!res.ok) throw new Error("加载排期失败");
      setSchedules(await res.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byDay = useMemo(() => groupSchedulesByDay(schedules), [schedules]);
  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const todayKey = dateKey(now);

  const shift = (delta: number) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const selectedSchedules = byDay[selected] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="发布日历"
        description="按月查看素材的发布排期与发布状态"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => shift(-1)}>上个月</Button>
            <span className="tnum min-w-[110px] text-center text-sm font-medium text-fg">{toLabel(new Date(cursor.year, cursor.month, 1))}</span>
            <Button variant="secondary" onClick={() => shift(1)}>下个月</Button>
          </div>
        }
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-fg-2">
          {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        {loading ? (
          <div className="mt-2 grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-7 gap-1">
            {grid.map((d) => {
              const key = dateKey(d);
              const daySchedules = byDay[key] ?? [];
              const inMonth = d.getMonth() === cursor.month;
              const isToday = key === todayKey;
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`flex min-h-20 flex-col items-stretch gap-1 rounded-lg border p-1.5 text-left transition-all duration-150 ${
                    isSelected ? "border-accent/60 bg-accent/[0.06]" : "border-line/60 bg-white/[0.02] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${inMonth ? "text-fg" : "text-fg-2/50"}`}>{d.getDate()}</span>
                    {isToday && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {daySchedules.slice(0, 4).map((s) => (
                      <span key={s.id} className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[s.publishStatus] ?? "bg-white/30"}`} />
                    ))}
                    {daySchedules.length > 4 && <span className="text-[10px] leading-none text-fg-2">+{daySchedules.length - 4}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-2">
          {selected} <span className="ml-1 text-fg-2/70">（{selectedSchedules.length} 个排期）</span>
        </h2>
        {selectedSchedules.length > 0 ? (
          <div className="space-y-1.5">
            {selectedSchedules.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-surface px-3.5 py-2.5 text-sm">
                <div className="min-w-0">
                  <span className="tnum font-medium text-fg">{new Date(s.scheduledAt).toLocaleString()}</span>
                  <span className="ml-3 text-fg-2">{scheduleTitle(s)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.publishStatus} />
                  {s.publishUrl && (
                    <a href={s.publishUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-300 hover:text-cyan">
                      链接
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="当天无排期" description="可到「素材排期」页面为素材安排发布时间" actionHref="/assets" actionLabel="去排期" />
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4 text-xs text-fg-2">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> 计划中</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> 已发布</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white/30" /> 已跳过</span>
      </div>
    </div>
  );
}
