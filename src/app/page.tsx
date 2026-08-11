"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <h1 className="text-xl font-bold">仪表盘</h1>
      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.label} href={c.href} className="rounded border bg-white p-4 hover:shadow">
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="mt-1 text-2xl font-bold">{c.value}</div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">加载中...</p>
      )}

      <div className="rounded border bg-white p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-900">使用流程</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li><Link href="/products/new" className="text-blue-600 hover:underline">录入/导入商品</Link>，或用<a href="/products/tasks" className="text-blue-600 hover:underline">爬虫</a>抓取</li>
          <li>在<a href="/scripts/generate" className="text-blue-600 hover:underline">脚本文案</a>页面批量生成文案</li>
          <li>在<a href="/assets" className="text-blue-600 hover:underline">素材排期</a>上传视频并安排发布</li>
          <li>发布后在排期里回填抖音链接</li>
        </ol>
      </div>
    </div>
  );
}
