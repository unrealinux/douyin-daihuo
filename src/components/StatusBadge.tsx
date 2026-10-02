const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  CANDIDATE: { dot: "bg-white/40", text: "bg-white/10 text-white/60" },
  FOLLOWING: { dot: "bg-cyan-400", text: "bg-cyan-500/15 text-cyan-300" },
  SELECTED: { dot: "bg-success", text: "bg-success/15 text-success" },
  DROPPED: { dot: "bg-danger", text: "bg-danger/15 text-danger" },
  DRAFT: { dot: "bg-white/40", text: "bg-white/10 text-white/60" },
  ADOPTED: { dot: "bg-success", text: "bg-success/15 text-success" },
  DISCARDED: { dot: "bg-danger", text: "bg-danger/15 text-danger" },
  PENDING: { dot: "bg-warning", text: "bg-warning/15 text-warning" },
  PUBLISHED: { dot: "bg-success", text: "bg-success/15 text-success" },
  PLANNED: { dot: "bg-cyan-400", text: "bg-cyan-500/15 text-cyan-300" },
  SKIPPED: { dot: "bg-white/40", text: "bg-white/10 text-white/60" },
  QUEUED: { dot: "bg-warning", text: "bg-warning/15 text-warning" },
  RUNNING: { dot: "bg-cyan-400 animate-pulse", text: "bg-cyan-500/15 text-cyan-300" },
  SUCCESS: { dot: "bg-success", text: "bg-success/15 text-success" },
  FAILED: { dot: "bg-danger", text: "bg-danger/15 text-danger" },
  UP: { dot: "bg-accent", text: "bg-accent/15 text-accent" },
  STEADY: { dot: "bg-success", text: "bg-success/15 text-success" },
  DOWN: { dot: "bg-danger", text: "bg-danger/15 text-danger" },
  ACTIVE: { dot: "bg-success", text: "bg-success/15 text-success" },
  PAUSED: { dot: "bg-warning", text: "bg-warning/15 text-warning" },
  DEAD: { dot: "bg-danger", text: "bg-danger/15 text-danger" },
};

const STATUS_LABELS: Record<string, string> = {
  CANDIDATE: "候选", FOLLOWING: "跟进", SELECTED: "已选", DROPPED: "放弃",
  DRAFT: "草稿", ADOPTED: "已采用", DISCARDED: "已废弃",
  PENDING: "待发布", PUBLISHED: "已发布",
  PLANNED: "计划中", SKIPPED: "已跳过",
  QUEUED: "排队中", RUNNING: "运行中", SUCCESS: "成功", FAILED: "失败",
  UP: "上升", STEADY: "平稳", DOWN: "下降",
  ACTIVE: "运营中", PAUSED: "已暂停", DEAD: "已弃用",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { dot: "bg-white/40", text: "bg-white/10 text-white/60" };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}