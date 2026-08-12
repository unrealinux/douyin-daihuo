"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/products/import", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) { setResult(`成功导入 ${data.count} 条`); setErr(""); }
    else { setErr(data.error ?? "导入失败"); setResult(""); }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">CSV 批量导入</h1>
      <Card className="space-y-4 p-5">
        <p className="text-sm text-white/60">表头支持：名称/链接/价格/佣金率/销量/类目（也支持 name/url/price/commissionRate/dailySales/category）</p>
        <label className="block cursor-pointer rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-8 text-center text-sm text-white/60 transition-colors hover:border-accent hover:bg-white/10">
          {file ? <span className="text-fg">{file.name}</span> : "点击选择 .csv 文件"}
          <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="flex gap-2">
          <Button onClick={submit} disabled={!file}>导入</Button>
          <Button variant="secondary" onClick={() => router.push("/products")}>返回</Button>
        </div>
        {result && <p className="text-sm text-success">{result}</p>}
        {err && <p className="text-sm text-danger">{err}</p>}
      </Card>
    </div>
  );
}