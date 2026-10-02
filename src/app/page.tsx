"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { Button, Card } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";
import StatusBadge from "@/components/StatusBadge";
import { isOverdue } from "@/lib/scheduleUtils";

interface Stats {
  productCount: number;
  noScriptCount: number;
  weekSchedules: number;
  recentPublished: number;
  perfSummary: {
    count: number; views: number; likes: number; comments: number; shares: number;
    favorites: number; orderCount: number; gmv: number; commission: number;
  };
  pendingSchedules: Array<{
    id: number; scheduledAt: string; publishStatus: string;
    asset?: { id: number; title?: string | null; fileName: string } | null;
  }>;
}

const STEPS = [
  {
    title: "录入 / 导入商品",
    desc: "手动新增、CSV 批量导入，或用爬虫自动抓取商品",
    href: "/products/new",
    action: "去录入",
    icon: "M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7M12 10v9M8 15l4 4 4-4",
  },
  {
    title: "生成口播文案",
    desc: "在商品库多选批量生成，或按风格 / 时长单条定制",
    href: "/scripts/generate",
    action: "去生成",
    icon: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  },
  {
    title: "上传素材排期",
    desc: "上传视频并关联商品脚本，按预设时间安排发布",
    href: "/assets",
    action: "去排期",
    icon: "M15 10l4.5-2.5v9L15 14M3 20h18M5 4v16M9 4v16",
  },
  {
    title: "回填发布链接",
    desc: "发布后在排期时间线里回填抖音链接，沉淀记录",
    href: "/assets",
    action: "去回填",
    icon: "M13.5 10.5L21 3M21 3h-6M21 3v6M8.5 5.5a6 6 0 0 1 8.4 8.4l-8 8a6 6 0 0 1-8.4-8.4l8-8z",
  },
];

const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });

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
    { label: "商品总数", value: stats.productCount, href: "/products", hint: "管理选品", icon: "M6 2h12l3 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7l3-5z", accent: true },
    { label: "待生成脚本", value: stats.noScriptCount, href: "/scripts/generate", hint: "去生成文案", icon: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z", accent: false },
    { label: "本周排期", value: stats.weekSchedules, href: "/assets", hint: "查看排期", icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", accent: false },
    { label: "近7天已发布", value: stats.recentPublished, href: "/assets", hint: "发布记录", icon: "M22 11.1V12a10 10 0 1 1-5.93-9.14M22 4L12 14l-3-3", accent: false },
  ] : [];

  return (
    <div className="space-y-8">
      <Reveal>
        <PageHeader
          title="仪表盘"
          description="抓品 → 文案 → 素材 → 排期，一条龙管理你的带货内容"
          actions={
            <>
              <Link href="/products/new"><Button>新增商品</Button></Link>
              <Link href="/scripts/generate"><Button variant="secondary">生成脚本</Button></Link>
              <Link href="/assets"><Button variant="ghost">上传素材</Button></Link>
            </>
          }
        />
      </Reveal>

      {err && <ErrorBanner message={err} onRetry={load} />}

      {stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={i * 70}>
              <Link href={c.href} className="block h-full">
                <Spotlight className="h-full">
                  <Card hover className={`h-full p-4 ${c.accent ? "border-accent/25 bg-gradient-to-b from-accent/[0.08] to-surface" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-fg-2">{c.label}</div>
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.accent ? "bg-accent/15 text-accent" : "bg-white/5 text-fg-2"}`}>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d={c.icon} />
                        </svg>
                      </div>
                    </div>
                    <div className={`tnum mt-2 text-4xl font-semibold tracking-tight ${c.accent ? "text-accent" : "text-fg"}`}>
                      <CountUp value={c.value} />
                    </div>
                    <div className="mt-2 flex items-center gap-0.5 text-xs text-fg-2 transition-colors duration-200 group-hover/spot:text-white">
                      {c.hint}
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform duration-200 group-hover/spot:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </div>
                  </Card>
                </Spotlight>
              </Link>
            </Reveal>
          ))}
        </div>
      ) : !err ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : null}

      {stats && stats.pendingSchedules.length > 0 && (
        <Reveal delay={90}>
          <Card className="p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight">待发布提醒</h2>
              <span className="text-xs text-fg-2">已到期或 24h 内计划发布</span>
            </div>
            <div className="space-y-1.5">
              {stats.pendingSchedules.map((s) => {
                const overdue = isOverdue(s);
                const title = s.asset?.title ?? s.asset?.fileName ?? "素材已删除";
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-white/[0.02] px-3.5 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className={`tnum font-medium ${overdue ? "text-danger" : "text-fg"}`}>{new Date(s.scheduledAt).toLocaleString()}</span>
                      <span className={`ml-3 ${overdue ? "text-danger/80" : "text-fg-2"}`}>{title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.publishStatus} />
                      <Link href="/assets"><Button variant="ghost" className="text-xs">去排期</Button></Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      )}

      {stats && (
        <Reveal delay={140}>
          <Card className="p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight">效果追踪</h2>
              <span className="text-xs text-fg-2">在「素材排期」标记发布后回填数据</span>
            </div>
            {stats.perfSummary.count > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: "已测内容", display: fmt(stats.perfSummary.count) },
                  { label: "总播放", display: fmt(stats.perfSummary.views) },
                  { label: "总点赞", display: fmt(stats.perfSummary.likes) },
                  { label: "成交单", display: fmt(stats.perfSummary.orderCount) },
                  { label: "累计 GMV", display: `¥${fmt(stats.perfSummary.gmv)}` },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-line/60 bg-white/[0.02] p-3">
                    <div className="text-xs text-fg-2">{m.label}</div>
                    <div className="tnum mt-1 text-xl font-semibold text-fg">{m.display}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无效果数据"
                description="发布素材后，在「素材排期」页面标记发布并填写效果"
                actionHref="/assets"
                actionLabel="去填写"
              />
            )}
          </Card>
        </Reveal>
      )}

      <Reveal delay={180}>
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">工作流程</h2>
            <span className="text-xs text-fg-2">从选品到发布的完整链路</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <Link href={s.href} className="block h-full">
                  <Spotlight className="h-full">
                    <Card hover className="flex h-full flex-col p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d={s.icon} />
                          </svg>
                        </div>
                        <span className="tnum text-2xl font-semibold text-white/10">0{i + 1}</span>
                      </div>
                      <h3 className="mt-3 text-[15px] font-medium text-fg">{s.title}</h3>
                      <p className="mt-1 flex-1 text-sm leading-relaxed text-fg-2">{s.desc}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm text-accent transition-transform duration-200 group-hover/spot:translate-x-0.5">
                        {s.action}
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </Card>
                  </Spotlight>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
