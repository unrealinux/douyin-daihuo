"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Card, Select } from "@/components/ui";

interface Asset {
  id: number; fileName: string; filePath: string; fileType: string; size: number;
  title?: string | null; status: string; createdAt: string;
  product?: { id: number; name: string } | null;
  script?: { id: number; title?: string | null } | null;
  schedules: Schedule[];
}

interface Schedule {
  id: number; scheduledAt: string; publishStatus: string; publishUrl?: string | null;
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function schedulePresets(): { value: string; label: string }[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(10, 0, 0, 0);

  const friday = new Date();
  const day = friday.getDay();
  let daysUntilFri = (5 - day + 7) % 7;
  if (daysUntilFri === 0 && friday.getHours() >= 19) daysUntilFri = 7;
  friday.setDate(friday.getDate() + daysUntilFri);
  friday.setHours(19, 0, 0, 0);

  return [
    { value: toLocalInputValue(tomorrow), label: "明早10点" },
    { value: toLocalInputValue(dayAfter), label: "后天10点" },
    { value: toLocalInputValue(friday), label: "周五晚7点" },
  ];
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [uploading, setUploading] = useState(false);
  const [del, setDel] = useState<Asset | null>(null);

  const load = useCallback(() => {
    fetch("/api/assets").then((r) => r.json()).then(setAssets);
    fetch("/api/schedules").then((r) => r.json()).then(setSchedules);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch("/api/assets/upload", { method: "POST", body: fd });
    setUploading(false);
    load();
  };

  const createSchedule = async (assetId: number, dateStr: string) => {
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, scheduledAt: dateStr }),
    });
    load();
  };

  const markPublished = async (s: Schedule) => {
    const url = prompt("粘贴发布后的抖音链接（可留空）：", s.publishUrl ?? "");
    if (url === null) return;
    await fetch(`/api/schedules/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishStatus: "PUBLISHED",
        publishUrl: url || undefined,
        publishedAt: new Date().toISOString(),
      }),
    });
    load();
  };

  const delAsset = async () => {
    if (!del) return;
    await fetch(`/api/assets/${del.id}`, { method: "DELETE" });
    setDel(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">素材与排期</h1>
        <label className="cursor-pointer rounded-lg bg-gradient-to-r from-[#fe2c55] to-[#ff6b81] px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110">
          {uploading ? "上传中..." : "上传素材"}
          <input type="file" accept="video/*,image/*" className="hidden" onChange={upload} />
        </label>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">素材库（{assets.length}）</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <Card key={a.id} hover className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <StatusBadge status={a.status} />
                <button onClick={() => setDel(a)} className="text-xs text-white/40 hover:text-danger">删除</button>
              </div>
              <div className="text-sm font-medium text-fg">{a.title ?? a.fileName}</div>
              <div className="text-xs text-white/50">
                {a.product?.name ?? "未关联商品"} · {a.script ? `脚本#${a.script.id}` : "无脚本"}
              </div>
              <div className="mt-2 flex gap-1">
                <Select id={`assetsel-${a.id}`} defaultValue="" className="text-xs">
                  <option value="" disabled>+ 排期</option>
                  {schedulePresets().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                <Button variant="secondary" className="text-xs" onClick={() => {
                  const sel = document.getElementById(`assetsel-${a.id}`) as HTMLSelectElement;
                  if (sel.value) createSchedule(a.id, sel.value);
                }}>确定</Button>
              </div>
              {a.schedules.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  {a.schedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded bg-white/5 px-2 py-1">
                      <span className="text-white/70">{new Date(s.scheduledAt).toLocaleString()}</span>
                      <StatusBadge status={s.publishStatus} />
                      {s.publishStatus === "PLANNED" && (
                        <Button variant="ghost" className="text-xs" onClick={() => markPublished(s)}>发布</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
          {assets.length === 0 && <div className="col-span-full py-16 text-center text-white/40">暂无素材，点右上角上传</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">排期时间线</h2>
        <div className="space-y-2">
          {schedules.map((s) => {
            const asset = assets.find((a) => a.schedules.some((x) => x.id === s.id));
            return (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface px-3 py-2 text-sm">
                <div>
                  <span className="tnum font-medium text-fg">{new Date(s.scheduledAt).toLocaleString()}</span>
                  <span className="ml-3 text-white/50">{asset?.title ?? asset?.fileName ?? "素材已删除"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.publishStatus} />
                  {s.publishUrl && <a href={s.publishUrl} target="_blank" className="text-xs text-cyan-300">链接</a>}
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && <div className="py-6 text-center text-sm text-white/40">暂无排期</div>}
        </div>
      </section>

      <ConfirmDialog
        open={!!del}
        title="删除素材"
        message={`确定删除「${del?.title ?? del?.fileName}」？将同时删除磁盘文件。`}
        onConfirm={delAsset}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}