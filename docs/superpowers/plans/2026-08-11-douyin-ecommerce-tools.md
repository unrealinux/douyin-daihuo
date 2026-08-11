# 抖音带货辅助工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一套本地 Web 面板工具，跑通「抓品 → 筛品 → 生成文案 → 备素材 → 排期发布」的完整闭环。

**Architecture:** Next.js 15 (App Router + TS) 全栈单体，SQLite + Prisma 存储，服务层 `src/services/` 独立可测，爬虫用 Playwright 拆成独立脚本由后端异步调度，文案生成接 OpenAI 兼容 API。

**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS v3 · Prisma ORM + SQLite · Vitest · Playwright · OpenAI SDK · csv-parse

**Spec:** `docs/superpowers/specs/2026-08-11-douyin-ecommerce-tools-design.md`

---

## Scope

- **P0（本计划覆盖）**：项目骨架、数据模型、设置页、商品库 CRUD + 手动录入 + CSV 导入、脚本文案生成（单选/批量）、素材上传与排期、仪表盘
- **P1（本计划覆盖）**：Playwright 爬虫 + 任务中心
- **P2（不做）**：效果跟踪、日历看板增强、发布提醒、登录权限

所有测试用纯函数（无 DB），避免测试环境数据库配置繁琐。

---

## File Structure

```
douyin/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── .env
├── .gitignore
├── vitest.config.ts
├── prisma/schema.prisma
├── data/                        (运行时生成: douyin.db + uploads/)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                             # 仪表盘
│   │   ├── settings/page.tsx
│   │   ├── products/page.tsx
│   │   ├── products/new/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   ├── products/import/page.tsx
│   │   ├── products/tasks/page.tsx
│   │   ├── scripts/page.tsx
│   │   ├── scripts/generate/page.tsx
│   │   ├── assets/page.tsx
│   │   └── api/
│   │       ├── dashboard/route.ts
│   │       ├── settings/route.ts
│   │       ├── products/route.ts
│   │       ├── products/[id]/route.ts
│   │       ├── products/import/route.ts
│   │       ├── tasks/route.ts
│   │       ├── tasks/[id]/retry/route.ts
│   │       ├── scripts/route.ts
│   │       ├── scripts/generate/route.ts
│   │       ├── scripts/batch/route.ts
│   │       ├── scripts/[id]/route.ts
│   │       ├── assets/route.ts
│   │       ├── assets/upload/route.ts
│   │       ├── assets/[id]/route.ts
│   │       ├── schedules/route.ts
│   │       └── files/[name]/route.ts
│   ├── services/
│   │   ├── settingService.ts
│   │   ├── productService.ts
│   │   ├── csvService.ts
│   │   ├── scriptParser.ts
│   │   ├── scriptService.ts
│   │   ├── assetService.ts
│   │   └── taskRunner.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── llm.ts
│   │   └── api.ts
│   ├── crawlers/
│   │   └── runner.ts
│   └── components/
│       ├── Nav.tsx
│       ├── ConfirmDialog.tsx
│       ├── StatusBadge.tsx
│       └── ui.tsx
└── tests/
    ├── csvService.test.ts
    ├── scriptParser.test.ts
    └── scriptService.test.ts
```

---

## Task 0: 项目骨架

- 初始化 Next.js 项目文件、TypeScript、Tailwind、git 忽略、vitest 配置、依赖安装

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `.env`, `.gitignore`, `vitest.config.ts`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/Nav.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "douyin-ecommerce-tools",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.2.1",
    "csv-parse": "^5.6.0",
    "next": "^15.1.6",
    "openai": "^4.77.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1",
    "prisma": "^6.2.1",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 next.config.mjs / postcss.config.mjs / tailwind.config.ts**

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

export default nextConfig;
```

```js
// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#fe2c55",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: 创建 .env / .gitignore**

```env
DATABASE_URL="file:./data/douyin.db"
```

```gitignore
node_modules/
.next/
out/
data/
.env.local
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 5: 创建 vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: 创建 src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
```

- [ ] **Step 7: 创建 src/components/Nav.tsx**

```tsx
import Link from "next/link";

const links = [
  { href: "/", label: "仪表盘" },
  { href: "/products", label: "商品库" },
  { href: "/scripts", label: "脚本文案" },
  { href: "/assets", label: "素材排期" },
  { href: "/settings", label: "设置" },
];

export default function Nav() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        <span className="font-bold text-accent">抖音带货助手</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm hover:text-accent">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 8: 创建 src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = { title: "抖音带货助手" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 9: 安装依赖并验证**

Run: `npm install`
Expected: `added N packages` 无报错

Run: `npx tsc --noEmit`
Expected: 无 TS 错误 (可为 0 输出)

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold nextjs project skeleton"
```

---

## Task 1: Prisma 数据模型 + DB 客户端

- 定义 6 张核心表（Product / ScrapeTask / ScriptIdea / Asset / Schedule / Setting），生成 Prisma Client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: 创建 prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum ProductSource {
  MANUAL
  IMPORT
  CRAWLER
}

enum ProductStatus {
  CANDIDATE
  FOLLOWING
  SELECTED
  DROPPED
}

enum Trend {
  UP
  STEADY
  DOWN
}

enum ScrapeTaskType {
  KEYWORD
  LINK
}

enum ScrapeTaskStatus {
  QUEUED
  RUNNING
  SUCCESS
  FAILED
}

enum ScriptStyle {
  SPOKEN
  REVIEW
  STORY
  UNBOXING
}

enum ScriptStatus {
  DRAFT
  ADOPTED
  DISCARDED
}

enum AssetType {
  VIDEO
  IMAGE
}

enum AssetStatus {
  PENDING
  PUBLISHED
  DROPPED
}

enum PublishStatus {
  PLANNED
  PUBLISHED
  SKIPPED
}

model Product {
  id             Int       @id @default(autoincrement())
  name           String
  url            String?
  imageUrl       String?
  category       String?
  price          Float?
  commissionRate Float?
  dailySales     Int?
  trend          Trend     @default(STEADY)
  source         ProductSource @default(MANUAL)
  status         ProductStatus @default(CANDIDATE)
  note           String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  scrapeTasks    ScrapeTask[]
  scriptIdeas    ScriptIdea[]
  assets         Asset[]

  @@index([status])
  @@index([category])
}

model ScrapeTask {
  id         Int              @id @default(autoincrement())
  productId  Int?
  product    Product?         @relation(fields: [productId], references: [id])
  type       ScrapeTaskType   @default(KEYWORD)
  keyword    String?
  url        String?
  status     ScrapeTaskStatus @default(QUEUED)
  message    String?
  retryCount Int              @default(0)
  createdAt  DateTime         @default(now())
  startedAt  DateTime?
  finishedAt DateTime?
}

model ScriptIdea {
  id          Int          @id @default(autoincrement())
  productId   Int?
  product     Product?     @relation(fields: [productId], references: [id])
  title       String?
  hook        String?
  body        String
  shotScript  String?
  hashtags    String?
  style       ScriptStyle  @default(SPOKEN)
  durationSec Int          @default(30)
  llmModel    String?
  status      ScriptStatus @default(DRAFT)
  createdAt   DateTime     @default(now())
  assets      Asset[]
}

