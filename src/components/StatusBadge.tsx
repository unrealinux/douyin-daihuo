const STATUS_COLORS: Record<string, string> = {
  CANDIDATE: "bg-gray-100 text-gray-700",
  FOLLOWING: "bg-blue-100 text-blue-700",
  SELECTED: "bg-green-100 text-green-700",
  DROPPED: "bg-red-100 text-red-700",
  DRAFT: "bg-gray-100 text-gray-700",
  ADOPTED: "bg-green-100 text-green-700",
  DISCARDED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  PLANNED: "bg-blue-100 text-blue-700",
  SKIPPED: "bg-gray-100 text-gray-700",
  QUEUED: "bg-gray-100 text-gray-700",
  RUNNING: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  UP: "bg-green-100 text-green-700",
  STEADY: "bg-gray-100 text-gray-700",
  DOWN: "bg-red-100 text-red-700",
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
  const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
