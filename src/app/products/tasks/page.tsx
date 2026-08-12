"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Button, Card, Input, Label } from "@/components/ui";

interface Task {
  id: number; type: string; keyword?: string | null; url?: string | null;
  status: string; message?: string | null; retryCount: number; createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pwOk, setPwOk] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks);
    setPwOk(data.playwright?.installed);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (type: "KEYWORD" | "LINK") => {
    setMsg("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type === "KEYWORD" ? { keyword } : { url: link }),
    });
    const data = await res.json();
    if (res.ok) {
      setKeyword(""); setLink("");
      setMsg(`任务 #${data.id} 已创建`);
      setTimeout(load, 1500);
    } else {
      setMsg(data.error ?? "创建失败");
    }
  };

  const retry = async (id: number) => {
    await fetch(`/api/tasks/${id}/retry`, { method: "POST" });
    setTimeout(load, 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">爬虫任务</h1>
        <Link href="/products"><span className="text-sm text-cyan-300 hover:underline">返回商品库</span></Link>
      </div>

      {!pwOk && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Playwright 浏览器未安装。运行 <code className="rounded bg-black/30 px-1">npx playwright install chromium</code> 后重启。此问题不影响其他功能。
        </div>
      )}

      <Card className="space-y-3 p-4">
        <Label>关键词搜索</Label>
        <div className="flex gap-2">
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例如：厨房 收纳 爆款" />
          <Button onClick={() => submit("KEYWORD")}>抓取</Button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <Label>链接抓取</Label>
        <div className="flex gap-2">
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          <Button onClick={() => submit("LINK")}>抓取</Button>
        </div>
      </Card>

      {msg && <p className="text-sm text-white/60">{msg}</p>}

      <section>
        <h2 className="mb-2 font-semibold">任务列表</h2>
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-fg">
                  {t.type === "KEYWORD" ? `关键词: ${t.keyword}` : `链接: ${t.url}`}
                </div>
                <div className="tnum text-xs text-white/50">
                  {new Date(t.createdAt).toLocaleString()} · 重试 {t.retryCount} 次
                </div>
                {t.message && <div className="text-xs text-white/60">{t.message}</div>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {t.status === "FAILED" && <Button variant="ghost" className="text-xs" onClick={() => retry(t.id)}>重试</Button>}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="py-6 text-center text-sm text-white/40">暂无任务</div>}
        </div>
      </section>
    </div>
  );
}