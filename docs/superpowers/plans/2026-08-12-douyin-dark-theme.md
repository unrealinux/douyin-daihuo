# 抖音带货助手 · 全站深色换肤实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有"能用级"浅色原型 UI 全面换肤为抖音原生质感的深色设计系统（深底 + 霓虹粉/青蓝高亮、玻璃导航、状态徽章、卡片体系、适度动效）。

**Architecture:** 纯前端样式重构，不改任何服务层/API/测试逻辑。先扩展 Tailwind 设计 token（tailwind.config + globals.css），再重写公共组件（ui.tsx/Nav/StatusBadge/ConfirmDialog），最后逐页面换肤。所有页面保持原有数据流与交互行为不变。

**Tech Stack:** Next.js 15 + Tailwind CSS 3.4 + React 19。无新增依赖。

**Token 命名说明（设计文档 token → Tailwind 类名）：**
- `bg`(#0f0f13) → `page`，类名 `bg-page`
- `surface`(#1a1a20) → `surface`，类名 `bg-surface`
- `surface-2`(#232329) → `surface-2`
- `border`(#2e2e36) → `line`，类名 `border-line` / `border-white/5`
- `text`(#f5f5f7) → `fg`，类名 `text-fg`
- `text-2`(#9a9aa3) → `fg-2`，类名 `text-fg-2`（页面次级文字用 `text-white/60` 亦可）
- `accent`/`cyan`/`success`/`warning`/`danger` 直接用

---

### Task 0: 设计 Token（tailwind.config.ts + globals.css）

**Files:**
- Modify: `tailwind.config.ts`（全部内容替换）
- Modify: `src/app/globals.css`（全部内容替换）

- [ ] **Step 1: 重写 tailwind.config.ts**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#0f0f13",
        surface: "#1a1a20",
        "surface-2": "#232329",
        line: "#2e2e36",
        fg: "#f5f5f7",
        "fg-2": "#9a9aa3",
        accent: "#fe2c55",
        cyan: "#22d3ee",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        subtle: "0 1px 2px rgb(0 0 0 / .4)",
        card: "0 4px 20px rgb(0 0 0 / .5)",
        lg: "0 8px 30px rgb(0 0 0 / .55)",
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: 重写 src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-page text-fg;
  font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 数字表格对齐 */
.tnum {
  font-feature-settings: "tnum";
}

/* 深色滚动条 */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2e2e36; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #3a3a44; }
```

- [ ] **Step 3: Typecheck + Build 验证**

Run: `npx tsc --noEmit`
Expected: 无错误

Run: `npm run build`
Expected: 成功（样式改动不影响路由）

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "style: add dark theme design tokens"
```

---

### Task 1: 重写共享 UI 组件（ui.tsx）

**Files:**
- Modify: `src/components/ui.tsx`（全部内容替换）

- [ ] **Step 1: 重写 src/components/ui.tsx**

```tsx
export function Button({ children, onClick, variant = "primary", className = "", type = "button", disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const styles = {
    primary: "bg-gradient-to-r from-[#fe2c55] to-[#ff6b81] text-white hover:brightness-110",
    secondary: "bg-transparent border border-white/10 text-white hover:bg-white/10",
    danger: "bg-red-500/90 text-white hover:bg-red-500",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:ring-2 ring-accent/50 ${styles[variant]} ${className} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-accent focus:ring-1 focus:ring-accent/30 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all [&>option]:bg-surface focus:border-accent focus:ring-1 focus:ring-accent/30 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-accent focus:ring-1 focus:ring-accent/30 ${props.className ?? ""}`}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm text-white/60">{children}</label>;
}

export function Card({ children, className = "", hover = false }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-white/5 bg-surface shadow-card transition-all ${hover ? "hover:border-white/10 hover:shadow-lg" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无错误（新增 Textarea/Card 不影响现有调用）

- [ ] **Step 3: Commit**

```bash
git add src/components/ui.tsx
git commit -m "style: dark-theme ui components with card and textarea"
```

---

### Task 2: 重写 Nav / StatusBadge / ConfirmDialog

**Files:**
- Modify: `src/components/Nav.tsx`（全部内容替换）
- Modify: `src/components/StatusBadge.tsx`（全部内容替换）
- Modify: `src/components/ConfirmDialog.tsx`（全部内容替换）

- [ ] **Step 1: 重写 src/components/Nav.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "仪表盘" },
  { href: "/products", label: "商品库" },
  { href: "/scripts", label: "脚本文案" },
  { href: "/assets", label: "素材排期" },
  { href: "/settings", label: "设置" },
];

function DiscIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-accent" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 14.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-2.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 7.5a.75.75 0 0 1 .75-.75 3 3 0 0 1 3 3 .75.75 0 1 1-1.5 0 1.5 1.5 0 0 0-1.5-1.5.75.75 0 0 1-.75-.75Z" fill="#22d3ee" />
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <div className="flex items-center gap-2 font-bold">
          <DiscIcon />
          <span className="bg-gradient-to-r from-[#fe2c55] to-[#22d3ee] bg-clip-text text-transparent">抖音带货助手</span>
        </div>
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b-2 pb-0.5 text-sm transition-colors ${
                active ? "border-accent text-white" : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 重写 src/components/StatusBadge.tsx**

```tsx
const STATUS_COLORS: Record<string, string> = {
  CANDIDATE: "bg-white/10 text-white/60",
  FOLLOWING: "bg-cyan-500/15 text-cyan-300",
  SELECTED: "bg-success/15 text-success",
  DROPPED: "bg-danger/15 text-danger",
  DRAFT: "bg-white/10 text-white/60",
  ADOPTED: "bg-success/15 text-success",
  DISCARDED: "bg-danger/15 text-danger",
  PENDING: "bg-warning/15 text-warning",
  PUBLISHED: "bg-success/15 text-success",
  PLANNED: "bg-cyan-500/15 text-cyan-300",
  SKIPPED: "bg-white/10 text-white/60",
  QUEUED: "bg-warning/15 text-warning",
  RUNNING: "bg-cyan-500/15 text-cyan-300",
  SUCCESS: "bg-success/15 text-success",
  FAILED: "bg-danger/15 text-danger",
  UP: "bg-accent/15 text-accent",
  STEADY: "bg-emerald-500/15 text-emerald-300",
  DOWN: "bg-danger/15 text-danger",
};

const STATUS_LABELS: Record<string, string> = {
  CANDIDATE: "候选", FOLLOWING: "跟进", SELECTED: "已选", DROPPED: "放弃",
  DRAFT: "草稿", ADOPTED: "已采用", DISCARDED: "已废弃",
  PENDING: "待发布", PUBLISHED: "已发布",
  PLANNED: "计划中", SKIPPED: "已跳过",
  QUEUED: "排队中", RUNNING: "运行中", SUCCESS: "成功", FAILED: "失败",
  UP: "上升", STEADY: "平稳", DOWN: "下降",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-white/10 text-white/60";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
```

- [ ] **Step 3: 重写 src/components/ConfirmDialog.tsx**

```tsx
"use client";

import { Button } from "@/components/ui";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div className="w-80 rounded-lg border border-white/10 bg-surface p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 font-semibold text-fg">{title}</h3>
        <p className="mb-4 text-sm text-white/60">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="danger" onClick={onConfirm}>确认</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + Build**

Run: `npx tsc --noEmit`
Expected: 无错误（Nav 新增 "use client"，layout 仍可用；所有调用方签名不变）

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.tsx src/components/StatusBadge.tsx src/components/ConfirmDialog.tsx
git commit -m "style: dark-theme nav badge and dialog"
```

---

### Task 3: 仪表盘 + 设置页换肤

**Files:**
- Modify: `src/app/page.tsx`（全部内容替换）
- Modify: `src/app/settings/page.tsx`（全部内容替换）

- [ ] **Step 1: 重写 src/app/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

interface Stats {
  productCount: number;
  noScriptCount: number;
  weekSchedules: number;
  recentPublished: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setStats);
  }, []);

  const cards = stats ? [
    { label: "商品总数", value: stats.productCount, href: "/products" },
    { label: "待生成脚本", value: stats.noScriptCount, href: "/scripts/generate" },
    { label: "本周排期", value: stats.weekSchedules, href: "/assets" },
    { label: "近7天已发布", value: stats.recentPublished, href: "/assets" },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>
      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.label} href={c.href}>
              <Card hover className="p-4">
                <div className="text-sm text-white/60">{c.label}</div>
                <div className="tnum mt-1 text-3xl font-bold text-fg">{c.value}</div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      )}

      <Card className="p-4 text-sm text-white/60">
        <p className="font-semibold text-fg">使用流程</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li><Link href="/products/new" className="text-cyan-300 hover:underline">录入/导入商品</Link>，或用<a href="/products/tasks" className="text-cyan-300 hover:underline">爬虫</a>抓取</li>
          <li>在<a href="/scripts/generate" className="text-cyan-300 hover:underline">脚本文案</a>页面批量生成文案</li>
          <li>在<a href="/assets" className="text-cyan-300 hover:underline">素材排期</a>上传视频并安排发布</li>
          <li>发布后在排期里回填抖音链接</li>
        </ol>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 重写 src/app/settings/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";

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

  if (!s) return <div className="h-40 animate-pulse rounded-lg bg-white/5" />;

  const up = (key: keyof Settings, field: string, value: string | number) =>
    setS({ ...s, [key]: { ...s[key], [field]: value } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">大模型配置（OpenAI 兼容）</h2>
        <div><Label>Base URL</Label><Input value={s.llm.baseUrl} onChange={(e) => up("llm", "baseUrl", e.target.value)} /></div>
        <div><Label>API Key</Label><Input type="password" value={s.llm.apiKey} onChange={(e) => up("llm", "apiKey", e.target.value)} /></div>
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
        {msg && <span className="text-sm text-success">{msg}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + Build**

Run: `npx tsc --noEmit`
Expected: 无错误

Run: `npm run build`
Expected: 成功

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/settings/page.tsx
git commit -m "style: dark-theme dashboard and settings pages"
```

---

### Task 4: 商品相关页面换肤（列表/新增/详情/导入）

**Files:**
- Modify: `src/app/products/page.tsx`（全部内容替换）
- Modify: `src/app/products/new/page.tsx`（全部内容替换）
- Modify: `src/app/products/[id]/page.tsx`（全部内容替换）
- Modify: `src/app/products/import/page.tsx`（全部内容替换）

- [ ] **Step 1: 重写 src/app/products/page.tsx**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Card, Input, Select } from "@/components/ui";

interface Product {
  id: number; name: string; category?: string | null; price?: number | null;
  commissionRate?: number | null; dailySales?: number | null; status: string;
  trend: string; source: string;
  _count?: { scriptIdeas: number; assets: number };
}

const EMPTY: Product[] = [];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(EMPTY);
  const [status, setStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("updatedAt");
  const [order, setOrder] = useState("desc");
  const [del, setDel] = useState<Product | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (status !== "ALL") q.set("status", status);
    if (keyword) q.set("keyword", keyword);
    q.set("sort", sort);
    q.set("order", order);
    const res = await fetch(`/api/products?${q.toString()}`);
    setProducts(await res.json());
  }, [status, keyword, sort, order]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!del) return;
    await fetch(`/api/products/${del.id}`, { method: "DELETE" });
    setDel(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品库</h1>
        <div className="flex gap-2">
          <Link href="/products/import"><Button variant="secondary">CSV 导入</Button></Link>
          <Link href="/products/tasks"><Button variant="secondary">爬虫任务</Button></Link>
          <Link href="/products/new"><Button>新增商品</Button></Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">全部状态</option>
          <option value="CANDIDATE">候选</option>
          <option value="FOLLOWING">跟进</option>
          <option value="SELECTED">已选</option>
          <option value="DROPPED">放弃</option>
        </Select>
        <Input placeholder="搜索名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="w-48" />
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updatedAt">更新时间</option>
          <option value="commissionRate">佣金率</option>
          <option value="dailySales">销量</option>
        </Select>
        <Select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} hover className="p-4">
            <div className="flex items-start justify-between">
              <Link href={`/products/${p.id}`} className="font-medium text-fg hover:text-accent">{p.name}</Link>
              <StatusBadge status={p.status} />
            </div>
            <div className="tnum mt-2 space-y-1 text-sm text-white/60">
              <div>类目: {p.category ?? "-"} · 价格: {p.price != null ? `¥${p.price}` : "-"}</div>
              <div>佣金率: {p.commissionRate != null ? `${p.commissionRate}%` : "-"} · 近30天销量: {p.dailySales ?? "-"}</div>
              <div>趋势: <StatusBadge status={p.trend} /> · 脚本 {p._count?.scriptIdeas ?? 0} · 素材 {p._count?.assets ?? 0}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={`/products/${p.id}`}><Button variant="ghost">编辑</Button></Link>
              <Link href={`/scripts/generate?productId=${p.id}`}><Button variant="ghost">生成文案</Button></Link>
              <Button variant="danger" onClick={() => setDel(p)}>删除</Button>
            </div>
          </Card>
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-16 text-center text-white/40">暂无商品</div>
        )}
      </div>

      <ConfirmDialog
        open={!!del}
        title="删除商品"
        message={`确定删除「${del?.name ?? ""}」？关联的脚本将保留但解除关联。`}
        onConfirm={confirmDelete}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: 重写 src/app/products/new/page.tsx**

```tsx
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
```

- [ ] **Step 3: 重写 src/app/products/[id]/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Button, Card, Input, Label, Select } from "@/components/ui";

interface Product {
  id: number; name: string; url?: string | null; category?: string | null;
  price?: number | null; commissionRate?: number | null; dailySales?: number | null;
  status: string; trend: string; note?: string | null;
  scriptIdeas: { id: number; title?: string | null; status: string; createdAt: string }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setLoading(false);
        if (!data || typeof data.id !== "number") {
          setP(null);
          return;
        }
        setP(data);
        setForm({
          name: data.name, url: data.url ?? "", category: data.category ?? "",
          price: data.price ?? "", commissionRate: data.commissionRate ?? "",
          dailySales: data.dailySales ?? "", status: data.status, trend: data.trend, note: data.note ?? "",
        });
      });
  }, [id]);

  if (loading) return <div className="h-48 animate-pulse rounded-lg bg-white/5" />;

  if (!p || !form) return <p className="text-white/40">商品不存在或已被删除</p>;

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, url: form.url || undefined, category: form.category || undefined,
        price: form.price ? Number(form.price) : null,
        commissionRate: form.commissionRate ? Number(form.commissionRate) : null,
        dailySales: form.dailySales ? Number(form.dailySales) : null,
        status: form.status, trend: form.trend, note: form.note || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setP(updated);
      setForm({
        name: updated.name, url: updated.url ?? "", category: updated.category ?? "",
        price: updated.price ?? "", commissionRate: updated.commissionRate ?? "",
        dailySales: updated.dailySales ?? "", status: updated.status, trend: updated.trend, note: updated.note ?? "",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <StatusBadge status={p.status} />
      </div>

      <Card className="max-w-lg space-y-4 p-5">
        <div><Label>商品名称</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><Label>链接</Label><Input value={form.url} onChange={(e) => set("url", e.target.value)} /></div>
        <div><Label>类目</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>价格</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
          <div><Label>佣金率 %</Label><Input type="number" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} /></div>
          <div><Label>销量</Label><Input type="number" value={form.dailySales} onChange={(e) => set("dailySales", e.target.value)} /></div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label>状态</Label>
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="CANDIDATE">候选</option>
              <option value="FOLLOWING">跟进</option>
              <option value="SELECTED">已选</option>
              <option value="DROPPED">放弃</option>
            </Select>
          </div>
          <div className="flex-1">
            <Label>趋势</Label>
            <Select value={form.trend} onChange={(e) => set("trend", e.target.value)}>
              <option value="UP">上升</option>
              <option value="STEADY">平稳</option>
              <option value="DOWN">下降</option>
            </Select>
          </div>
        </div>
        <div><Label>备注</Label><Input value={form.note} onChange={(e) => set("note", e.target.value)} /></div>
        <div className="flex gap-2">
          <Button onClick={save}>保存</Button>
          <Link href={`/scripts/generate?productId=${p.id}`}><Button variant="secondary">生成文案</Button></Link>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 font-semibold">已生成脚本（{p.scriptIdeas.length}）</h2>
        <div className="space-y-2">
          {p.scriptIdeas.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface px-3 py-2">
              <Link href={`/scripts?id=${s.id}`} className="text-fg hover:text-accent">{s.title ?? `脚本 #${s.id}`}</Link>
              <StatusBadge status={s.status} />
            </div>
          ))}
          {p.scriptIdeas.length === 0 && <p className="text-sm text-white/40">暂无脚本</p>}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 重写 src/app/products/import/page.tsx**

```tsx
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
```

- [ ] **Step 5: Typecheck + Build**

Run: `npx tsc --noEmit`
Expected: 无错误

Run: `npm run build`
Expected: 成功

- [ ] **Step 6: Commit**

```bash
git add src/app/products/
git commit -m "style: dark-theme product pages"
```

---

### Task 5: 脚本/素材/任务页面换肤

**Files:**
- Modify: `src/app/scripts/page.tsx`（全部内容替换）
- Modify: `src/app/scripts/generate/page.tsx`（全部内容替换）
- Modify: `src/app/assets/page.tsx`（全部内容替换）
- Modify: `src/app/products/tasks/page.tsx`（全部内容替换）

- [ ] **Step 1: 重写 src/app/scripts/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Card } from "@/components/ui";

