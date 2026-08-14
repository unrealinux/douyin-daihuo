"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import { Button, Card } from "@/components/ui";

export default function ImportPage() {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/products/import", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setResult(`成功导入 ${data.count} 条`);
        setErr("");
        toast(`成功导入 ${data.count} 条`, "success");
      } else {
        setErr(data.error ?? "导入失败");
        setResult("");
        toast(data.error ?? "导入失败", "danger");
      }
    } catch (e) {
      setErr(String(e));
      toast(String(e), "danger");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 animate-fade-up">
      <PageHeader title="CSV 批量导入" actions={<Button variant="ghost" onClick={() => router.push("/products")}>返回</Button>} />
      <Card className="space-y-4 p-5">
        <p className="text-sm text-fg-2">表头支持：名称/链接/价格/佣金率/销量/类目（也支持 name/url/price/commissionRate/dailySales/category）</p>
        <label className="block cursor-pointer rounded-xl border border-dashed border-line bg-white/[0.03] px-4 py-10 text-center text-sm text-fg-2 transition-all duration-200 ease-out-expo hover:border-accent/50 hover:bg-accent/[0.04] hover:text-white active:scale-[0.99]">
          {file ? <span className="font-medium text-fg">{file.name}</span> : "点击选择 .csv 文件"}
          <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="flex gap-2">
          <Button onClick={submit} disabled={!file || loading}>{loading ? "导入中..." : "导入"}</Button>
          <Button variant="secondary" onClick={() => router.push("/products")}>返回</Button>
        </div>
        {result && (
          <p className="text-sm text-success">
            {result} · <Link href="/products" className="text-cyan-300 underline">查看商品库</Link>
          </p>
        )}
        {err && <p className="text-sm text-danger">{err}</p>}
      </Card>
    </div>
  );
}
