"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, Label } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";

interface Task {
  id: number; type: string; keyword?: string | null; url?: string | null;
  status: string; message?: string | null; retryCount: number; createdAt: string;
}

export default function TasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pwOk, setPwOk] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("加载任务失败");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setPwOk(data.playwright?.installed !== false);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const busy = tasks.some((t) => t.status === "QUEUED" || t.status === "RUNNING");
    if (!busy) return;
    const id = window.setInterval(load, 2000);
    return () => window.clearInterval(id);
  }, [tasks, load]);

  const submit = async (type: "KEYWORD" | "LINK") => {
    setMsg("");
    if (type === "KEYWORD" && !keyword.trim()) {
      setMsg("请输入关键词");
      setMsgOk(false);
      return;
    }
    if (type === "LINK" && !link.trim()) {
      setMsg("请输入链接");
      setMsgOk(false);
      return;
    }
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type === "KEYWORD" ? { keyword: keyword.trim() } : { url: link.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setKeyword(""); setLink("");
      setMsg(`任务 #${data.id} 已创建`);
      setMsgOk(true);
      toast(`任务 #${data.id} 已创建`, "success");
      load();
    } else {
      setMsg(data.error ?? "创建失败");
      setMsgOk(false);
    }
  };

  const retry = async (id: number) => {
    const res = await fetch(`/api/tasks/${id}/retry`, { method: "POST" });
    if (!res.ok) {
      toast("重试失败（仅失败任务可重试）", "danger");
      return;
    }
    toast(`任务 #${id} 已重新排队`, "info");
    load();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="爬虫任务"
        actions={<Link href="/products"><Button variant="ghost">返回商品库</Button></Link>}
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning">
        当前抓取是<strong className="font-medium">网页搜索兜底</strong>（百度关键词 / 打开链接取标题），不是抖音精选联盟商品库。结果请人工核对，正式选品请用手动录入或 CSV 导入。
      </div>

      {!pwOk && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning">
          Playwright 浏览器未安装。运行 <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">npx playwright install chromium</code> 后重启。此问题不影响其他功能。
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
              </svg>
            </span>
            <Label htmlFor="kw">关键词搜索</Label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="kw" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例如：厨房 收纳 爆款" />
            <Button onClick={() => submit("KEYWORD")}>抓取</Button>
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            <Label htmlFor="link">链接抓取</Label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            <Button onClick={() => submit("LINK")}>抓取</Button>
          </div>
        </Card>
      </div>

      {msg && <p className={`text-sm ${msgOk ? "text-success" : "text-danger"}`}>{msg}</p>}

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-2">任务列表</h2>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <Reveal key={t.id} delay={Math.min(i % 8, 7) * 50}>
              <Spotlight>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-surface px-3.5 py-2.5 text-sm transition-colors duration-150 hover:border-white/10">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.type === "KEYWORD" ? "bg-accent/15 text-accent" : "bg-cyan-500/15 text-cyan-300"}`}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {t.type === "KEYWORD" ? (
                          <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                        ) : (
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        )}
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-fg">
                        {t.type === "KEYWORD" ? `关键词: ${t.keyword}` : `链接: ${t.url}`}
                      </div>
                      <div className="tnum text-xs text-fg-2">
                        {new Date(t.createdAt).toLocaleString()} · 重试 {t.retryCount} 次
                      </div>
                      {t.message && <div className="text-xs text-fg-2">{t.message}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    {t.status === "FAILED" && <Button variant="ghost" className="text-xs" onClick={() => retry(t.id)}>重试</Button>}
                  </div>
                </div>
              </Spotlight>
            </Reveal>
          ))}
          {tasks.length === 0 && !err && (
            <EmptyState title="暂无任务" description="关键词会走网页搜索兜底；精确选品请用手动/CSV" />
          )}
        </div>
      </section>
    </div>
  );
}
