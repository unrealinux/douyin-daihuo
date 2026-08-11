"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Button, Input, Label, Select } from "@/components/ui";

interface Product {
  id: number; name: string; url?: string | null; category?: string | null;
  price?: number | null; commissionRate?: number | null; dailySales?: number | null;
  status: string; trend: string; note?: string | null;
  scriptIdeas: { id: number; title?: string | null; status: string; createdAt: string }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then((data) => {
      setP(data);
      setForm({
        name: data.name, url: data.url ?? "", category: data.category ?? "",
        price: data.price ?? "", commissionRate: data.commissionRate ?? "",
        dailySales: data.dailySales ?? "", status: data.status, trend: data.trend, note: data.note ?? "",
      });
    });
  }, [id]);

  if (!p || !form) return <p>加载中...</p>;

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, url: form.url || undefined, category: form.category || undefined,
        price: form.price ? Number(form.price) : null,
        commissionRate: form.commissionRate ? Number(form.commissionRate) : null,
        dailySales: form.dailySales ? Number(form.dailySales) : null,
        status: form.status, trend: form.trend, note: form.note || undefined,
      }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{p.name}</h1>
        <StatusBadge status={p.status} />
      </div>

      <div className="grid max-w-lg gap-4">
        <div><Label>商品名称</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><Label>链接</Label><Input value={form.url} onChange={(e) => set("url", e.target.value)} /></div>
        <div><Label>类目</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>价格</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
          <div><Label>佣金率 %</Label><Input type="number" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} /></div>
          <div><Label>销量</Label><Input type="number" value={form.dailySales} onChange={(e) => set("dailySales", e.target.value)} /></div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label>状态</Label>
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="CANDIDATE">候选</option>
              <option value="FOLLOWING">跟进</option>
              <option value="SELECTED">已选</option>
              <option value="DROPPED">放弃</option>
            </Select>
          </div>
          <div className="flex-1">
            <Label>趋势</Label>
            <Select value={form.trend} onChange={(e) => set("trend", e.target.value)}>
              <option value="UP">上升</option>
              <option value="STEADY">平稳</option>
              <option value="DOWN">下降</option>
            </Select>
          </div>
        </div>
        <div><Label>备注</Label><Input value={form.note} onChange={(e) => set("note", e.target.value)} /></div>
        <div className="flex gap-2">
          <Button onClick={save}>保存</Button>
          <Link href={`/scripts/generate?productId=${p.id}`}><Button variant="secondary">生成文案</Button></Link>
        </div>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">已生成脚本（{p.scriptIdeas.length}）</h2>
        <div className="space-y-2">
          {p.scriptIdeas.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
              <Link href={`/scripts?id=${s.id}`} className="hover:text-accent">{s.title ?? `脚本 #${s.id}`}</Link>
              <StatusBadge status={s.status} />
            </div>
          ))}
          {p.scriptIdeas.length === 0 && <p className="text-sm text-gray-400">暂无脚本</p>}
        </div>
      </section>
    </div>
  );
}
