"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorBanner, Skeleton } from "@/components/PageChrome";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
          <p className="mt-1 text-sm text-fg-2">抓品 → 文案 → 素材 → 排期，一条龙本地助手</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/products/new"><Button>新增商品</Button></Link>
          <Link href="/scripts/generate"><Button variant="secondary">生成脚本</Button></Link>
          <Link href="/assets"><Button variant="secondary">上传素材</Button></Link>
        </div>
      </div>

      {err && <ErrorBanner message={err} onRetry={load} />}

      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card hover className="h-full p-4">
                <div className="text-sm text-fg-2">{c.label}</div>
                <div className="tnum mt-1 text-3xl font-bold text-fg">{c.value}</div>
                <div className="mt-2 text-xs text-cyan-300">{c.hint} →</div>
              </Card>
            </Link>
          ))}
        </div>
      ) : !err ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : null}

      <Card className="p-4 text-sm text-fg-2">
        <p className="font-semibold text-fg">使用流程</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            <Link href="/products/new" className="text-cyan-300 hover:underline">录入/导入商品</Link>
            ，或用 <Link href="/products/tasks" className="text-cyan-300 hover:underline">爬虫</Link> 抓取
          </li>
          <li>
            在商品库多选后批量生成，或到{" "}
            <Link href="/scripts/generate" className="text-cyan-300 hover:underline">脚本文案</Link> 单条生成
          </li>
          <li>
            在 <Link href="/assets" className="text-cyan-300 hover:underline">素材排期</Link> 上传视频并安排发布
          </li>
          <li>发布后在排期里回填抖音链接</li>
        </ol>
      </Card>
    </div>
  );
}
