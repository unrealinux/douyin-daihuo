"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, Select } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";

interface Product {
  id: number; name: string; category?: string | null; price?: number | null;
  commissionRate?: number | null; dailySales?: number | null; status: string;
  trend: string; source: string;
  _count?: { scriptIdeas: number; assets: number };
}

const EMPTY: Product[] = [];

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>(EMPTY);
  const [status, setStatus] = useState("ALL");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("updatedAt");
  const [order, setOrder] = useState("desc");
  const [del, setDel] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setKeyword(keywordInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [keywordInput]);

  const load = useCallback(async () => {
    setErr("");
    try {
      const q = new URLSearchParams();
      if (status !== "ALL") q.set("status", status);
      if (keyword) q.set("keyword", keyword);
      q.set("sort", sort);
      q.set("order", order);
      const res = await fetch(`/api/products?${q.toString()}`);
      if (!res.ok) throw new Error("加载商品失败");
      setProducts(await res.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [status, keyword, sort, order]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const confirmDelete = async () => {
    if (!del) return;
    const res = await fetch(`/api/products/${del.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("删除失败", "danger");
      return;
    }
    toast("商品已删除", "success");
    setDel(null);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(del.id);
      return next;
    });
    load();
  };

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const batchGenerate = async () => {
    if (selected.size === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/scripts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selected),
          style: "SPOKEN",
          durationSec: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "批量生成失败", "danger");
      } else {
        const ok = (data as Array<{ ok: boolean }>).filter((r) => r.ok).length;
        const fail = (data as Array<{ ok: boolean }>).length - ok;
        toast(`批量完成：成功 ${ok}，失败 ${fail}`, fail ? "info" : "success");
        setSelected(new Set());
        load();
      }
    } catch (e) {
      toast(String(e), "danger");
    }
    setBatchLoading(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="商品库"
        description="筛选、跟进，再批量生成口播文案"
        actions={
          <>
            <Link href="/products/import"><Button variant="ghost">CSV 导入</Button></Link>
            <Link href="/products/tasks"><Button variant="secondary">爬虫任务</Button></Link>
            <Link href="/products/new"><Button>新增商品</Button></Link>
          </>
        }
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line/60 bg-surface/60 p-2.5 backdrop-blur">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">全部状态</option>
          <option value="CANDIDATE">候选</option>
          <option value="FOLLOWING">跟进</option>
          <option value="SELECTED">已选</option>
          <option value="DROPPED">放弃</option>
        </Select>
        <Input
          placeholder="搜索名称"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          className="w-full sm:w-48"
        />
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updatedAt">更新时间</option>
          <option value="commissionRate">佣金率</option>
          <option value="dailySales">销量</option>
        </Select>
        <Select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </Select>
        <span className="hidden h-5 w-px bg-line/70 lg:block" aria-hidden />
        <Button variant="ghost" onClick={toggleAll} disabled={products.length === 0}>
          {selected.size === products.length && products.length > 0 ? "取消全选" : "全选"}
        </Button>
        <Button onClick={batchGenerate} disabled={selected.size === 0 || batchLoading}>
          {batchLoading ? "批量生成中..." : `批量生成${selected.size ? ` (${selected.size})` : ""}`}
        </Button>
        {selected.size > 0 && !batchLoading && (
          <Link href="/scripts" className="text-sm text-fg-2 hover:text-accent">查看脚本</Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i % 6, 5) * 60}>
              <Spotlight className="h-full">
                <Card hover className={`h-full p-4 ${selected.has(p.id) ? "border-accent/50 shadow-accent" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex min-w-0 items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded accent-accent"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                      <Link href={`/products/${p.id}`} className="text-[15px] font-medium text-fg transition-colors duration-150 hover:text-accent">{p.name}</Link>
                    </label>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="tnum mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-fg-2">
                    <div>类目 {p.category ?? "-"}</div>
                    <div>价格 {p.price != null ? `¥${p.price}` : "-"}</div>
                    <div>佣金 {p.commissionRate != null ? `${p.commissionRate}%` : "-"}</div>
                    <div>近30天 {p.dailySales ?? "-"}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-fg-2">
                    <StatusBadge status={p.trend} />
                    <span className="tnum">脚本 {p._count?.scriptIdeas ?? 0} · 素材 {p._count?.assets ?? 0}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/50 pt-3">
                    <Link href={`/scripts/generate?productId=${p.id}`}><Button>生成文案</Button></Link>
                    <Link href={`/products/${p.id}`}><Button variant="ghost">编辑</Button></Link>
                    <Button variant="ghost" className="ml-auto text-danger/80 hover:bg-danger/10 hover:text-danger" onClick={() => setDel(p)}>删除</Button>
                  </div>
                </Card>
              </Spotlight>
            </Reveal>
          ))}
          {products.length === 0 && (
            <EmptyState
              title="暂无商品"
              description="手动新增、CSV 导入或用爬虫抓取"
              actionHref="/products/new"
              actionLabel="新增商品"
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!del}
        title="删除商品"
        message={`确定删除「${del?.name ?? ""}」？关联的脚本将保留但解除关联。`}
        onConfirm={confirmDelete}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