model Asset {
  id          Int         @id @default(autoincrement())
  productId   Int?
  product     Product?    @relation(fields: [productId], references: [id])
  scriptId    Int?
  script      ScriptIdea? @relation(fields: [scriptId], references: [id])
  fileName    String
  filePath    String
  fileType    AssetType   @default(VIDEO)
  size        Int         @default(0)
  coverPath   String?
  title       String?
  tags        String?
  status      AssetStatus @default(PENDING)
  createdAt   DateTime    @default(now())
  schedules   Schedule[]
}

model Schedule {
  id            Int           @id @default(autoincrement())
  assetId       Int
  asset         Asset         @relation(fields: [assetId], references: [id])
  scheduledAt   DateTime
  publishStatus PublishStatus @default(PLANNED)
  publishUrl    String?
  publishedAt   DateTime?
  createdAt     DateTime      @default(now())

  @@index([scheduledAt])
}

model Setting {
  key   String @id
  value String
}
```

- [ ] **Step 2: 创建 src/lib/db.ts**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: 推送 schema 到 SQLite（生成 data/douyin.db）**

Run: `npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema`

Run: `npx prisma generate`
Expected: 生成 @prisma/client，无报错

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 4: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add prisma schema and db client"
```

---

## Task 2: 设置模块（服务 + API + 页面）

- LLM 配置（baseUrl/apiKey/model/temperature）与爬虫配置（限速/代理/超时）读写

**Files:**
- Create: `src/services/settingService.ts`
- Create: `src/app/api/settings/route.ts`
- Create: `src/app/settings/page.tsx`
- Test: `tests/settingService.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/settingService.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseLlmConfig, parseCrawlerConfig, DEFAULT_LLM, DEFAULT_CRAWLER } from "@/services/settingService";

describe("settingService", () => {
  it("parseLlmConfig returns defaults when raw is null", () => {
    expect(parseLlmConfig(null)).toEqual(DEFAULT_LLM);
  });

  it("parseLlmConfig merges partial json over defaults", () => {
    const cfg = parseLlmConfig(JSON.stringify({ model: "deepseek-chat" }));
    expect(cfg.model).toBe("deepseek-chat");
    expect(cfg.temperature).toBe(DEFAULT_LLM.temperature);
  });

  it("parseLlmConfig falls back on bad json", () => {
    expect(parseLlmConfig("not-json")).toEqual(DEFAULT_LLM);
  });

  it("parseCrawlerConfig returns defaults when raw is null", () => {
    expect(parseCrawlerConfig(null)).toEqual(DEFAULT_CRAWLER);
  });

  it("parseCrawlerConfig parses proxyUrl", () => {
    const cfg = parseCrawlerConfig(JSON.stringify({ proxyUrl: "http://127.0.0.1:7890" }));
    expect(cfg.proxyUrl).toBe("http://127.0.0.1:7890");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/settingService.test.ts`
Expected: FAIL with `Cannot find module '@/services/settingService'`

- [ ] **Step 3: Create src/services/settingService.ts**

```ts
import { prisma } from "@/lib/db";

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export interface CrawlerConfig {
  rateLimitMs: number;
  proxyUrl: string;
  timeoutSec: number;
}

export const DEFAULT_LLM: LlmConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.8,
};

export const DEFAULT_CRAWLER: CrawlerConfig = {
  rateLimitMs: 3000,
  proxyUrl: "",
  timeoutSec: 30,
};

export function parseLlmConfig(raw: string | null): LlmConfig {
  if (!raw) return { ...DEFAULT_LLM };
  try {
    return { ...DEFAULT_LLM, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_LLM };
  }
}

export function parseCrawlerConfig(raw: string | null): CrawlerConfig {
  if (!raw) return { ...DEFAULT_CRAWLER };
  try {
    return { ...DEFAULT_CRAWLER, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CRAWLER };
  }
}

export async function getLlmConfig(): Promise<LlmConfig> {
  const row = await prisma.setting.findUnique({ where: { key: "llm" } });
  return parseLlmConfig(row?.value ?? null);
}

export async function saveLlmConfig(cfg: LlmConfig): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "llm" },
    update: { value: JSON.stringify(cfg) },
    create: { key: "llm", value: JSON.stringify(cfg) },
  });
}

export async function getCrawlerConfig(): Promise<CrawlerConfig> {
  const row = await prisma.setting.findUnique({ where: { key: "crawler" } });
  return parseCrawlerConfig(row?.value ?? null);
}

export async function saveCrawlerConfig(cfg: CrawlerConfig): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "crawler" },
    update: { value: JSON.stringify(cfg) },
    create: { key: "crawler", value: JSON.stringify(cfg) },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/settingService.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Create src/app/api/settings/route.ts**

```ts
import { NextResponse } from "next/server";
import { getLlmConfig, saveLlmConfig, getCrawlerConfig, saveCrawlerConfig, LlmConfig, CrawlerConfig } from "@/services/settingService";

export async function GET() {
  const [llm, crawler] = await Promise.all([getLlmConfig(), getCrawlerConfig()]);
  return NextResponse.json({ llm, crawler });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as { llm?: LlmConfig; crawler?: CrawlerConfig };
  if (body.llm) await saveLlmConfig(body.llm);
  if (body.crawler) await saveCrawlerConfig(body.crawler);
  const [llm, crawler] = await Promise.all([getLlmConfig(), getCrawlerConfig()]);
  return NextResponse.json({ llm, crawler });
}
```

- [ ] **Step 6: Create src/app/settings/page.tsx**

```tsx
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
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run`
Expected: PASS
Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 8: Commit**

```bash
git add src/services/settingService.ts src/app/api/settings/route.ts src/app/settings/page.tsx tests/settingService.test.ts
git commit -m "feat: add settings module with llm and crawler config"
```

---

## Task 3: 商品服务 + CSV 解析（含测试）

- 商品 CRUD 服务层、列表筛选排序、CSV 解析为纯函数

**Files:**
- Create: `src/services/productService.ts`
- Create: `src/services/csvService.ts`
- Test: `tests/csvService.test.ts`

- [ ] **Step 1: Write the failing test for csvService**

`tests/csvService.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseProductsCsv } from "@/services/csvService";

