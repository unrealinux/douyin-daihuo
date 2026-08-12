"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", url: "", category: "", price: "", commissionRate: "", dailySales: "", note: "" });

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!form.name) return;
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        url: form.url || undefined,
        category: form.category || undefined,
        price: form.price ? Number(form.price) : undefined,
        commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
        dailySales: form.dailySales ? Number(form.dailySales) : undefined,
        note: form.note || undefined,
      }),
    });
    if (res.ok) {
      const p = await res.json();
      router.push(`/products/${p.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">新增商品</h1>
      <Card className="space-y-4 p-5">
        <div><Label>商品名称 *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><Label>商品链接</Label><Input value={form.url} onChange={(e) => set("url", e.target.value)} /></div>
        <div><Label>类目</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>价格</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
          <div><Label>佣金率 %</Label><Input type="number" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} /></div>
          <div><Label>近30天销量</Label><Input type="number" value={form.dailySales} onChange={(e) => set("dailySales", e.target.value)} /></div>
        </div>
        <div><Label>备注</Label><Input value={form.note} onChange={(e) => set("note", e.target.value)} /></div>
        <Button onClick={submit}>保存</Button>
      </Card>
    </div>
  );
}