interface Script {
  id: number; title?: string | null; hook?: string | null; body: string;
  shotScript?: string | null; hashtags?: string | null; status: string;
  style: string; durationSec: number; llmModel?: string | null; createdAt: string;
  product?: { id: number; name: string } | null;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [open, setOpen] = useState<Script | null>(null);
  const [del, setDel] = useState<Script | null>(null);

  const load = () => fetch("/api/scripts").then((r) => r.json()).then(setScripts);
  useEffect(() => { load(); }, []);

  const setStatus = async (s: Script, status: string) => {
    await fetch(`/api/scripts/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOpen(null);
    load();
  };

  const delScript = async () => {
    if (!del) return;
    await fetch(`/api/scripts/${del.id}`, { method: "DELETE" });
    setDel(null);
    load();
  };

  const parseHashtags = (raw?: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">脚本文案</h1>
        <Link href="/scripts/generate"><Button>生成脚本</Button></Link>
      </div>

      <div className="space-y-3">
        {scripts.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-fg">
                {s.title ?? `脚本 #${s.id}`}
                {s.product && <span className="ml-2 text-sm text-white/60">· {s.product.name}</span>}
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="tnum mt-1 text-sm text-white/60">
              {s.style} · {s.durationSec}s · {s.llmModel ?? ""} · {new Date(s.createdAt).toLocaleString()}
            </div>
            <div className="mt-2 line-clamp-2 text-sm text-white/70">{s.body}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(s)}>查看</Button>
              <Button variant="ghost" onClick={() => { setStatus(s, "ADOPTED"); }}>采用</Button>
              <Button variant="danger" onClick={() => setDel(s)}>删除</Button>
            </div>
          </Card>
        ))}
        {scripts.length === 0 && <div className="py-16 text-center text-white/40">暂无脚本</div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setOpen(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-lg border border-white/10 bg-surface p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-fg">{open.title ?? `脚本 #${open.id}`}</h3>
              <button onClick={() => setOpen(null)} className="text-white/40 hover:text-white">×</button>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <div><b className="text-fg">黄金3秒钩子：</b>{open.hook ?? "-"}</div>
              <div><b className="text-fg">口播正文：</b><p className="whitespace-pre-wrap">{open.body}</p></div>
              {open.shotScript && <div><b className="text-fg">分镜脚本：</b><p className="whitespace-pre-wrap">{open.shotScript}</p></div>}
              {open.hashtags && <div><b className="text-fg">标签：</b>{parseHashtags(open.hashtags).join(" ")}</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setStatus(open, "ADOPTED")}>标记采用</Button>
              <Button variant="secondary" onClick={() => setStatus(open, "DISCARDED")}>标记废弃</Button>
              <Button variant="danger" onClick={() => { setDel(open); setOpen(null); }}>删除</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!del}
        title="删除脚本"
        message={`确定删除「${del?.title ?? `脚本 #${del?.id}`}」？`}
        onConfirm={delScript}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: 重写 src/app/scripts/generate/page.tsx**

```tsx
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

  const modeBtn = (m: "manual" | "product", label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
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
        {result && <p className="text-sm text-success">{result}</p>}
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
```

- [ ] **Step 3: 重写 src/app/assets/page.tsx**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Card, Select } from "@/components/ui";

interface Asset {
  id: number; fileName: string; filePath: string; fileType: string; size: number;
  title?: string | null; status: string; createdAt: string;
  product?: { id: number; name: string } | null;
  script?: { id: number; title?: string | null } | null;
  schedules: Schedule[];
}

interface Schedule {
  id: number; scheduledAt: string; publishStatus: string; publishUrl?: string | null;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [uploading, setUploading] = useState(false);
  const [del, setDel] = useState<Asset | null>(null);

  const load = useCallback(() => {
    fetch("/api/assets").then((r) => r.json()).then(setAssets);
    fetch("/api/schedules").then((r) => r.json()).then(setSchedules);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch("/api/assets/upload", { method: "POST", body: fd });
    setUploading(false);
    load();
  };

  const createSchedule = async (assetId: number, dateStr: string) => {
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, scheduledAt: dateStr }),
    });
    load();
  };

  const markPublished = async (s: Schedule) => {
    const url = prompt("粘贴发布后的抖音链接（可留空）：", s.publishUrl ?? "");
    if (url === null) return;
    await fetch(`/api/schedules/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishStatus: "PUBLISHED",
        publishUrl: url || undefined,
        publishedAt: new Date().toISOString(),
      }),
    });
    load();
  };

  const delAsset = async () => {
    if (!del) return;
    await fetch(`/api/assets/${del.id}`, { method: "DELETE" });
    setDel(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">素材与排期</h1>
        <label className="cursor-pointer rounded-lg bg-gradient-to-r from-[#fe2c55] to-[#ff6b81] px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110">
          {uploading ? "上传中..." : "上传素材"}
          <input type="file" accept="video/*,image/*" className="hidden" onChange={upload} />
        </label>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">素材库（{assets.length}）</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <Card key={a.id} hover className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <StatusBadge status={a.status} />
                <button onClick={() => setDel(a)} className="text-xs text-white/40 hover:text-danger">删除</button>
              </div>
              <div className="text-sm font-medium text-fg">{a.title ?? a.fileName}</div>
              <div className="text-xs text-white/50">
                {a.product?.name ?? "未关联商品"} · {a.script ? `脚本#${a.script.id}` : "无脚本"}
              </div>
              <div className="mt-2 flex gap-1">
                <Select id={`assetsel-${a.id}`} defaultValue="" className="text-xs">
                  <option value="" disabled>+ 排期</option>
                  <option value="2026-08-12T10:00">明早10点</option>
                  <option value="2026-08-13T10:00">后天10点</option>
                  <option value="2026-08-14T19:00">周五晚7点</option>
                </Select>
                <Button variant="secondary" className="text-xs" onClick={() => {
                  const sel = document.getElementById(`assetsel-${a.id}`) as HTMLSelectElement;
                  if (sel.value) createSchedule(a.id, sel.value);
                }}>确定</Button>
              </div>
              {a.schedules.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  {a.schedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded bg-white/5 px-2 py-1">
                      <span className="text-white/70">{new Date(s.scheduledAt).toLocaleString()}</span>
                      <StatusBadge status={s.publishStatus} />
                      {s.publishStatus === "PLANNED" && (
                        <Button variant="ghost" className="text-xs" onClick={() => markPublished(s)}>发布</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
          {assets.length === 0 && <div className="col-span-full py-16 text-center text-white/40">暂无素材，点右上角上传</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">排期时间线</h2>
        <div className="space-y-2">
          {schedules.map((s) => {
            const asset = assets.find((a) => a.schedules.some((x) => x.id === s.id));
            return (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface px-3 py-2 text-sm">
                <div>
                  <span className="tnum font-medium text-fg">{new Date(s.scheduledAt).toLocaleString()}</span>
                  <span className="ml-3 text-white/50">{asset?.title ?? asset?.fileName ?? "素材已删除"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.publishStatus} />
                  {s.publishUrl && <a href={s.publishUrl} target="_blank" className="text-xs text-cyan-300">链接</a>}
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && <div className="py-6 text-center text-sm text-white/40">暂无排期</div>}
        </div>
      </section>

      <ConfirmDialog
        open={!!del}
        title="删除素材"
        message={`确定删除「${del?.title ?? del?.fileName}」？将同时删除磁盘文件。`}
        onConfirm={delAsset}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
```

注意：`assets/page.tsx` 移除了原来未使用的 `products`/`scripts` 两个 state 与对应 fetch（原实现存在死代码），交互不变。

- [ ] **Step 4: 重写 src/app/products/tasks/page.tsx**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Button, Card, Input, Label } from "@/components/ui";

interface Task {
  id: number; type: string; keyword?: string | null; url?: string | null;
  status: string; message?: string | null; retryCount: number; createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pwOk, setPwOk] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks);
    setPwOk(data.playwright?.installed);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (type: "KEYWORD" | "LINK") => {
    setMsg("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type === "KEYWORD" ? { keyword } : { url: link }),
    });
    const data = await res.json();
    if (res.ok) {
      setKeyword(""); setLink("");
      setMsg(`任务 #${data.id} 已创建`);
      setTimeout(load, 1500);
    } else {
      setMsg(data.error ?? "创建失败");
    }
  };

  const retry = async (id: number) => {
    await fetch(`/api/tasks/${id}/retry`, { method: "POST" });
    setTimeout(load, 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">爬虫任务</h1>
        <Link href="/products"><span className="text-sm text-cyan-300 hover:underline">返回商品库</span></Link>
      </div>

      {!pwOk && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Playwright 浏览器未安装。运行 <code className="rounded bg-black/30 px-1">npx playwright install chromium</code> 后重启。此问题不影响其他功能。
        </div>
      )}

      <Card className="space-y-3 p-4">
        <Label>关键词搜索</Label>
        <div className="flex gap-2">
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例如：厨房 收纳 爆款" />
          <Button onClick={() => submit("KEYWORD")}>抓取</Button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <Label>链接抓取</Label>
        <div className="flex gap-2">
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          <Button onClick={() => submit("LINK")}>抓取</Button>
        </div>
      </Card>

      {msg && <p className="text-sm text-white/60">{msg}</p>}

      <section>
        <h2 className="mb-2 font-semibold">任务列表</h2>
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-surface px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-fg">
                  {t.type === "KEYWORD" ? `关键词: ${t.keyword}` : `链接: ${t.url}`}
                </div>
                <div className="tnum text-xs text-white/50">
                  {new Date(t.createdAt).toLocaleString()} · 重试 {t.retryCount} 次
                </div>
                {t.message && <div className="text-xs text-white/60">{t.message}</div>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {t.status === "FAILED" && <Button variant="ghost" className="text-xs" onClick={() => retry(t.id)}>重试</Button>}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="py-6 text-center text-sm text-white/40">暂无任务</div>}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + Build + 全量测试**

Run: `npx tsc --noEmit`
Expected: 无错误

Run: `npm run build`
Expected: 成功

Run: `npx vitest run`
Expected: 19 个用例全部通过（样式改动不影响逻辑）

- [ ] **Step 6: Commit**

```bash
git add src/app/scripts/ src/app/assets/ src/app/products/tasks/
git commit -m "style: dark-theme scripts assets and tasks pages"
```

---

### Task 6: 最终验证

**Files:** 无新增

- [ ] **Step 1: 全量验证**

Run: `npx vitest run`
Expected: 4 文件 19 用例全部 PASS

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 2: 启动 dev 冒烟**

Run: `npm run dev`（若未在运行），浏览器打开 `http://localhost:3000`

人工检查清单：
1. 全站深色背景 #0f0f13，无残留浅色块（搜索代码中不应再有 `bg-white`、`text-gray-`、`text-blue-600`、`bg-gray-50`）
2. Nav 玻璃效果 + active 高亮；Logo 渐变文字
3. 按钮 4 变体 hover/disabled 正常
4. 表单聚焦出现 accent 边框
5. 状态徽章颜色正确（候选灰/跟进青/已选绿/放弃红/爬虫任务黄青绿）
6. 空状态与加载骨架正常
7. 原有交互全部可用（增删改查、上传、排期、生成脚本、爬虫任务）

- [ ] **Step 3: 残留浅色类名检查（若 Step 2 发现）**

Run: `Select-String -Path "src\app\**\*.tsx","src\components\**\*.tsx" -Pattern "bg-white|text-gray-|bg-gray-|text-blue-600" -Recurse | Select-Object Path,LineNumber,Line`
Expected: 无匹配（若有，修复对应文件并重新 build）

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "style: dark theme final verification" --allow-empty
```
