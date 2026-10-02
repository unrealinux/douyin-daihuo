"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";
import { PLATFORM_LABEL, TRACKS, evaluateProduct } from "@/lib/selectionUtils";

interface Product {
  id: number; name: string; url?: string | null; category?: string | null;
  price?: number | null; commissionRate?: number | null; dailySales?: number | null;
  status: string; trend: string; note?: string | null; track?: string | null; platform?: string | null;
  scriptIdeas: { id: number; title?: string | null; status: string; createdAt: string }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [p, setP] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLoading(false);
        if (!data || typeof data.id !== "number") {
          setP(null);
          return;
        }
        setP(data);
        setForm({
          name: data.name, url: data.url ?? "", category: data.category ?? "",
          price: data.price ?? "", commissionRate: data.commissionRate ?? "",
          dailySales: data.dailySales ?? "", status: data.status, trend: data.trend, note: data.note ?? "",
          track: data.track ?? "", platform: data.platform ?? "",
        });
      });
  }, [id]);

  if (loading) return <div className="h-48 animate-pulse rounded-lg bg-white/5" />;

  if (!p || !form) return <p className="text-white/40">商品不存在或已被删除</p>;

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const score = evaluateProduct({
    price: form.price !== "" ? Number(form.price) : undefined,
    commissionRate: form.commissionRate !== "" ? Number(form.commissionRate) : undefined,
    dailySales: form.dailySales !== "" ? Number(form.dailySales) : undefined,
  });

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, url: form.url || undefined, category: form.category || undefined,
        price: form.price ? Number(form.price) : null,
        commissionRate: form.commissionRate ? Number(form.commissionRate) : null,
        dailySales: form.dailySales ? Number(form.dailySales) : null,
        status: form.status, trend: form.trend, note: form.note || undefined,
        track: form.track || null, platform: (form.platform || null) as never,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setP({ ...updated, scriptIdeas: updated.scriptIdeas ?? p.scriptIdeas ?? [] });
      setForm({
        name: updated.name, url: updated.url ?? "", category: updated.category ?? "",
        price: updated.price ?? "", commissionRate: updated.commissionRate ?? "",
        dailySales: updated.dailySales ?? "", status: updated.status, trend: updated.trend, note: updated.note ?? "",
        track: updated.track ?? "", platform: updated.platform ?? "",
      });
      toast("已保存", "success");
    } else {
      toast("保存失败", "danger");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-fg md:text-3xl">{p.name}</h1>
            <p className="mt-1 text-sm text-fg-2">编辑商品信息并跟踪脚本产出</p>
          </div>
          <StatusBadge status={p.status} />
        </div>
      </Reveal>

      <Reveal delay={70}>
        <Spotlight>
          <Card className="max-w-lg space-y-4 p-5">
            <div><Label>商品名称</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><Label>链接</Label><Input value={form.url} onChange={(e) => set("url", e.target.value)} /></div>
        <div><Label>类目</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>赛道</Label>
            <Select value={form.track} onChange={(e) => set("track", e.target.value)}>
              <option value="">未指定</option>
              {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label>目标平台</Label>
            <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
              <option value="">未指定</option>
              {Object.entries(PLATFORM_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <div className="rounded-lg border border-line/60 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-2">选品评分（SOP 四大标准）</span>
            <span className={`tnum text-lg font-semibold ${score.grade === "A" ? "text-success" : score.grade === "B" ? "text-accent" : "text-fg-2"}`}>
              {score.grade} · {score.score}
            </span>
          </div>
          {score.unitCommission != null && <p className="mt-1 text-xs text-fg-2">单笔预估佣金 ¥{score.unitCommission}</p>}
          {score.highlights.map((h) => <p key={h} className="mt-1 text-xs text-success">✓ {h}</p>)}
          {score.warnings.map((w) => <p key={w} className="mt-1 text-xs text-warning">! {w}</p>)}
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          <Link href={`/scripts/generate?productId=${p.id}`}><Button variant="secondary">生成文案</Button></Link>
        </div>
          </Card>
        </Spotlight>
      </Reveal>

      <Reveal delay={140}>
        <section>
          <h2 className="mb-3 text-sm font-medium text-fg-2">已生成脚本（{p.scriptIdeas.length}）</h2>
          <div className="space-y-2">
            {p.scriptIdeas.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-line/60 bg-surface px-3.5 py-2.5 transition-colors duration-150 hover:border-white/10">
                <Link href={`/scripts?id=${s.id}`} className="text-fg transition-colors duration-150 hover:text-accent">{s.title ?? `脚本 #${s.id}`}</Link>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {p.scriptIdeas.length === 0 && <p className="text-sm text-fg-2">暂无脚本</p>}
          </div>
        </section>
      </Reveal>
    </div>
  );
}