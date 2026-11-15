"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import { Button, Card, Label } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";

interface Task {
  id: number; type: string; url?: string | null;
  status: string; message?: string | null; retryCount: number; createdAt: string;
}

export default function TasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pwOk, setPwOk] = useState(true);
  const [links, setLinks] = useState("");
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

  const submit = async () => {
    setMsg("");
    const urls = links
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!urls.length) {
      setMsg("请粘贴至少一条商品链接");
      setMsgOk(false);
      return;
    }
    let created = 0;
    let firstError = "";
    for (const url of urls) {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) created++;
      else if (!firstError) firstError = data.error ?? "创建失败";
    }
    setLinks("");
    if (created) {
      setMsg(`已创建 ${created} 个任务`);
      setMsgOk(true);
      toast(`已创建 ${created} 个任务`, "success");
    }
    if (firstError) {
      setMsg(firstError);
      setMsgOk(false);
    }
    load();
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
        当前只做<strong className="font-medium">链接解析</strong>：打开你粘贴的商品链接，读页面自带的 og / JSON-LD 元数据（标题、价格、封面）。不猜 DOM 结构、不靠登录态，但拿不到佣金率与日销，那两项仍需在精选联盟后台看。
      </div>

      {!pwOk && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning">
          Playwright 浏览器未安装。运行 <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">npx playwright install chromium</code> 后重启。此问题不影响其他功能。
        </div>
      )}

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
          <Label htmlFor="links">商品链接（每行一条）</Label>
        </div>
        <textarea
          id="links"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={4}
          placeholder={"https://haohuo.jinritemai.com/views/product/detail?id=...\nhttps://..."}
          className="w-full rounded-lg border border-line bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none transition-all duration-200 ease-out-expo placeholder:text-white/30 focus:border-accent/60 focus:bg-white/[0.07] focus:ring-1 focus:ring-accent/30"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-fg-2">只读页面自带的标题 / 价格 / 封面，缺的字段会写在任务结果里</p>
          <Button onClick={submit}>解析</Button>
        </div>
      </Card>

      {msg && <p className={`text-sm ${msgOk ? "text-success" : "text-danger"}`}>{msg}</p>}

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-2">任务列表</h2>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <Reveal key={t.id} delay={Math.min(i % 8, 7) * 50}>
              <Spotlight>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-surface px-3.5 py-2.5 text-sm transition-colors duration-150 hover:border-white/10">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div className="break-all font-medium text-fg">{t.url ?? `任务 #${t.id}`}</div>
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
            <EmptyState title="暂无任务" description="粘贴商品链接后会逐条解析；识别不出标题的会标为失败并写明原因" />
          )}
        </div>
      </section>
    </div>
  );
}
