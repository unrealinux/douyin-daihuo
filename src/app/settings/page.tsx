"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";

interface Settings {
  llm: { baseUrl: string; apiKey: string; model: string; temperature: number; apiKeyConfigured?: boolean };
  crawler: { rateLimitMs: number; proxyUrl: string; timeoutSec: number };
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setS)
      .catch(() => setS(null));
  }, []);

  const save = async () => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (res.ok) {
      const data = await res.json();
      setS(data);
      setMsg("已保存");
      setMsgOk(true);
    } else {
      setMsg("保存失败");
      setMsgOk(false);
    }
  };

  if (!s) return <div className="h-40 animate-pulse rounded-lg bg-white/5" />;

  const up = (key: keyof Settings, field: string, value: string | number) =>
    setS({ ...s, [key]: { ...s[key], [field]: value } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">大模型配置（OpenAI 兼容）</h2>
        <div><Label>Base URL</Label><Input value={s.llm.baseUrl} onChange={(e) => up("llm", "baseUrl", e.target.value)} /></div>
        <div>
          <Label>API Key{s.llm.apiKeyConfigured ? "（已配置，留空占位则不改动）" : ""}</Label>
          <Input type="password" value={s.llm.apiKey} onChange={(e) => up("llm", "apiKey", e.target.value)} placeholder={s.llm.apiKeyConfigured ? "••••••••" : ""} />
        </div>
        <div><Label>Model</Label><Input value={s.llm.model} onChange={(e) => up("llm", "model", e.target.value)} /></div>
        <div><Label>Temperature（0-1）</Label><Input type="number" step="0.1" min="0" max="1" value={s.llm.temperature} onChange={(e) => up("llm", "temperature", Number(e.target.value))} /></div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">爬虫配置</h2>
        <div><Label>限速间隔 (ms)</Label><Input type="number" value={s.crawler.rateLimitMs} onChange={(e) => up("crawler", "rateLimitMs", Number(e.target.value))} /></div>
        <div><Label>代理地址（留空表示直连）</Label><Input value={s.crawler.proxyUrl} onChange={(e) => up("crawler", "proxyUrl", e.target.value)} /></div>
        <div><Label>超时秒数</Label><Input type="number" value={s.crawler.timeoutSec} onChange={(e) => up("crawler", "timeoutSec", Number(e.target.value))} /></div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save}>保存</Button>
        {msg && <span className={`text-sm ${msgOk ? "text-success" : "text-danger"}`}>{msg}</span>}
      </div>
    </div>
  );
}
