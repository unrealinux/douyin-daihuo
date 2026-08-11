"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

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
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">CSV 批量导入</h1>
      <p className="text-sm text-gray-500">表头支持：名称/链接/价格/佣金率/销量/类目（也支持 name/url/price/commissionRate/dailySales/category）</p>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="flex gap-2">
        <Button onClick={submit} disabled={!file}>导入</Button>
        <Button variant="secondary" onClick={() => router.push("/products")}>返回</Button>
      </div>
      {result && <p className="text-sm text-green-600">{result}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