describe("csvService", () => {
  it("parses standard columns", () => {
    const csv = "名称,链接,价格,佣金率,销量,类目\n测试商品,http://x.com,99,30,1000,家居\n";
    const rows = parseProductsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "测试商品",
      url: "http://x.com",
      price: 99,
      commissionRate: 30,
      dailySales: 1000,
      category: "家居",
    });
  });

  it("handles commissionRate with % sign", () => {
    const rows = parseProductsCsv("名称,佣金率\n商品A,25%\n");
    expect(rows[0].commissionRate).toBe(25);
  });

  it("supports english column names", () => {
    const csv = "name,price\ngoods,50\n";
    const rows = parseProductsCsv(csv);
    expect(rows[0].name).toBe("goods");
    expect(rows[0].price).toBe(50);
  });

  it("skips empty rows and rows without name", () => {
    const csv = "名称,价格\n\n,10\n有名字,5\n";
    const rows = parseProductsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("有名字");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/csvService.test.ts`
Expected: FAIL with `Cannot find module '@/services/csvService'`

- [ ] **Step 3: Create src/services/csvService.ts**

```ts
import { parse } from "csv-parse/sync";

export interface CsvProductRow {
  name: string;
  url?: string;
  category?: string;
  price?: number;
  commissionRate?: number;
  dailySales?: number;
}

const toNum = (v: string | undefined): number | undefined => {
  if (!v || String(v).trim() === "") return undefined;
  const n = Number(String(v).replace("%", "").trim());
  return Number.isFinite(n) ? n : undefined;
};

const toInt = (v: string | undefined): number | undefined => {
  const n = toNum(v);
  return n === undefined ? undefined : Math.round(n);
};

export function parseProductsCsv(text: string): CsvProductRow[] {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  return records
    .map((r) => {
      const name = (r["名称"] ?? r["name"] ?? "").trim();
      return {
        name,
        url: (r["链接"] ?? r["url"] ?? "") || undefined,
        category: (r["类目"] ?? r["category"] ?? "") || undefined,
        price: toNum(r["价格"] ?? r["price"]),
        commissionRate: toNum(r["佣金率"] ?? r["commissionRate"]),
        dailySales: toInt(r["销量"] ?? r["dailySales"]),
      };
    })
    .filter((r) => r.name);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/csvService.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 5: Create src/services/productService.ts**

```ts
import { Prisma, ProductStatus, Trend } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CsvProductRow } from "./csvService";

export interface ProductFilters {
  status?: ProductStatus | "ALL";
  category?: string;
  minRate?: number;
  sort?: "commissionRate" | "dailySales" | "updatedAt";
  order?: "asc" | "desc";
  keyword?: string;
}

export function filterProducts<T extends { name: string; category?: string | null; commissionRate?: number | null; dailySales?: number | null; status: string; updatedAt: Date }>(
  items: T[],
  filters: ProductFilters
): T[] {
  let out = items;
  if (filters.status && filters.status !== "ALL") {
    out = out.filter((p) => p.status === filters.status);
  }
  if (filters.category) {
    out = out.filter((p) => p.category === filters.category);
  }
  if (filters.minRate !== undefined) {
    out = out.filter((p) => (p.commissionRate ?? 0) >= filters.minRate!);
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    out = out.filter((p) => p.name.toLowerCase().includes(kw));
  }
  const sort = filters.sort ?? "updatedAt";
  const order = filters.order ?? "desc";
  return [...out].sort((a, b) => {
    const va = a[sort];
    const vb = b[sort];
    const numA = typeof va === "number" ? va : 0;
    const numB = typeof vb === "number" ? vb : 0;
    return order === "asc" ? numA - numB : numB - numA;
  });
}

export async function listProducts(filters: ProductFilters = {}) {
  const items = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { scriptIdeas: true, assets: true } } },
  });
  const filtered = filterProducts(items, filters);
  return filtered;
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: { scriptIdeas: { orderBy: { createdAt: "desc" } }, assets: true },
  });
}

export interface ProductInput {
  name: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  commissionRate?: number;
  dailySales?: number;
  trend?: Trend;
  note?: string;
  status?: ProductStatus;
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: number, input: Partial<ProductInput>) {
  return prisma.product.update({ where: { id }, data: input });
}

export async function deleteProduct(id: number) {
  return prisma.product.delete({ where: { id } });
}

export async function importProductsCsv(text: string) {
  const rows = parseProductsCsv(text);
  const created = await prisma.$transaction(
    rows.map((row: CsvProductRow) =>
      prisma.product.create({
        data: {
          name: row.name,
          url: row.url,
          category: row.category,
          price: row.price,
          commissionRate: row.commissionRate,
          dailySales: row.dailySales,
          source: "IMPORT",
        },
      })
    )
  );
  return created;
}

export async function getCategories() {
  const rows = await prisma.product.findMany({ select: { category: true }, distinct: ["category"] });
  return rows.map((r) => r.category).filter((c): c is string => !!c);
}

export type { Prisma };
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run`
Expected: PASS
Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 7: Commit**

```bash
git add src/services/productService.ts src/services/csvService.ts tests/csvService.test.ts
git commit -m "feat: add product service and csv parser"
```

---

## Task 4: 商品 API 路由

- 商品列表/创建/详情/更新/删除/CSV 导入/类目列表

**Files:**
- Create: `src/app/api/products/route.ts`
- Create: `src/app/api/products/[id]/route.ts`
- Create: `src/app/api/products/import/route.ts`

- [ ] **Step 1: Create src/app/api/products/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { listProducts, createProduct, ProductFilters } from "@/services/productService";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: ProductFilters = {
    status: (sp.get("status") as ProductFilters["status"]) ?? undefined,
    category: sp.get("category") ?? undefined,
    minRate: sp.get("minRate") ? Number(sp.get("minRate")) : undefined,
    sort: (sp.get("sort") as ProductFilters["sort"]) ?? undefined,
    order: (sp.get("order") as ProductFilters["order"]) ?? undefined,
    keyword: sp.get("keyword") ?? undefined,
  };
  const items = await listProducts(filters);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
```

- [ ] **Step 2: Create src/app/api/products/[id]/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getProduct, updateProduct, deleteProduct } from "@/services/productService";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const product = await updateProduct(Number(id), body);
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteProduct(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
```

- [ ] **Step 3: Create src/app/api/products/import/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { importProductsCsv } from "@/services/productService";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
  const text = await file.text();
  try {
    const created = await importProductsCsv(text);
    return NextResponse.json({ count: created.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 5: Commit**

```bash
git add src/app/api/products/
git commit -m "feat: add product api routes"
```

---

## Task 5: 共享 UI 组件

- 状态徽章、确认对话框、通用按钮/输入

**Files:**
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/ConfirmDialog.tsx`
- Create: `src/components/ui.tsx`

- [ ] **Step 1: Create src/components/StatusBadge.tsx**

```tsx
const STATUS_COLORS: Record<string, string> = {
  CANDIDATE: "bg-gray-100 text-gray-700",
  FOLLOWING: "bg-blue-100 text-blue-700",
  SELECTED: "bg-green-100 text-green-700",
  DROPPED: "bg-red-100 text-red-700",
  DRAFT: "bg-gray-100 text-gray-700",
  ADOPTED: "bg-green-100 text-green-700",
  DISCARDED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  PLANNED: "bg-blue-100 text-blue-700",
  SKIPPED: "bg-gray-100 text-gray-700",
  QUEUED: "bg-gray-100 text-gray-700",
  RUNNING: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  UP: "bg-green-100 text-green-700",
  STEADY: "bg-gray-100 text-gray-700",
  DOWN: "bg-red-100 text-red-700",
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
  const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
```

- [ ] **Step 2: Create src/components/ConfirmDialog.tsx**

```tsx
"use client";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="w-80 rounded-lg bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded border px-3 py-1 text-sm">取消</button>
          <button onClick={onConfirm} className="rounded bg-red-500 px-3 py-1 text-sm text-white">确认</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create src/components/ui.tsx**

```tsx
export function Button({ children, onClick, variant = "primary", className = "", type = "button" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger";
  className?: string; type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-accent text-white hover:opacity-90",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:opacity-90",
  };
  return (
    <button type={type} onClick={onClick} className={`rounded px-3 py-1.5 text-sm ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded border px-2 py-1 text-sm ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded border px-2 py-1 text-sm ${props.className ?? ""}`} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-gray-700">{children}</label>;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add shared ui components"
```

---

## Task 6: 商品页面

- 商品列表（筛选/排序/删除）、新增、详情编辑、CSV 导入

**Files:**
- Create: `src/app/products/page.tsx`
- Create: `src/app/products/new/page.tsx`
- Create: `src/app/products/[id]/page.tsx`
- Create: `src/app/products/import/page.tsx`

- [ ] **Step 1: Create src/app/products/page.tsx**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Input, Select } from "@/components/ui";

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
        <h1 className="text-xl font-bold">商品库</h1>
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
          <div key={p.id} className="rounded border bg-white p-4">
            <div className="flex items-start justify-between">
              <Link href={`/products/${p.id}`} className="font-medium hover:text-accent">{p.name}</Link>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div>类目: {p.category ?? "-"} · 价格: {p.price != null ? `¥${p.price}` : "-"}</div>
              <div>佣金率: {p.commissionRate != null ? `${p.commissionRate}%` : "-"} · 近30天销量: {p.dailySales ?? "-"}</div>
              <div>趋势: <StatusBadge status={p.trend} /> · 脚本 {p._count?.scriptIdeas ?? 0} · 素材 {p._count?.assets ?? 0}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={`/products/${p.id}`}><Button variant="secondary">编辑</Button></Link>
              <Link href={`/scripts/generate?productId=${p.id}`}><Button variant="secondary">生成文案</Button></Link>
              <Button variant="danger" onClick={() => setDel(p)}>删除</Button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="col-span-3 py-10 text-center text-gray-400">暂无商品</p>}
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

- [ ] **Step 2: Create src/app/products/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";

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
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">新增商品</h1>
      <div>
        <Label>商品名称 *</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <Label>商品链接</Label>
        <Input value={form.url} onChange={(e) => set("url", e.target.value)} />
      </div>
      <div>
        <Label>类目</Label>
        <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>价格</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
        <div><Label>佣金率 %</Label><Input type="number" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} /></div>
        <div><Label>近30天销量</Label><Input type="number" value={form.dailySales} onChange={(e) => set("dailySales", e.target.value)} /></div>
      </div>
      <div>
        <Label>备注</Label>
        <Input value={form.note} onChange={(e) => set("note", e.target.value)} />
      </div>
      <Button onClick={submit}>保存</Button>
    </div>
  );
}
```

- [ ] **Step 3: Create src/app/products/[id]/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Button, Input, Label, Select } from "@/components/ui";

interface Product {
  id: number; name: string; url?: string | null; category?: string | null;
  price?: number | null; commissionRate?: number | null; dailySales?: number | null;
  status: string; trend: string; note?: string | null;
  scriptIdeas: { id: number; title?: string | null; status: string; createdAt: string }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then((data) => {
      setP(data);
      setForm({
        name: data.name, url: data.url ?? "", category: data.category ?? "",
        price: data.price ?? "", commissionRate: data.commissionRate ?? "",
        dailySales: data.dailySales ?? "", status: data.status, trend: data.trend, note: data.note ?? "",
      });
    });
  }, [id]);

  if (!p || !form) return <p>加载中...</p>;

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    await fetch(`/api/products/${id}`, {
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
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{p.name}</h1>
        <StatusBadge status={p.status} />
      </div>

      <div className="grid max-w-lg gap-4">
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
      </div>

      <section>
        <h2 className="mb-2 font-semibold">已生成脚本（{p.scriptIdeas.length}）</h2>
        <div className="space-y-2">
          {p.scriptIdeas.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
              <Link href={`/scripts?id=${s.id}`} className="hover:text-accent">{s.title ?? `脚本 #${s.id}`}</Link>
              <StatusBadge status={s.status} />
            </div>
          ))}
          {p.scriptIdeas.length === 0 && <p className="text-sm text-gray-400">暂无脚本</p>}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Create src/app/products/import/page.tsx**

