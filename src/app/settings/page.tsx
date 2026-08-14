"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { PageHeader } from "@/components/PageChrome";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";

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
      <Reveal>
        <PageHeader
          title="设置"
          description="大模型与爬虫运行参数"
        />
      </Reveal>

      <Reveal delay={70}>
        <Spotlight>
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </span>
              <h2 className="font-semibold">大模型配置（OpenAI 兼容）</h2>
            </div>
            <div><Label>Base URL</Label><Input value={s.llm.baseUrl} onChange={(e) => up("llm", "baseUrl", e.target.value)} /></div>
            <div>
              <Label>API Key{s.llm.apiKeyConfigured ? "（已配置，留空占位则不改动）" : ""}</Label>
              <Input type="password" value={s.llm.apiKey} onChange={(e) => up("llm", "apiKey", e.target.value)} placeholder={s.llm.apiKeyConfigured ? "••••••••" : ""} />
            </div>
            <div><Label>Model</Label><Input value={s.llm.model} onChange={(e) => up("llm", "model", e.target.value)} /></div>
            <div><Label>Temperature（0-1）</Label><Input type="number" step="0.1" min="0" max="1" value={s.llm.temperature} onChange={(e) => up("llm", "temperature", Number(e.target.value))} /></div>
          </Card>
        </Spotlight>
      </Reveal>

      <Reveal delay={140}>
        <Spotlight>
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 14.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9z" />
                </svg>
              </span>
              <h2 className="font-semibold">爬虫配置</h2>
            </div>
            <div><Label>限速间隔 (ms)</Label><Input type="number" value={s.crawler.rateLimitMs} onChange={(e) => up("crawler", "rateLimitMs", Number(e.target.value))} /></div>
            <div><Label>代理地址（留空表示直连）</Label><Input value={s.crawler.proxyUrl} onChange={(e) => up("crawler", "proxyUrl", e.target.value)} /></div>
            <div><Label>超时秒数</Label><Input type="number" value={s.crawler.timeoutSec} onChange={(e) => up("crawler", "timeoutSec", Number(e.target.value))} /></div>
          </Card>
        </Spotlight>
      </Reveal>

      <Reveal delay={200}>
        <div className="flex items-center gap-3">
          <Button onClick={save}>保存</Button>
          {msg && <span className={`text-sm ${msgOk ? "text-success" : "text-danger"}`}>{msg}</span>}
        </div>
      </Reveal>
    </div>
  );
}
