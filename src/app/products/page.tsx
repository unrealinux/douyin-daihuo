"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Card, Input, Select } from "@/components/ui";

interface Product {
  id: number; name: string; category?: string | null; price?: number | null;
  commissionRate?: number | null; dailySales?: number | null; status: string;
  trend: string; source: string;
  _count?: { scriptIdeas: number; assets: number };
}

const EMPTY: Product[] = [];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(EMPTY);
  const [status, setStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("updatedAt");
  const [order, setOrder] = useState("desc");
  const [del, setDel] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchMsg, setBatchMsg] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (status !== "ALL") q.set("status", status);
    if (keyword) q.set("keyword", keyword);
    q.set("sort", sort);
    q.set("order", order);
    const res = await fetch(`/api/products?${q.toString()}`);
    if (res.ok) setProducts(await res.json());
  }, [status, keyword, sort, order]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!del) return;
    await fetch(`/api/products/${del.id}`, { method: "DELETE" });
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
    setBatchMsg("");
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
        setBatchMsg(data.error ?? "批量生成失败");
      } else {
        const ok = (data as Array<{ ok: boolean }>).filter((r) => r.ok).length;
        const fail = (data as Array<{ ok: boolean }>).length - ok;
        setBatchMsg(`批量完成：成功 ${ok}，失败 ${fail}`);
        setSelected(new Set());
        load();
      }
    } catch (e) {
      setBatchMsg(String(e));
    }
    setBatchLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">商品库</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/products/import"><Button variant="secondary">CSV 导入</Button></Link>
          <Link href="/products/tasks"><Button variant="secondary">爬虫任务</Button></Link>
          <Link href="/products/new"><Button>新增商品</Button></Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">全部状态</option>
          <option value="CANDIDATE">候选</option>
          <option value="FOLLOWING">跟进</option>
          <option value="SELECTED">已选</option>
          <option value="DROPPED">放弃</option>
        </Select>
        <Input placeholder="搜索名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="w-48" />
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updatedAt">更新时间</option>
          <option value="commissionRate">佣金率</option>
          <option value="dailySales">销量</option>
        </Select>
        <Select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </Select>
        <Button variant="ghost" onClick={toggleAll} disabled={products.length === 0}>
          {selected.size === products.length && products.length > 0 ? "取消全选" : "全选"}
        </Button>
        <Button onClick={batchGenerate} disabled={selected.size === 0 || batchLoading}>
          {batchLoading ? "批量生成中..." : `批量生成${selected.size ? ` (${selected.size})` : ""}`}
        </Button>
        {batchMsg && (
          <span className="text-sm text-white/70">
            {batchMsg}
            {batchMsg.startsWith("批量完成") && (
              <> · <Link href="/scripts" className="text-cyan-300 hover:underline">查看脚本</Link></>
            )}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} hover className={`p-4 ${selected.has(p.id) ? "border-accent/50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <label className="flex min-w-0 items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
                <Link href={`/products/${p.id}`} className="font-medium text-fg hover:text-accent">{p.name}</Link>
              </label>
              <StatusBadge status={p.status} />
            </div>
            <div className="tnum mt-2 space-y-1 text-sm text-white/60">
              <div>类目: {p.category ?? "-"} · 价格: {p.price != null ? `¥${p.price}` : "-"}</div>
              <div>佣金率: {p.commissionRate != null ? `${p.commissionRate}%` : "-"} · 近30天销量: {p.dailySales ?? "-"}</div>
              <div>趋势: <StatusBadge status={p.trend} /> · 脚本 {p._count?.scriptIdeas ?? 0} · 素材 {p._count?.assets ?? 0}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={`/products/${p.id}`}><Button variant="ghost">编辑</Button></Link>
              <Link href={`/scripts/generate?productId=${p.id}`}><Button variant="ghost">生成文案</Button></Link>
              <Button variant="danger" onClick={() => setDel(p)}>删除</Button>
            </div>
          </Card>
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-16 text-center text-white/40">暂无商品</div>
        )}
      </div>

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
