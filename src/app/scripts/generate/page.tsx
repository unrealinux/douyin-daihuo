"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";
import { PLATFORM_LABEL } from "@/lib/selectionUtils";
import { similarityLevel, similarityPercent } from "@/lib/similarity";

interface Product {
  id: number; name: string; note?: string | null; category?: string | null;
}

interface ComplianceIssue {
  rule: string; level: "redline" | "warn"; field: string; message: string; evidence: string;
}

interface BenchmarkOption {
  id: number; title: string; track?: string | null; platform?: string | null;
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
  const preBenchmark = sp.get("benchmarkId");

  const [mode, setMode] = useState<"manual" | "product">(preselect ? "product" : "manual");
  const [products, setProducts] = useState<Product[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkOption[]>([]);
  const [benchmarkId, setBenchmarkId] = useState(preBenchmark ?? "");
  const [productId, setProductId] = useState(preselect ?? "");
  const [productName, setProductName] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [style, setStyle] = useState("SPOKEN");
  const [duration, setDuration] = useState("30");
  const [result, setResult] = useState<{ id: number; similarity?: number | null; compliance?: { redlineCount: number; warnCount: number; issues: ComplianceIssue[] } } | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products?status=ALL")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .catch(() => setProducts([]));
    fetch("/api/benchmarks?sort=hot")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setBenchmarks(d.items ?? []))
      .catch(() => setBenchmarks([]));
  }, []);

  const generate = async () => {
    setLoading(true); setErr(""); setResult(null);
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
    const bench = benchmarkId ? { benchmarkId: Number(benchmarkId) } : {};
    const payload = mode === "product"
      ? { productId: Number(productId), style, durationSec: Number(duration), sellingPoints: sellingPoints || undefined, ...bench }
      : { productName, sellingPoints, style, durationSec: Number(duration), ...bench };
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) setResult({ id: data.id, similarity: data.similarity, compliance: data.compliance });
      else setErr(data.error ?? "生成失败");
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const modeBtn = (m: "manual" | "product", label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`rounded-full px-4 py-1.5 text-sm transition-all duration-200 ease-out-expo active:scale-[0.98] focus-visible:ring-2 ring-accent/50 ${
        mode === m ? "bg-accent text-white shadow-accent" : "text-fg-2 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">生成脚本文案</h1>
            <p className="mt-1 text-sm text-fg-2">选好风格和时长，一键生成口播脚本</p>
          </div>
          <Link href="/scripts" className="shrink-0 text-sm text-cyan-300 transition-colors hover:text-cyan">返回列表</Link>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="inline-flex rounded-full border border-line bg-surface/80 p-1 backdrop-blur">
          {modeBtn("manual", "手动输入")}
          {modeBtn("product", "从商品库选品")}
        </div>
      </Reveal>

      <Reveal delay={140}>
        <Spotlight>
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

            <div>
              <Label>引用对标（可选，锁两头破中间重写）</Label>
              <Select value={benchmarkId} onChange={(e) => setBenchmarkId(e.target.value)}>
                <option value="">不引用</option>
                {benchmarks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}{b.track ? ` · ${b.track}` : ""}{b.platform ? ` · ${PLATFORM_LABEL[b.platform as keyof typeof PLATFORM_LABEL] ?? b.platform}` : ""}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-fg-2">引用后会按对标结构二创，并自动核算相似度（目标 &lt;10%）</p>
            </div>

            <Button onClick={generate} disabled={loading}>
              {loading ? "生成中..." : "生成"}
            </Button>
            {result && (
              <div className="text-sm">
                <p className="text-success">
                  已生成脚本 #{result.id} ·{" "}
                  <Link href={`/scripts?id=${result.id}`} className="text-cyan-300 underline hover:text-cyan">
                    查看脚本
                  </Link>
                </p>
                {result.similarity != null && (
                  <p
                    className={
                      similarityLevel(result.similarity) === "safe"
                        ? "mt-1 text-success"
                        : similarityLevel(result.similarity) === "caution"
                          ? "mt-1 text-warning"
                          : "mt-1 text-danger"
                    }
                  >
                    与对标相似度 {similarityPercent(result.similarity)}% ·{" "}
                    {similarityLevel(result.similarity) === "safe" ? "安全（<10%）" : similarityLevel(result.similarity) === "caution" ? "需谨慎，建议再改写（目标 <10%）" : "高风险，务必重写中段"}
                  </p>
                )}
                {result.compliance && result.compliance.issues.length > 0 && (
                  <div className={`mt-2 rounded-lg border p-3 text-xs ${result.compliance.redlineCount > 0 ? "border-danger/30 bg-danger/10" : "border-warning/30 bg-warning/10"}`}>
                    <p className={`font-medium ${result.compliance.redlineCount > 0 ? "text-danger" : "text-warning"}`}>
                      合规校验：{result.compliance.redlineCount > 0 ? `${result.compliance.redlineCount} 项红线违规，建议重新生成` : `${result.compliance.warnCount} 项提醒`}
                    </p>
                    {result.compliance.issues.map((it) => (
                      <p key={it.rule + it.field} className="mt-1 text-fg-2">
                        <span className={it.level === "redline" ? "text-danger" : "text-warning"}>[{it.level === "redline" ? "红线" : "提醒"}]</span>{" "}
                        {it.rule}（{it.field}）：{it.message} — <span className="text-white/60">{it.evidence}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {err && <p className="text-sm text-danger">{err}</p>}
          </Card>
        </Spotlight>
      </Reveal>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/5" />}>
      <GenerateForm />
    </Suspense>
  );
}
