"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";
import { PLATFORM_LABEL, TRACKS, evaluateProduct } from "@/lib/selectionUtils";

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", url: "", category: "", price: "", commissionRate: "", dailySales: "", note: "", track: "图书", platform: "VIDEO_ACCOUNT" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const score = evaluateProduct({
    price: form.price ? Number(form.price) : undefined,
    commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
    dailySales: form.dailySales ? Number(form.dailySales) : undefined,
  });

  const submit = async () => {
    if (!form.name.trim()) {
      setErr("请填写商品名称");
      return;
    }
    setErr("");
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          url: form.url || undefined,
          category: form.category || undefined,
          price: form.price ? Number(form.price) : undefined,
          commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
          dailySales: form.dailySales ? Number(form.dailySales) : undefined,
          track: form.track || null,
          platform: (form.platform || null) as never,
          note: form.note || undefined,
        }),
      });
      if (res.ok) {
        const p = await res.json();
        toast("商品已创建", "success");
        router.push(`/products/${p.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error ?? "保存失败");
      }
    } catch (e) {
      setErr(String(e));
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Reveal>
        <PageHeader
          title="新增商品"
          description="录入待跟进的商品信息"
          actions={<Link href="/products"><Button variant="ghost">返回</Button></Link>}
        />
      </Reveal>
      <Reveal delay={80}>
        <Spotlight>
          <Card className="space-y-4 p-5">
            <div><Label htmlFor="name">商品名称 *</Label><Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><Label htmlFor="url">商品链接</Label><Input id="url" value={form.url} onChange={(e) => set("url", e.target.value)} /></div>
        <div><Label htmlFor="category">类目</Label><Input id="category" value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="track">赛道</Label>
            <Select id="track" value={form.track} onChange={(e) => set("track", e.target.value)}>
              {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="platform">目标平台</Label>
            <Select id="platform" value={form.platform} onChange={(e) => set("platform", e.target.value)}>
              {Object.entries(PLATFORM_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><Label htmlFor="price">价格</Label><Input id="price" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
          <div><Label htmlFor="rate">佣金率 %</Label><Input id="rate" type="number" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} /></div>
          <div><Label htmlFor="sales">近30天销量</Label><Input id="sales" type="number" value={form.dailySales} onChange={(e) => set("dailySales", e.target.value)} /></div>
        </div>
        <div className="rounded-lg border border-line/60 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-2">选品评分</span>
            <span className={`tnum text-lg font-semibold ${score.grade === "A" ? "text-success" : score.grade === "B" ? "text-accent" : "text-fg-2"}`}>
              {score.grade} · {score.score}
            </span>
          </div>
          <p className="mt-1 text-xs text-fg-2">SOP 四大标准：客单价 50–200 元 / 佣金率 ≥30% / 单笔佣金 / 市场验证</p>
          {score.highlights.slice(0, 2).map((h) => <p key={h} className="mt-1 text-xs text-success">✓ {h}</p>)}
          {score.warnings.slice(0, 2).map((w) => <p key={w} className="mt-1 text-xs text-warning">! {w}</p>)}
        </div>
        <div><Label htmlFor="note">备注</Label><Input id="note" value={form.note} onChange={(e) => set("note", e.target.value)} /></div>
        {err && <p className="text-sm text-danger">{err}</p>}
        <Button onClick={submit} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </Card>
        </Spotlight>
      </Reveal>
    </div>
  );
}
