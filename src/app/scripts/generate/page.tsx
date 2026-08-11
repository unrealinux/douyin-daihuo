"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input, Label, Select } from "@/components/ui";

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
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products?status=ALL").then((r) => r.json()).then(setProducts);
  }, []);

  const generate = async () => {
    setLoading(true); setErr(""); setResult("");
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
      if (res.ok) setResult(`已生成脚本 #${data.id}`);
      else setErr(data.error ?? "生成失败");
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">生成脚本文案</h1>
        <Link href="/scripts"><span className="text-sm text-blue-600 hover:underline">返回列表</span></Link>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setMode("manual")} className={`rounded px-3 py-1 ${mode === "manual" ? "bg-accent text-white" : "border"}`}>手动输入</button>
        <button onClick={() => setMode("product")} className={`rounded px-3 py-1 ${mode === "product" ? "bg-accent text-white" : "border"}`}>从商品库选品</button>
      </div>

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
        <div className="space-y-3">
          <div><Label>商品名称</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} /></div>
          <div><Label>卖点（可填价格、材质、适用人群等）</Label><Input value={sellingPoints} onChange={(e) => setSellingPoints(e.target.value)} /></div>
        </div>
      )}

      <div className="flex gap-3">
        <div>
          <Label>风格</Label>
          <Select value={style} onChange={(e) => setStyle(e.target.value)}>
            {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        <div>
          <Label>目标时长（秒）</Label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>

      <Button onClick={generate} disabled={loading}>
        {loading ? "生成中..." : "生成"}
      </Button>
      {result && <p className="text-sm text-green-600">{result}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<p className="text-gray-400">加载中...</p>}>
      <GenerateForm />
    </Suspense>
  );
}
