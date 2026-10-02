"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { Button, Card, Select } from "@/components/ui";
import Reveal from "@/components/Reveal";
import { sortAggregateRows, summarizeAggregates, type AggregateRow, type InsightSort } from "@/lib/insightsUtils";

type Dimension = "track" | "platform" | "account" | "product" | "style";

const DIMENSIONS: Array<{ key: Dimension; label: string }> = [
  { key: "track", label: "赛道" },
  { key: "platform", label: "平台" },
  { key: "account", label: "账号" },
  { key: "product", label: "商品" },
  { key: "style", label: "风格" },
];

const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
const rate = (v: number | null) => (v == null ? "-" : `${v}%`);

function rateClass(v: number | null, pass: number): string {
  if (v == null) return "text-fg-2";
  return v >= pass ? "text-success" : "text-warning";
}

export default function InsightsPage() {
  const [dimension, setDimension] = useState<Dimension>("track");
  const [rows, setRows] = useState<AggregateRow[]>([]);
  const [sort, setSort] = useState<InsightSort>("gmv");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`/api/insights?dimension=${dimension}`);
      if (!res.ok) throw new Error("加载洞察失败");
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dimension]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => sortAggregateRows(rows, sort), [rows, sort]);
  const summary = useMemo(() => summarizeAggregates(rows), [rows]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="效果洞察"
        description="按赛道 / 平台 / 账号 / 商品 / 风格对比内容表现"
        actions={<Link href="/assets"><Button variant="secondary">去回填数据</Button></Link>}
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line/60 bg-surface/60 p-2.5 backdrop-blur">
        <div className="inline-flex rounded-full border border-line bg-surface/80 p-1">
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDimension(d.key)}
              className={`rounded-full px-3 py-1 text-sm transition-all duration-200 ease-out-expo active:scale-[0.98] ${
                dimension === d.key ? "bg-accent text-white shadow-accent" : "text-fg-2 hover:bg-white/5 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value as InsightSort)} className="w-full sm:w-40">
          <option value="gmv">按 GMV</option>
          <option value="commission">按佣金</option>
          <option value="views">按播放</option>
          <option value="conversion">按转化率</option>
          <option value="posts">按内容数</option>
        </Select>
        <span className="ml-auto text-xs text-fg-2">已测内容 {summary?.posts ?? 0} 条</span>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "总播放", value: fmt(summary.views) },
            { label: "平均播放", value: fmt(summary.avgViews) },
            { label: "总成交单", value: fmt(summary.orderCount) },
            { label: "总 GMV", value: `¥${fmt(summary.gmv)}` },
            { label: "总佣金", value: `¥${fmt(summary.commission)}` },
            { label: "整体转化率", value: rate(summary.conversionRate) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-line/60 bg-white/[0.02] p-3">
              <div className="text-xs text-fg-2">{m.label}</div>
              <div className="tnum mt-1 text-lg font-semibold text-fg">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="暂无可对比的数据"
          description="在素材排期页标记发布并回填播放/完播率/成交后，这里会自动按维度聚合"
          actionHref="/assets"
          actionLabel="去回填"
        />
      ) : (
        <Reveal>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line/60 text-left text-xs text-fg-2">
                  <th className="px-4 py-3 font-medium">{DIMENSIONS.find((d) => d.key === dimension)?.label}</th>
                  <th className="px-3 py-3 text-right font-medium">内容</th>
                  <th className="px-3 py-3 text-right font-medium">播放</th>
                  <th className="px-3 py-3 text-right font-medium">均播</th>
                  <th className="px-3 py-3 text-right font-medium">完播率</th>
                  <th className="px-3 py-3 text-right font-medium">3秒播放率</th>
                  <th className="px-3 py-3 text-right font-medium">成交</th>
                  <th className="px-3 py-3 text-right font-medium">转化率</th>
                  <th className="px-3 py-3 text-right font-medium">GMV</th>
                  <th className="px-4 py-3 text-right font-medium">佣金</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.group} className="border-b border-line/40 transition-colors duration-150 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-fg">{r.label}</td>
                    <td className="tnum px-3 py-3 text-right text-fg-2">{r.posts}</td>
                    <td className="tnum px-3 py-3 text-right">{fmt(r.views)}</td>
                    <td className="tnum px-3 py-3 text-right text-fg-2">{fmt(r.avgViews)}</td>
                    <td className={`tnum px-3 py-3 text-right ${rateClass(r.avgCompletionRate, 20)}`}>{rate(r.avgCompletionRate)}</td>
                    <td className={`tnum px-3 py-3 text-right ${rateClass(r.avgThreeSecRate, 30)}`}>{rate(r.avgThreeSecRate)}</td>
                    <td className="tnum px-3 py-3 text-right">{fmt(r.orderCount)}</td>
                    <td className="tnum px-3 py-3 text-right">{rate(r.conversionRate)}</td>
                    <td className="tnum px-3 py-3 text-right">¥{fmt(r.gmv)}</td>
                    <td className="tnum px-4 py-3 text-right text-accent">¥{fmt(r.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