```tsx
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
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 6: Commit**

```bash
git add src/app/products/
git commit -m "feat: add product pages"
```

---

## Task 7: LLM 客户端 + 脚本服务（含测试）

- OpenAI 兼容客户端封装、AI 生成脚本、解析 LLM 返回 JSON

**Files:**
- Create: `src/lib/llm.ts`
- Create: `src/services/scriptParser.ts`
- Create: `src/services/scriptService.ts`
- Test: `tests/scriptParser.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/scriptParser.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseScriptJson } from "@/services/scriptParser";

describe("scriptParser", () => {
  it("parses valid json", () => {
    const raw = JSON.stringify({
      title: "标题", hook: "3秒钩子", body: "正文", shotScript: "分镜",
      hashtags: ["#tag1", "#tag2"], durationSec: 45,
    });
    const s = parseScriptJson(raw);
    expect(s.title).toBe("标题");
    expect(s.hashtags).toEqual(["#tag1", "#tag2"]);
    expect(s.durationSec).toBe(45);
  });

  it("strips code fences", () => {
    const s = parseScriptJson("```json\n{\"title\":\"t\",\"body\":\"b\"}\n```");
    expect(s.title).toBe("t");
  });

  it("extracts json from markdown text", () => {
    const s = parseScriptJson("以下是结果：\n{\"title\":\"t\",\"body\":\"b\"}\n完");
    expect(s.title).toBe("t");
  });

  it("defaults missing fields", () => {
    const s = parseScriptJson("{\"body\":\"only body\"}");
    expect(s.title).toBe("");
    expect(s.hashtags).toEqual([]);
    expect(s.durationSec).toBe(30);
  });

  it("throws on no json", () => {
    expect(() => parseScriptJson("nothing here")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scriptParser.test.ts`
Expected: FAIL with `Cannot find module '@/services/scriptParser'`

- [ ] **Step 3: Create src/services/scriptParser.ts**

```ts
export interface GeneratedScript {
  title: string;
  hook: string;
  body: string;
  shotScript: string;
  hashtags: string[];
  durationSec: number;
}

export function parseScriptJson(raw: string): GeneratedScript {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("no json in llm output");
    obj = JSON.parse(cleaned.slice(start, end + 1));
  }
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : d;
  };
  return {
    title: str(obj.title),
    hook: str(obj.hook),
    body: str(obj.body),
    shotScript: typeof obj.shotScript === "string" ? obj.shotScript : JSON.stringify(obj.shotScript ?? ""),
    hashtags: Array.isArray(obj.hashtags) ? obj.hashtags.map(String) : [],
    durationSec: num(obj.durationSec, 30),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scriptParser.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Create src/lib/llm.ts**

```ts
import OpenAI from "openai";
import { getLlmConfig } from "@/services/settingService";

export class LlmNotConfiguredError extends Error {
  constructor() { super("请先在设置页配置大模型 API Key"); this.name = "LlmNotConfiguredError"; }
}

export async function getLlmClient(): Promise<OpenAI> {
  const cfg = await getLlmConfig();
  if (!cfg.apiKey) throw new LlmNotConfiguredError();
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl || undefined,
  });
}
```

- [ ] **Step 6: Create src/services/scriptService.ts**

```ts
import { ScriptStyle, ScriptStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLlmClient } from "@/lib/llm";
import { getLlmConfig } from "./settingService";
import { parseScriptJson } from "./scriptParser";

const STYLE_LABEL: Record<ScriptStyle, string> = {
  SPOKEN: "口播带货", REVIEW: "测评", STORY: "剧情", UNBOXING: "开箱",
};

export interface GenerateInput {
  productId?: number;
  productName: string;
  sellingPoints: string;
  style: ScriptStyle;
  durationSec: number;
}

export async function generateScript(input: GenerateInput) {
  const [client, cfg] = await Promise.all([getLlmClient(), getLlmConfig()]);
  const prompt = buildPrompt(input, STYLE_LABEL[input.style]);

  const res = await client.chat.completions.create({
    model: cfg.model,
    temperature: cfg.temperature,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "你是抖音带货短视频脚本专家。根据用户提供的商品信息生成带货脚本，只输出 JSON，不要输出其他内容。JSON 字段：title(标题), hook(黄金3秒钩子), body(口播正文), shotScript(分镜脚本,用\n分隔每行), hashtags(话题标签数组,每个以#开头), durationSec(数字)。",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "";
  const parsed = parseScriptJson(raw);

  return prisma.scriptIdea.create({
    data: {
      productId: input.productId ?? null,
      title: parsed.title || null,
      hook: parsed.hook || null,
      body: parsed.body,
      shotScript: parsed.shotScript || null,
      hashtags: parsed.hashtags.length ? JSON.stringify(parsed.hashtags) : null,
      style: input.style,
      durationSec: parsed.durationSec,
      llmModel: cfg.model,
      status: ScriptStatus.DRAFT,
    },
  });
}

export function buildPrompt(input: GenerateInput, styleLabel: string): string {
  const productLine = input.productId
    ? `商品名称：${input.productName}\n卖点：${input.sellingPoints}`
    : `商品信息：${input.productName}\n卖点：${input.sellingPoints || "（未填写，请合理发挥）"}`;
  return `${productLine}\n风格：${styleLabel}\n目标时长：${input.durationSec}秒`;
}

export async function listScripts() {
  return prisma.scriptIdea.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true } } },
  });
}

export async function getScript(id: number) {
  return prisma.scriptIdea.findUnique({ where: { id }, include: { product: true } });
}

export async function setScriptStatus(id: number, status: ScriptStatus) {
  return prisma.scriptIdea.update({ where: { id }, data: { status } });
}

export async function deleteScript(id: number) {
  return prisma.scriptIdea.delete({ where: { id } });
}

export async function batchGenerate(inputs: GenerateInput[]) {
  const results = [];
  for (const input of inputs) {
    try {
      results.push({ ok: true as const, script: await generateScript(input) });
    } catch (e) {
      results.push({ ok: false as const, error: String(e), input });
    }
  }
  return results;
}
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run`
Expected: PASS
Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 8: Commit**

```bash
git add src/lib/llm.ts src/services/scriptParser.ts src/services/scriptService.ts tests/scriptParser.test.ts
git commit -m "feat: add llm client and script generation service"
```

---

## Task 8: 脚本 API 路由

- 列表/详情/生成/批量生成/状态更新/删除

**Files:**
- Create: `src/app/api/scripts/route.ts`
- Create: `src/app/api/scripts/generate/route.ts`
- Create: `src/app/api/scripts/batch/route.ts`
- Create: `src/app/api/scripts/[id]/route.ts`

- [ ] **Step 1: Create src/app/api/scripts/route.ts**

```ts
import { NextResponse } from "next/server";
import { listScripts } from "@/services/scriptService";

export async function GET() {
  const scripts = await listScripts();
  return NextResponse.json(scripts);
}
```

- [ ] **Step 2: Create src/app/api/scripts/generate/route.ts**

```ts
import { NextResponse } from "next/server";
import { generateScript, GenerateInput } from "@/services/scriptService";
import { LlmNotConfiguredError } from "@/lib/llm";
import { getProduct } from "@/services/productService";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    let input: GenerateInput;
    if (body.productId) {
      const product = await getProduct(Number(body.productId));
      if (!product) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
      input = {
        productId: product.id,
        productName: product.name,
        sellingPoints: body.sellingPoints ?? product.note ?? product.category ?? "",
        style: body.style ?? "SPOKEN",
        durationSec: Number(body.durationSec ?? 30),
      };
    } else {
      input = {
        productName: body.productName,
        sellingPoints: body.sellingPoints ?? "",
        style: body.style ?? "SPOKEN",
        durationSec: Number(body.durationSec ?? 30),
      };
    }
    const script = await generateScript(input);
    return NextResponse.json(script, { status: 201 });
  } catch (e) {
    const status = e instanceof LlmNotConfiguredError ? 400 : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status });
  }
}
```

- [ ] **Step 3: Create src/app/api/scripts/batch/route.ts**

```ts
import { NextResponse } from "next/server";
import { batchGenerate, GenerateInput } from "@/services/scriptService";
import { getProduct } from "@/services/productService";

export async function POST(req: Request) {
  const body = await req.json();
  const ids: number[] = body.productIds ?? [];
  const style = body.style ?? "SPOKEN";
  const durationSec = Number(body.durationSec ?? 30);
  const inputs: GenerateInput[] = [];
  for (const id of ids) {
    const product = await getProduct(Number(id));
    if (product) {
      inputs.push({
        productId: product.id,
        productName: product.name,
        sellingPoints: product.note ?? product.category ?? "",
        style,
        durationSec,
      });
    }
  }
  if (!inputs.length) return NextResponse.json({ error: "没有有效的商品" }, { status: 400 });
  const results = await batchGenerate(inputs);
  return NextResponse.json(results);
}
```

- [ ] **Step 4: Create src/app/api/scripts/[id]/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getScript, setScriptStatus, deleteScript } from "@/services/scriptService";
import { ScriptStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const script = await getScript(Number(id));
  if (!script) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(script);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { status?: ScriptStatus };
  if (!body.status) return NextResponse.json({ error: "no status" }, { status: 400 });
  const script = await setScriptStatus(Number(id), body.status);
  return NextResponse.json(script);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteScript(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 6: Commit**

```bash
git add src/app/api/scripts/
git commit -m "feat: add script api routes"
```

---

## Task 9: 脚本页面

- 生成页（选品/手动 + 风格 + 时长）、脚本列表、批量生成

**Files:**
- Create: `src/app/scripts/page.tsx`
- Create: `src/app/scripts/generate/page.tsx`

- [ ] **Step 1: Create src/app/scripts/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">脚本文案</h1>
        <Link href="/scripts/generate"><Button>生成脚本</Button></Link>
      </div>

      <div className="space-y-3">
        {scripts.map((s) => (
          <div key={s.id} className="rounded border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {s.title ?? `脚本 #${s.id}`}
                {s.product && <span className="ml-2 text-sm text-gray-500">· {s.product.name}</span>}
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {s.style} · {s.durationSec}s · {s.llmModel ?? ""} · {new Date(s.createdAt).toLocaleString()}
            </div>
            <div className="mt-2 line-clamp-2 text-sm text-gray-700">{s.body}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(s)}>查看</Button>
              <Button variant="secondary" onClick={() => { setStatus(s, "ADOPTED"); }}>采用</Button>
              <Button variant="danger" onClick={() => setDel(s)}>删除</Button>
            </div>
          </div>
        ))}
        {scripts.length === 0 && <p className="py-10 text-center text-gray-400">暂无脚本</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-lg bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold">{open.title ?? `脚本 #${open.id}`}</h3>
              <button onClick={() => setOpen(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><b>黄金3秒钩子：</b>{open.hook ?? "-"}</div>
              <div><b>口播正文：</b><p className="whitespace-pre-wrap">{open.body}</p></div>
              {open.shotScript && <div><b>分镜脚本：</b><p className="whitespace-pre-wrap">{open.shotScript}</p></div>}
              {open.hashtags && <div><b>标签：</b>{JSON.parse(open.hashtags).join(" ")}</div>}
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

- [ ] **Step 2: Create src/app/scripts/generate/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
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

export default function GeneratePage() {
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
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 4: Commit**

```bash
git add src/app/scripts/
git commit -m "feat: add script pages"
```

---

## Task 10: 素材与排期服务

- 素材上传存储、素材 CRUD、排期 CRUD，纯函数排序逻辑

**Files:**
- Create: `src/services/assetService.ts`
- Create: `src/services/scheduleService.ts`

- [ ] **Step 1: Create src/services/assetService.ts**

```ts
import { AssetType, AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface AssetInput {
  productId?: number;
  scriptId?: number;
  fileName: string;
  filePath: string;
  fileType: AssetType;
  size: number;
  coverPath?: string;
  title?: string;
  tags?: string;
  status?: AssetStatus;
}

export async function createAsset(input: AssetInput) {
  return prisma.asset.create({ data: input });
}

export async function listAssets() {
  return prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true } },
      script: { select: { id: true, title: true } },
      schedules: true,
    },
  });
}

export async function getAsset(id: number) {
  return prisma.asset.findUnique({ where: { id }, include: { schedules: true, product: true, script: true } });
}

export async function updateAsset(id: number, input: Partial<AssetInput>) {
  return prisma.asset.update({ where: { id }, data: input });
}

export async function deleteAsset(id: number) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (asset) {
    const abs = path.join(process.cwd(), asset.filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    if (asset.coverPath) {
      const cover = path.join(process.cwd(), asset.coverPath);
      if (fs.existsSync(cover)) fs.unlinkSync(cover);
    }
  }
  return prisma.asset.delete({ where: { id } });
}

export function getFileExt(name: string): AssetType {
  const ext = path.extname(name).toLowerCase();
  return [".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext) ? "VIDEO" : "IMAGE";
}
```

- [ ] **Step 2: Create src/services/scheduleService.ts**

```ts
import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listSchedules() {
  return prisma.schedule.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { asset: { include: { product: { select: { id: true, name: true } } } } },
  });
}

export async function createSchedule(assetId: number, scheduledAt: Date) {
  return prisma.schedule.create({ data: { assetId, scheduledAt } });
}

export async function updateSchedule(id: number, input: Partial<{
  scheduledAt: Date;
  publishStatus: PublishStatus;
  publishUrl?: string;
  publishedAt?: Date;
}>) {
  return prisma.schedule.update({ where: { id }, data: input });
}

export async function deleteSchedule(id: number) {
  return prisma.schedule.delete({ where: { id } });
}

export function sortSchedules<T extends { scheduledAt: Date }>(items: T[], order: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) =>
    order === "asc"
      ? a.scheduledAt.getTime() - b.scheduledAt.getTime()
      : b.scheduledAt.getTime() - a.scheduledAt.getTime()
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 4: Commit**

```bash
git add src/services/assetService.ts src/services/scheduleService.ts
git commit -m "feat: add asset and schedule services"
```

---

## Task 11: 素材与排期 API

- 素材上传（multipart 存本地 data/uploads）、素材 CRUD、排期 CRUD、文件下载

**Files:**
- Create: `src/app/api/assets/route.ts`
- Create: `src/app/api/assets/upload/route.ts`
- Create: `src/app/api/assets/[id]/route.ts`
- Create: `src/app/api/schedules/route.ts`
- Create: `src/app/api/schedules/[id]/route.ts`
- Create: `src/app/api/files/[name]/route.ts`

- [ ] **Step 1: Create src/app/api/assets/upload/route.ts**

```ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { createAsset, ensureUploadDir, getFileExt, UPLOAD_DIR } from "@/services/assetService";

export async function POST(req: Request) {
  ensureUploadDir();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const ext = path.extname(file.name) || ".bin";
  const savedName = `${randomUUID()}${ext}`;
  const abs = path.join(UPLOAD_DIR, savedName);
  const buf = Buffer.from(await file.arrayBuffer());
  await import("fs/promises").then((fsp) => fsp.writeFile(abs, buf));

  const relPath = `data/uploads/${savedName}`;
  const asset = await createAsset({
    fileName: file.name,
    filePath: relPath,
    fileType: getFileExt(file.name),
    size: buf.length,
    productId: form.get("productId") ? Number(form.get("productId")) : undefined,
    scriptId: form.get("scriptId") ? Number(form.get("scriptId")) : undefined,
    title: (form.get("title") as string) || undefined,
    tags: (form.get("tags") as string) || undefined,
  });
  return NextResponse.json(asset, { status: 201 });
}
```

- [ ] **Step 2: Create src/app/api/assets/route.ts**

```ts
import { NextResponse } from "next/server";
import { listAssets } from "@/services/assetService";

export async function GET() {
  const assets = await listAssets();
  return NextResponse.json(assets);
}
```

- [ ] **Step 3: Create src/app/api/assets/[id]/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAsset, updateAsset, deleteAsset } from "@/services/assetService";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await getAsset(Number(id));
  if (!asset) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const asset = await updateAsset(Number(id), body);
    return NextResponse.json(asset);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteAsset(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
```

- [ ] **Step 4: Create src/app/api/schedules/route.ts**

```ts
import { NextResponse } from "next/server";
import { listSchedules, createSchedule } from "@/services/scheduleService";

export async function GET() {
  const schedules = await listSchedules();
  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const schedule = await createSchedule(Number(body.assetId), new Date(body.scheduledAt));
    return NextResponse.json(schedule, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
```

- [ ] **Step 5: Create src/app/api/schedules/[id]/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { updateSchedule, deleteSchedule } from "@/services/scheduleService";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    const schedule = await updateSchedule(Number(id), {
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      publishStatus: body.publishStatus,
      publishUrl: body.publishUrl,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    });
    return NextResponse.json(schedule);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteSchedule(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
```

- [ ] **Step 6: Create src/app/api/files/[name]/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = path.basename(name);
  const abs = path.join(process.cwd(), "data", "uploads", safe);
  if (!fs.existsSync(abs)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const buf = fs.readFileSync(abs);
  const ext = path.extname(safe).toLowerCase();
  const contentType =
    ext === ".mp4" ? "video/mp4" :
    ext === ".webm" ? "video/webm" :
    ext === ".png" ? "image/png" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": contentType } });
}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 8: Commit**

```bash
git add src/app/api/assets/ src/app/api/schedules/ src/app/api/files/
git commit -m "feat: add asset and schedule api routes"
```

---

## Task 12: 素材与排期页面

- 上传素材、素材列表、排期创建/发布状态更新

**Files:**
- Create: `src/app/assets/page.tsx`

- [ ] **Step 1: Create src/app/assets/page.tsx**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, Input, Label, Select } from "@/components/ui";

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
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [scripts, setScripts] = useState<{ id: number; title?: string | null }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [del, setDel] = useState<Asset | null>(null);

  const load = useCallback(() => {
    fetch("/api/assets").then((r) => r.json()).then(setAssets);
    fetch("/api/schedules").then((r) => r.json()).then(setSchedules);
    fetch("/api/products?status=ALL").then((r) => r.json()).then(setProducts);
    fetch("/api/scripts").then((r) => r.json()).then(setScripts);
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
        <h1 className="text-xl font-bold">素材与排期</h1>
        <label className="cursor-pointer rounded bg-accent px-4 py-2 text-sm text-white hover:opacity-90">
          {uploading ? "上传中..." : "上传素材"}
          <input type="file" accept="video/*,image/*" className="hidden" onChange={upload} />
        </label>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">素材库（{assets.length}）</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="rounded border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <StatusBadge status={a.status} />
                <button onClick={() => setDel(a)} className="text-xs text-gray-400 hover:text-red-500">删除</button>
              </div>
              <div className="text-sm font-medium">{a.title ?? a.fileName}</div>
              <div className="text-xs text-gray-500">
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
                    <div key={s.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
                      <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                      <StatusBadge status={s.publishStatus} />
                      {s.publishStatus === "PLANNED" && (
                        <Button variant="secondary" className="text-xs" onClick={() => markPublished(s)}>发布</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {assets.length === 0 && <p className="col-span-full py-10 text-center text-gray-400">暂无素材，点右上角上传</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">排期时间线</h2>
        <div className="space-y-2">
          {schedules.map((s) => {
            const asset = assets.find((a) => a.schedules.some((x) => x.id === s.id));
            return (
              <div key={s.id} className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{new Date(s.scheduledAt).toLocaleString()}</span>
                  <span className="ml-3 text-gray-500">{asset?.title ?? asset?.fileName ?? "素材已删除"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.publishStatus} />
                  {s.publishUrl && <a href={s.publishUrl} target="_blank" className="text-xs text-blue-600">链接</a>}
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && <p className="py-6 text-center text-sm text-gray-400">暂无排期</p>}
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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 3: Commit**

```bash
git add src/app/assets/
git commit -m "feat: add assets page with upload and schedule"
```

---

## Task 13: 仪表盘

- 首页统计：商品数、待生成脚本数、本周排期数、近7天发布数

**Files:**
- Create: `src/app/api/dashboard/route.ts`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create src/app/api/dashboard/route.ts**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 3600 * 1000);

  const [productCount, noScriptCount, weekSchedules, recentPublished] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { scriptIdeas: { none: {} } } }),
    prisma.schedule.count({ where: { scheduledAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.schedule.count({
      where: { publishStatus: "PUBLISHED", publishedAt: { gte: weekAgo } },
    }),
  ]);

  return NextResponse.json({ productCount, noScriptCount, weekSchedules, recentPublished });
}
```

- [ ] **Step 2: Create src/app/page.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <h1 className="text-xl font-bold">仪表盘</h1>
      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.label} href={c.href} className="rounded border bg-white p-4 hover:shadow">
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="mt-1 text-2xl font-bold">{c.value}</div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">加载中...</p>
      )}

      <div className="rounded border bg-white p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-900">使用流程</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li><Link href="/products/new" className="text-blue-600 hover:underline">录入/导入商品</Link>，或用<a href="/products/tasks" className="text-blue-600 hover:underline">爬虫</a>抓取</li>
          <li>在<a href="/scripts/generate" className="text-blue-600 hover:underline">脚本文案</a>页面批量生成文案</li>
          <li>在<a href="/assets" className="text-blue-600 hover:underline">素材排期</a>上传视频并安排发布</li>
          <li>发布后在排期里回填抖音链接</li>
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 4: Commit**

```bash
git add src/app/api/dashboard/route.ts src/app/page.tsx
git commit -m "feat: add dashboard"
```

---

## Task 14: 爬虫（Playwright runner + 任务服务 + API）

- 关键词搜索爬虫独立脚本，后端排队调度，失败重试，状态表驱动

**Files:**
- Create: `src/services/taskRunner.ts`
- Create: `src/crawlers/runner.ts`
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/retry/route.ts`
- Create: `src/app/products/tasks/page.tsx`

- [ ] **Step 1: 安装 playwright**

Run: `npm install -D playwright`
Run: `npx playwright install chromium`
Expected: 成功安装 chromium 浏览器

- [ ] **Step 2: Create src/services/taskRunner.ts**

```ts
import { ScrapeTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCrawlerConfig } from "./settingService";
import { spawn } from "child_process";
import path from "path";

export interface TaskCreateInput {
  type: "KEYWORD" | "LINK";
  keyword?: string;
  url?: string;
  productId?: number;
}

export async function createTask(input: TaskCreateInput) {
  return prisma.scrapeTask.create({
    data: {
      type: input.type,
      keyword: input.keyword,
      url: input.url,
      productId: input.productId,
      status: ScrapeTaskStatus.QUEUED,
    },
  });
}

export async function listTasks() {
  return prisma.scrapeTask.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true } } },
    take: 50,
  });
}

export async function getTask(id: number) {
  return prisma.scrapeTask.findUnique({ where: { id } });
}

export function spawnRunner(taskId: number) {
  const runnerPath = path.join(process.cwd(), "src", "crawlers", "runner.ts");
  const child = spawn("npx", ["tsx", runnerPath, String(taskId)], {
    detached: true,
    stdio: "ignore",
    shell: true,
  });
  child.unref();
}

export async function retryTask(id: number) {
  const task = await prisma.scrapeTask.findUnique({ where: { id } });
  if (!task) return null;
  const updated = await prisma.scrapeTask.update({
    where: { id },
    data: { status: ScrapeTaskStatus.QUEUED, message: null, retryCount: { increment: 1 } },
  });
  spawnRunner(id);
  return updated;
}

export async function pollQueuedTasks() {
  const queued = await prisma.scrapeTask.findMany({
    where: { status: ScrapeTaskStatus.QUEUED },
    take: 5,
  });
  for (const t of queued) {
    spawnRunner(t.id);
  }
  return queued.length;
}

export async function checkPlaywright() {
  try {
    const { chromium } = await import("playwright");
    const cfg = await getCrawlerConfig();
    const executable = chromium.executablePath();
    const fs = await import("fs");
    return { installed: fs.existsSync(executable), crawlerConfig: cfg };
  } catch (e) {
    return { installed: false, error: String(e) };
  }
}
```

- [ ] **Step 3: Create src/crawlers/runner.ts**

```ts
import "dotenv/config";
import { chromium } from "playwright";
import { ScrapeTaskStatus } from "@prisma/client";
import { prisma } from "../lib/db";
import { getCrawlerConfig } from "../services/settingService";
import { parseProductsCsv } from "../services/csvService";

async function main() {
  const taskId = Number(process.argv[2]);
  if (!taskId) {
    console.error("usage: tsx runner.ts <taskId>");
    process.exit(1);
  }

  const task = await prisma.scrapeTask.findUnique({ where: { id: taskId } });
  if (!task || task.status !== ScrapeTaskStatus.QUEUED) {
    process.exit(0);
  }

  await prisma.scrapeTask.update({ where: { id: taskId }, data: { status: ScrapeTaskStatus.RUNNING, startedAt: new Date() } });

  const cfg = await getCrawlerConfig();
  const maxRetries = 2;

  try {
    const browser = await chromium.launch({ headless: true, proxy: cfg.proxyUrl ? { server: cfg.proxyUrl } : undefined });
    const page = await browser.newPage();
    await page.setDefaultTimeout(cfg.timeoutSec * 1000);

    const rows: Array<{ name: string; url?: string; category?: string; price?: number; commissionRate?: number; dailySales?: number }> = [];

    if (task.type === "KEYWORD" && task.keyword) {
      // 抖音精选联盟/搜索页没有稳定公开结构，这里用通用电商搜索 fallback。
      // 用户可在 settings 里配置后自行替换目标页；结构变化时此段可单独调整。
      await page.goto(`https://www.baidu.com/s?wd=${encodeURIComponent(task.keyword + " 抖音 带货 商品")}`);
      await page.waitForTimeout(1500);
      const links = await page.$$eval("h3", (els) =>
        els.slice(0, 5).map((el) => ({
          name: el.textContent?.trim() ?? "",
          url: el.querySelector("a")?.getAttribute("href") ?? "",
        }))
      );
      for (const l of links) {
        if (l.name) {
          rows.push({ name: l.name, url: l.url || undefined, category: task.keyword });
          await new Promise((r) => setTimeout(r, cfg.rateLimitMs));
        }
      }
    } else if (task.type === "LINK" && task.url) {
      await page.goto(task.url);
      await page.waitForTimeout(2000);
      const title = await page.title();
      if (title) rows.push({ name: title, url: task.url });
    }

    await browser.close();

    if (!rows.length) {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: {
          status: ScrapeTaskStatus.FAILED,
          message: "未抓取到数据。抖音页面结构变动或风控拦截，请改用手动录入或 CSV 导入。",
          finishedAt: new Date(),
        },
      });
      process.exit(0);
    }

    for (const row of rows) {
      await prisma.product.create({
        data: {
          name: row.name,
          url: row.url,
          category: row.category,
          price: row.price,
          commissionRate: row.commissionRate,
          dailySales: row.dailySales,
          source: "CRAWLER",
        },
      });
    }

    await prisma.scrapeTask.update({
      where: { id: taskId },
      data: {
        status: ScrapeTaskStatus.SUCCESS,
        message: `成功抓取 ${rows.length} 条并入库`,
        finishedAt: new Date(),
      },
    });
  } catch (e) {
    const current = await prisma.scrapeTask.findUnique({ where: { id: taskId } });
    const retries = (current?.retryCount ?? 0) + 1;
    if (retries <= maxRetries) {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: { status: ScrapeTaskStatus.QUEUED, retryCount: retries },
      });
      const delay = Math.pow(2, retries) * 1000;
      setTimeout(() => process.exit(0), delay);
    } else {
      await prisma.scrapeTask.update({
        where: { id: taskId },
        data: {
          status: ScrapeTaskStatus.FAILED,
          message: `抓取失败：${e instanceof Error ? e.message : String(e)}`,
          finishedAt: new Date(),
        },
      });
      process.exit(0);
    }
  }
}

