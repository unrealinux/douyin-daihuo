"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Card } from "@/components/ui";

interface Script {
  id: number; title?: string | null; hook?: string | null; body: string;
  shotScript?: string | null; hashtags?: string | null; status: string;
  style: string; durationSec: number; llmModel?: string | null; createdAt: string;
  product?: { id: number; name: string } | null;
}

function ScriptsList() {
  const sp = useSearchParams();
  const deepId = sp.get("id");

  const [scripts, setScripts] = useState<Script[]>([]);
  const [open, setOpen] = useState<Script | null>(null);
  const [del, setDel] = useState<Script | null>(null);
  const [err, setErr] = useState("");

  const load = () =>
    fetch("/api/scripts")
      .then(async (r) => {
        if (!r.ok) throw new Error("加载失败");
        return r.json();
      })
      .then((list: Script[]) => {
        setScripts(list);
        setErr("");
        if (deepId) {
          const found = list.find((s) => String(s.id) === deepId);
          if (found) setOpen(found);
        }
      })
      .catch((e) => setErr(String(e)));

  useEffect(() => { load(); }, [deepId]);

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
        <h1 className="text-2xl font-bold">脚本文案</h1>
        <Link href="/scripts/generate"><Button>生成脚本</Button></Link>
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}

      <div className="space-y-3">
        {scripts.map((s) => (
          <Card key={s.id} className={`p-4 ${deepId === String(s.id) ? "border-accent/40" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium text-fg">
                {s.title ?? `脚本 #${s.id}`}
                {s.product && <span className="ml-2 text-sm text-white/60">· {s.product.name}</span>}
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="tnum mt-1 text-sm text-white/60">
              {s.style} · {s.durationSec}s · {s.llmModel ?? ""} · {new Date(s.createdAt).toLocaleString()}
            </div>
            <div className="mt-2 line-clamp-2 text-sm text-white/70">{s.body}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(s)}>查看</Button>
              <Button variant="ghost" onClick={() => { setStatus(s, "ADOPTED"); }}>采用</Button>
              <Button variant="danger" onClick={() => setDel(s)}>删除</Button>
            </div>
          </Card>
        ))}
        {scripts.length === 0 && !err && (
          <div className="py-16 text-center text-white/40">
            暂无脚本 · <Link href="/scripts/generate" className="text-cyan-300 hover:underline">去生成</Link>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setOpen(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-lg border border-white/10 bg-surface p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-fg">{open.title ?? `脚本 #${open.id}`}</h3>
              <button onClick={() => setOpen(null)} className="text-white/40 hover:text-white">×</button>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <div><b className="text-fg">黄金3秒钩子：</b>{open.hook ?? "-"}</div>
              <div><b className="text-fg">口播正文：</b><p className="whitespace-pre-wrap">{open.body}</p></div>
              {open.shotScript && <div><b className="text-fg">分镜脚本：</b><p className="whitespace-pre-wrap">{open.shotScript}</p></div>}
              {open.hashtags && <div><b className="text-fg">标签：</b>{parseHashtags(open.hashtags).join(" ")}</div>}
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

export default function ScriptsPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-white/5" />}>
      <ScriptsList />
    </Suspense>
  );
}
