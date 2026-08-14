"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";
import { Button, Card } from "@/components/ui";
import { formatScriptPlaintext, parseHashtagsJson } from "@/services/scriptParser";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";

interface Script {
  id: number; title?: string | null; hook?: string | null; body: string;
  shotScript?: string | null; hashtags?: string | null; status: string;
  style: string; durationSec: number; llmModel?: string | null; createdAt: string;
  product?: { id: number; name: string } | null;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function ScriptsList() {
  const sp = useSearchParams();
  const deepId = sp.get("id");
  const toast = useToast();

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

  const copyScript = async (s: Script) => {
    try {
      await copyText(formatScriptPlaintext(s));
      toast("已复制全文", "success");
    } catch {
      toast("复制失败", "danger");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="脚本文案"
        description="钩子、口播和分镜，复制后去拍"
        actions={<Link href="/scripts/generate"><Button>生成脚本</Button></Link>}
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <div className="space-y-3">
        {scripts.map((s, i) => (
          <Reveal key={s.id} delay={Math.min(i % 6, 5) * 60}>
            <Spotlight>
              <Card hover className={`p-4 ${deepId === String(s.id) ? "border-accent/40" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-medium text-fg">
                      {s.title ?? `脚本 #${s.id}`}
                    </div>
                    {s.product && <div className="mt-0.5 truncate text-xs text-fg-2">{s.product.name}</div>}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="tnum mt-1 text-xs text-fg-2">
                  {s.style} · {s.durationSec}s · {s.llmModel ?? ""} · {new Date(s.createdAt).toLocaleString()}
                </div>
                <div className="mt-2 line-clamp-2 text-sm text-white/80">{s.body}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/50 pt-3">
                  <Button onClick={() => setOpen(s)}>查看</Button>
                  <Button variant="ghost" onClick={() => copyScript(s)}>复制</Button>
                  <Button variant="ghost" onClick={() => { setStatus(s, "ADOPTED"); }}>采用</Button>
                  <Button variant="ghost" className="ml-auto text-danger/80 hover:bg-danger/10 hover:text-danger" onClick={() => setDel(s)}>删除</Button>
                </div>
              </Card>
            </Spotlight>
          </Reveal>
        ))}
        {scripts.length === 0 && !err && (
          <EmptyState title="暂无脚本" description="从商品库选品或手动输入后生成" actionHref="/scripts/generate" actionLabel="去生成" />
        )}
      </div>

      <Modal
        open={!!open}
        title={open?.title ?? (open ? `脚本 #${open.id}` : "脚本")}
        onClose={() => setOpen(null)}
        wide
        footer={open && (
          <>
            <Button variant="ghost" className="mr-auto text-danger/80 hover:text-danger" onClick={() => { setDel(open); setOpen(null); }}>删除</Button>
            <Button variant="ghost" onClick={() => setStatus(open, "DISCARDED")}>废弃</Button>
            <Button variant="secondary" onClick={() => setStatus(open, "ADOPTED")}>采用</Button>
            <Button onClick={() => copyScript(open)}>复制全文</Button>
          </>
        )}
      >
        {open && (
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <div className="text-xs text-fg-2">黄金3秒钩子</div>
              <p className="mt-1 text-fg">{open.hook ?? "-"}</p>
            </div>
            <div>
              <div className="text-xs text-fg-2">口播正文</div>
              <p className="mt-1 whitespace-pre-wrap">{open.body}</p>
            </div>
            {open.shotScript && (
              <div>
                <div className="text-xs text-fg-2">分镜脚本</div>
                <p className="mt-1 whitespace-pre-wrap">{open.shotScript}</p>
              </div>
            )}
            {open.hashtags && (
              <div>
                <div className="text-xs text-fg-2">标签</div>
                <p className="mt-1">{parseHashtagsJson(open.hashtags).join(" ")}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

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
