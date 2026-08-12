"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@/components/ui";

interface Product {
  id: number; name: string; note?: string | null; category?: string | null;
}

const STYLES = [
  { value: "SPOKEN", label: "口播带货" },
  { value: "REVIEW", label: "测评" },
  { value: "STORY", label: "剧情" },
  { value: "UNBOXING", label: "开箱" },
];

function GenerateForm() {
  const sp = useSearchParams();
  const preselect = sp.get("productId");

  const [mode, setMode] = useState<"manual" | "product">(preselect ? "product" : "manual");
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState(preselect ?? "");
  const [productName, setProductName] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [style, setStyle] = useState("SPOKEN");
  const [duration, setDuration] = useState("30");
  const [resultId, setResultId] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products?status=ALL")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const generate = async () => {
    setLoading(true); setErr(""); setResultId(null);
    if (mode === "product" && !productId) {
      setErr("请选择商品");
      setLoading(false);
      return;
    }
    if (mode === "manual" && !productName.trim()) {
      setErr("请填写商品名称");
      setLoading(false);
      return;
    }
    const payload = mode === "product"
      ? { productId: Number(productId), style, durationSec: Number(duration), sellingPoints: sellingPoints || undefined }
      : { productName, sellingPoints, style, durationSec: Number(duration) };
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) setResultId(data.id);
      else setErr(data.error ?? "生成失败");
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const modeBtn = (m: "manual" | "product", label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`rounded-lg px-3 py-1.5 text-sm transition-all focus-visible:ring-2 ring-accent/50 ${
        mode === m ? "bg-accent text-white shadow-card" : "border border-white/10 text-white/70 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">生成脚本文案</h1>
        <Link href="/scripts"><span className="text-sm text-cyan-300 hover:underline">返回列表</span></Link>
      </div>

      <div className="flex gap-3">
        {modeBtn("manual", "手动输入")}
        {modeBtn("product", "从商品库选品")}
      </div>

      <Card className="space-y-4 p-5">
        {mode === "product" ? (
          <div>
            <Label>选择商品</Label>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">请选择</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <div className="mt-3">
              <Label>补充卖点（可选，自动带出商品备注/类目）</Label>
              <Input value={sellingPoints} onChange={(e) => setSellingPoints(e.target.value)} />
            </div>
          </div>
        ) : (
          <>
            <div><Label>商品名称</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} /></div>
            <div><Label>卖点（可填价格、材质、适用人群等）</Label><Input value={sellingPoints} onChange={(e) => setSellingPoints(e.target.value)} /></div>
          </>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <Label>风格</Label>
            <Select value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div className="flex-1">
            <Label>目标时长（秒）</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>

        <Button onClick={generate} disabled={loading}>
          {loading ? "生成中..." : "生成"}
        </Button>
        {resultId != null && (
          <p className="text-sm text-success">
            已生成脚本 #{resultId} ·{" "}
            <Link href={`/scripts?id=${resultId}`} className="text-cyan-300 underline hover:text-cyan">
              查看脚本
            </Link>
          </p>
        )}
        {err && <p className="text-sm text-danger">{err}</p>}
      </Card>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-white/5" />}>
      <GenerateForm />
    </Suspense>
  );
}
