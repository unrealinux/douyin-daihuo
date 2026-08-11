"use client";

import { useEffect, useState } from "react";

interface Settings {
  llm: { baseUrl: string; apiKey: string; model: string; temperature: number };
  crawler: { rateLimitMs: number; proxyUrl: string; timeoutSec: number };
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setS);
  }, []);

  const save = async () => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (res.ok) setMsg("已保存");
    else setMsg("保存失败");
  };

  if (!s) return <p>加载中...</p>;

  const up = (key: keyof Settings, field: string, value: string | number) =>
    setS({ ...s, [key]: { ...s[key], [field]: value } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">设置</h1>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">大模型配置（OpenAI 兼容）</h2>
        <label className="block text-sm">Base URL</label>
        <input className="mt-1 mb-3 w-full rounded border px-2 py-1" value={s.llm.baseUrl} onChange={(e) => up("llm", "baseUrl", e.target.value)} />
        <label className="block text-sm">API Key</label>
        <input type="password" className="mt-1 mb-3 w-full rounded border px-2 py-1" value={s.llm.apiKey} onChange={(e) => up("llm", "apiKey", e.target.value)} />
        <label className="block text-sm">Model</label>
        <input className="mt-1 mb-3 w-full rounded border px-2 py-1" value={s.llm.model} onChange={(e) => up("llm", "model", e.target.value)} />
        <label className="block text-sm">Temperature（0-1）</label>
        <input type="number" step="0.1" min="0" max="1" className="mt-1 mb-3 w-full rounded border px-2 py-1" value={s.llm.temperature} onChange={(e) => up("llm", "temperature", Number(e.target.value))} />
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">爬虫配置</h2>
        <label className="block text-sm">限速间隔 (ms)</label>
        <input type="number" className="mt-1 mb-3 w-full rounded border px-2 py-1" value={s.crawler.rateLimitMs} onChange={(e) => up("crawler", "rateLimitMs", Number(e.target.value))} />
        <label className="block text-sm">代理地址（留空表示直连）</label>
        <input className="mt-1 mb-3 w-full rounded border px-2 py-1" value={s.crawler.proxyUrl} onChange={(e) => up("crawler", "proxyUrl", e.target.value)} />
        <label className="block text-sm">超时秒数</label>
        <input type="number" className="mt-1 mb-3 w-full rounded border px-2 py-1" value={s.crawler.timeoutSec} onChange={(e) => up("crawler", "timeoutSec", Number(e.target.value))} />
      </section>

      <button onClick={save} className="rounded bg-accent px-4 py-2 text-white">
        保存
      </button>
      {msg && <span className="ml-3 text-sm text-green-600">{msg}</span>}
    </div>
  );
}
