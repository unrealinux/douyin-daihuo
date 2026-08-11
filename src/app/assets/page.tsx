"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Input, Label, Select } from "@/components/ui";

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [scripts, setScripts] = useState<{ id: number; title?: string | null }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [del, setDel] = useState<Asset | null>(null);

  const load = useCallback(() => {
    fetch("/api/assets").then((r) => r.json()).then(setAssets);
    fetch("/api/schedules").then((r) => r.json()).then(setSchedules);
    fetch("/api/products?status=ALL").then((r) => r.json()).then(setProducts);
    fetch("/api/scripts").then((r) => r.json()).then(setScripts);
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
        <h1 className="text-xl font-bold">素材与排期</h1>
        <label className="cursor-pointer rounded bg-accent px-4 py-2 text-sm text-white hover:opacity-90">
          {uploading ? "上传中..." : "上传素材"}
          <input type="file" accept="video/*,image/*" className="hidden" onChange={upload} />
        </label>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">素材库（{assets.length}）</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="rounded border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <StatusBadge status={a.status} />
                <button onClick={() => setDel(a)} className="text-xs text-gray-400 hover:text-red-500">删除</button>
              </div>
              <div className="text-sm font-medium">{a.title ?? a.fileName}</div>
              <div className="text-xs text-gray-500">
                {a.product?.name ?? "未关联商品"} · {a.script ? `脚本#${a.script.id}` : "无脚本"}
              </div>
              <div className="mt-2 flex gap-1">
                <Select id={`assetsel-${a.id}`} defaultValue="" className="text-xs">
                  <option value="" disabled>+ 排期</option>
                  <option value="2026-08-12T10:00">明早10点</option>
                  <option value="2026-08-13T10:00">后天10点</option>
                  <option value="2026-08-14T19:00">周五晚7点</option>
                </Select>
                <Button variant="secondary" className="text-xs" onClick={() => {
                  const sel = document.getElementById(`assetsel-${a.id}`) as HTMLSelectElement;
                  if (sel.value) createSchedule(a.id, sel.value);
                }}>确定</Button>
              </div>
              {a.schedules.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  {a.schedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
                      <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                      <StatusBadge status={s.publishStatus} />
                      {s.publishStatus === "PLANNED" && (
                        <Button variant="secondary" className="text-xs" onClick={() => markPublished(s)}>发布</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {assets.length === 0 && <p className="col-span-full py-10 text-center text-gray-400">暂无素材，点右上角上传</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">排期时间线</h2>
        <div className="space-y-2">
          {schedules.map((s) => {
            const asset = assets.find((a) => a.schedules.some((x) => x.id === s.id));
            return (
              <div key={s.id} className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{new Date(s.scheduledAt).toLocaleString()}</span>
                  <span className="ml-3 text-gray-500">{asset?.title ?? asset?.fileName ?? "素材已删除"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.publishStatus} />
                  {s.publishUrl && <a href={s.publishUrl} target="_blank" className="text-xs text-blue-600">链接</a>}
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && <p className="py-6 text-center text-sm text-gray-400">暂无排期</p>}
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
