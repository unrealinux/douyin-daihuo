const STATUS_COLORS: Record<string, string> = {
  CANDIDATE: "bg-white/10 text-white/60",
  FOLLOWING: "bg-cyan-500/15 text-cyan-300",
  SELECTED: "bg-success/15 text-success",
  DROPPED: "bg-danger/15 text-danger",
  DRAFT: "bg-white/10 text-white/60",
  ADOPTED: "bg-success/15 text-success",
  DISCARDED: "bg-danger/15 text-danger",
  PENDING: "bg-warning/15 text-warning",
  PUBLISHED: "bg-success/15 text-success",
  PLANNED: "bg-cyan-500/15 text-cyan-300",
  SKIPPED: "bg-white/10 text-white/60",
  QUEUED: "bg-warning/15 text-warning",
  RUNNING: "bg-cyan-500/15 text-cyan-300",
  SUCCESS: "bg-success/15 text-success",
  FAILED: "bg-danger/15 text-danger",
  UP: "bg-accent/15 text-accent",
  STEADY: "bg-emerald-500/15 text-emerald-300",
  DOWN: "bg-danger/15 text-danger",
};

const STATUS_LABELS: Record<string, string> = {
  CANDIDATE: "候选", FOLLOWING: "跟进", SELECTED: "已选", DROPPED: "放弃",
  DRAFT: "草稿", ADOPTED: "已采用", DISCARDED: "已废弃",
  PENDING: "待发布", PUBLISHED: "已发布",
  PLANNED: "计划中", SKIPPED: "已跳过",
  QUEUED: "排队中", RUNNING: "运行中", SUCCESS: "成功", FAILED: "失败",
  UP: "上升", STEADY: "平稳", DOWN: "下降",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-white/10 text-white/60";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