main().finally(() => process.exit(0));
```

- [ ] **Step 4: Create src/app/api/tasks/route.ts**

```ts
import { NextResponse } from "next/server";
import { createTask, listTasks, spawnRunner, checkPlaywright } from "@/services/taskRunner";

export async function GET() {
  const [tasks, pw] = await Promise.all([listTasks(), checkPlaywright()]);
  return NextResponse.json({ tasks, playwright: pw });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.keyword && !body.url) {
    return NextResponse.json({ error: "需要 keyword 或 url" }, { status: 400 });
  }
  const task = await createTask({
    type: body.url ? "LINK" : "KEYWORD",
    keyword: body.keyword,
    url: body.url,
    productId: body.productId ? Number(body.productId) : undefined,
  });
  spawnRunner(task.id);
  return NextResponse.json(task, { status: 201 });
}
```

- [ ] **Step 5: Create src/app/api/tasks/[id]/retry/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { retryTask } from "@/services/taskRunner";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await retryTask(Number(id));
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(task);
}
```

- [ ] **Step 6: Create src/app/products/tasks/page.tsx**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { Button, Input, Label } from "@/components/ui";

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
        <h1 className="text-xl font-bold">爬虫任务</h1>
        <Link href="/products"><span className="text-sm text-blue-600 hover:underline">返回商品库</span></Link>
      </div>

      {!pwOk && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          Playwright 浏览器未安装。运行 <code>npx playwright install chromium</code> 后重启。此问题不影响其他功能。
        </div>
      )}

      <div className="rounded border bg-white p-4">
        <Label>关键词搜索</Label>
        <div className="flex gap-2">
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例如：厨房 收纳 爆款" />
          <Button onClick={() => submit("KEYWORD")}>抓取</Button>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <Label>链接抓取</Label>
        <div className="flex gap-2">
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          <Button onClick={() => submit("LINK")}>抓取</Button>
        </div>
      </div>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}

      <section>
        <h2 className="mb-2 font-semibold">任务列表</h2>
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm">
              <div>
                <div className="font-medium">
                  {t.type === "KEYWORD" ? `关键词: ${t.keyword}` : `链接: ${t.url}`}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(t.createdAt).toLocaleString()} · 重试 {t.retryCount} 次
                </div>
                {t.message && <div className="text-xs text-gray-600">{t.message}</div>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {t.status === "FAILED" && <Button variant="secondary" className="text-xs" onClick={() => retry(t.id)}>重试</Button>}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="py-6 text-center text-sm text-gray-400">暂无任务</p>}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 7: 安装 dotenv 依赖并验证**

