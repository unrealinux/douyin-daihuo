"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

interface Stats {
  productCount: number;
  noScriptCount: number;
  weekSchedules: number;
  recentPublished: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setStats);
  }, []);

  const cards = stats ? [
    { label: "商品总数", value: stats.productCount, href: "/products" },
    { label: "待生成脚本", value: stats.noScriptCount, href: "/scripts/generate" },
    { label: "本周排期", value: stats.weekSchedules, href: "/assets" },
    { label: "近7天已发布", value: stats.recentPublished, href: "/assets" },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>
      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card hover className="p-4">
                <div className="text-sm text-white/60">{c.label}</div>
                <div className="tnum mt-1 text-3xl font-bold text-fg">{c.value}</div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      )}

      <Card className="p-4 text-sm text-white/60">
        <p className="font-semibold text-fg">使用流程</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li><Link href="/products/new" className="text-cyan-300 hover:underline">录入/导入商品</Link>，或用<a href="/products/tasks" className="text-cyan-300 hover:underline">爬虫</a>抓取</li>
          <li>在<a href="/scripts/generate" className="text-cyan-300 hover:underline">脚本文案</a>页面批量生成文案</li>
          <li>在<a href="/assets" className="text-cyan-300 hover:underline">素材排期</a>上传视频并安排发布</li>
          <li>发布后在排期里回填抖音链接</li>
        </ol>
      </Card>
    </div>
  );
}
