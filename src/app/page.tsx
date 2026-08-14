"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { Button, Card } from "@/components/ui";

interface Stats {
  productCount: number;
  noScriptCount: number;
  weekSchedules: number;
  recentPublished: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  const load = () => {
    setErr("");
    fetch("/api/dashboard")
      .then(async (r) => {
        if (!r.ok) throw new Error("加载仪表盘失败");
        return r.json();
      })
      .then(setStats)
      .catch((e) => setErr(String(e)));
  };

  useEffect(() => { load(); }, []);

  const cards = stats ? [
    { label: "商品总数", value: stats.productCount, href: "/products", hint: "管理选品" },
    { label: "待生成脚本", value: stats.noScriptCount, href: "/scripts/generate", hint: "去生成文案" },
    { label: "本周排期", value: stats.weekSchedules, href: "/assets", hint: "查看排期" },
    { label: "近7天已发布", value: stats.recentPublished, href: "/assets", hint: "发布记录" },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="仪表盘"
        description="抓品 → 文案 → 素材 → 排期"
        actions={
          <>
            <Link href="/products/new"><Button>新增商品</Button></Link>
            <Link href="/scripts/generate"><Button variant="secondary">生成脚本</Button></Link>
            <Link href="/assets"><Button variant="ghost">上传素材</Button></Link>
          </>
        }
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      {stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((c, i) => (
            <Link key={c.label} href={c.href} className="group animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <Card hover className={`h-full p-4 ${i === 0 ? "border-accent/25 bg-gradient-to-b from-accent/[0.07] to-surface" : ""}`}>
                <div className="text-xs text-fg-2">{c.label}</div>
                <div className={`tnum mt-1 text-3xl font-semibold tracking-tight ${i === 0 ? "text-accent" : "text-fg"}`}>{c.value}</div>
                <div className="mt-2 flex items-center gap-0.5 text-xs text-fg-2 transition-colors duration-200 group-hover:text-white">
                  {c.hint}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : !err ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : null}

      <Card className="animate-fade-up p-5" >
        <p className="text-[15px] font-medium text-fg">使用流程</p>
        <ol className="mt-4 grid gap-2.5 pl-5 text-sm text-fg-2">
          <li>
            <Link href="/products/new" className="text-fg hover:text-accent">录入/导入商品</Link>
            ，或用 <Link href="/products/tasks" className="text-fg hover:text-accent">爬虫</Link> 抓取
          </li>
          <li>
            在商品库多选后批量生成，或到{" "}
            <Link href="/scripts/generate" className="text-fg hover:text-accent">脚本文案</Link> 单条生成
          </li>
          <li>
            在 <Link href="/assets" className="text-fg hover:text-accent">素材排期</Link> 上传视频并安排发布
          </li>
          <li>发布后在排期里回填抖音链接</li>
        </ol>
      </Card>
    </div>
  );
}