Run: `npm install dotenv`
Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 8: Commit**

```bash
git add src/services/taskRunner.ts src/crawlers/ src/app/api/tasks/ src/app/products/tasks/
git commit -m "feat: add playwright crawler and task center"
```

---

## Task 15: 最终验证

- 全量测试、typecheck、构建、手动验收

**Files:** 无新增

- [ ] **Step 1: 全量测试**

Run: `npx vitest run`
Expected: 全部 PASS（settingService 5 + csvService 4 + scriptParser 5）

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无 TS 错误

- [ ] **Step 3: 构建**

Run: `npm run build`
Expected: 构建成功，所有路由编译通过

- [ ] **Step 4: 启动并手动验收**

Run: `npm run dev`，浏览器打开 `http://localhost:3000`

验收清单：
1. 设置页填写 LLM 配置并保存，重进仍在
2. 手动新增商品 → 列表出现 → 编辑状态为「跟进」
3. CSV 导入模板文件 → 提示成功条数
4. 商品详情点「生成文案」→ 生成后脚本列表可见 → 标记「采用」
5. 上传一个视频素材 → 素材出现 → 添加排期 → 标记「发布」并填链接
6. 仪表盘 4 个数字变化正确
7. 任务中心创建关键词任务 → 状态流转 RUNNING → SUCCESS/FAILED（失败可重试）

- [ ] **Step 5: 提交（如有遗漏文件）**

```bash
git add -A
git commit -m "chore: final verification"
```

---

## 测试覆盖汇总

| 文件 | 用例数 | 验证点 |
|------|--------|--------|
| `tests/settingService.test.ts` | 5 | 配置默认值、合并、容错 |
| `tests/csvService.test.ts` | 4 | 标准列、%号、英文列名、空行 |
| `tests/scriptParser.test.ts` | 5 | 合法JSON、代码围栏、markdown提取、默认值、无JSON抛错 |

## 风险与备注

- **爬虫稳定性**：抖音无公开商品 API，页面结构随时变动且有风控。`src/crawlers/runner.ts` 已做重试+限速+代理支持，抓不到时任务标记失败并提示改用手动/CSV。`taskRunner.spawnRunner` 用 `npx tsx` 起子进程。
- **LLM 输出容错**：`parseScriptJson` 容忍代码围栏和 Markdown 包裹，失败抛错由 API 层转为友好提示。
- **素材存储**：文件存 `data/uploads/`（已 gitignore），删除素材同步删磁盘文件。
- **P2 未包含**：效果跟踪、日历增强、发布提醒、登录权限，留待后续 spec。