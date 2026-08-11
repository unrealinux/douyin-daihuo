"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui";

interface Script {
  id: number; title?: string | null; hook?: string | null; body: string;
  shotScript?: string | null; hashtags?: string | null; status: string;
  style: string; durationSec: number; llmModel?: string | null; createdAt: string;
  product?: { id: number; name: string } | null;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [open, setOpen] = useState<Script | null>(null);
  const [del, setDel] = useState<Script | null>(null);

  const load = () => fetch("/api/scripts").then((r) => r.json()).then(setScripts);
  useEffect(() => { load(); }, []);

  const setStatus = async (s: Script, status: string) => {
    await fetch(`/api/scripts/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOpen(null);
    load();
  };

  const delScript = async () => {
    if (!del) return;
    await fetch(`/api/scripts/${del.id}`, { method: "DELETE" });
    setDel(null);
    load();
  };

  const parseHashtags = (raw?: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">脚本文案</h1>
        <Link href="/scripts/generate"><Button>生成脚本</Button></Link>
      </div>

      <div className="space-y-3">
        {scripts.map((s) => (
          <div key={s.id} className="rounded border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {s.title ?? `脚本 #${s.id}`}
                {s.product && <span className="ml-2 text-sm text-gray-500">· {s.product.name}</span>}
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {s.style} · {s.durationSec}s · {s.llmModel ?? ""} · {new Date(s.createdAt).toLocaleString()}
            </div>
            <div className="mt-2 line-clamp-2 text-sm text-gray-700">{s.body}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(s)}>查看</Button>
              <Button variant="secondary" onClick={() => { setStatus(s, "ADOPTED"); }}>采用</Button>
              <Button variant="danger" onClick={() => setDel(s)}>删除</Button>
            </div>
          </div>
        ))}
        {scripts.length === 0 && <p className="py-10 text-center text-gray-400">暂无脚本</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-lg bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold">{open.title ?? `脚本 #${open.id}`}</h3>
              <button onClick={() => setOpen(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><b>黄金3秒钩子：</b>{open.hook ?? "-"}</div>
              <div><b>口播正文：</b><p className="whitespace-pre-wrap">{open.body}</p></div>
              {open.shotScript && <div><b>分镜脚本：</b><p className="whitespace-pre-wrap">{open.shotScript}</p></div>}
              {open.hashtags && <div><b>标签：</b>{parseHashtags(open.hashtags).join(" ")}</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setStatus(open, "ADOPTED")}>标记采用</Button>
              <Button variant="secondary" onClick={() => setStatus(open, "DISCARDED")}>标记废弃</Button>
              <Button variant="danger" onClick={() => { setDel(open); setOpen(null); }}>删除</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!del}
        title="删除脚本"
        message={`确定删除「${del?.title ?? `脚本 #${del?.id}`}」？`}
        onConfirm={delScript}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
