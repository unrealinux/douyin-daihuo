# 抖音带货助手

抖音 / 视频号 AI 视频带货的本地运营工具。覆盖选品、对标拆解、二创文案生成、素材打包、排期发布、数据复盘、账号矩阵七个环节。

单人本地使用，数据存 SQLite，不上云、无登录。

- 方法论与操作 SOP：[docs/sop/douyin-ai-video-ecommerce-sop.md](docs/sop/douyin-ai-video-ecommerce-sop.md)
- 代码与 SOP 的差距、迭代路线：[docs/sop/gap-analysis-and-roadmap.md](docs/sop/gap-analysis-and-roadmap.md)

## 快速开始

环境要求：Node.js 18.18+（开发时用的是 24.x）。

1. 装依赖
   ```bash
   npm install
   ```

2. 建配置文件
   ```bash
   cp .env.example .env
   ```
   默认 `DATABASE_URL="file:../data/douyin.db"`，路径是相对 `prisma/` 目录的，指向仓库根的 `data/`。

3. 建库
   ```bash
   npm run db:push
   ```
   会创建 `data/douyin.db`。`data/` 已被 gitignore，库里是你的真实数据，不会被提交。

4. 启动
   ```bash
   npm run dev
   ```
   打开 http://127.0.0.1:3000

5. 配 LLM（生成文案必需）
   进 `/settings` 填 `baseUrl` / `apiKey` / `model`。默认为 OpenAI 兼容接口，可指向任何兼容网关。
   Key 存在本地 SQLite 的 `Setting` 表里，接口返回时脱敏为 `••••••••`。

## 常用脚本

| 命令 | 作用 |
|------|------|
| `npm run dev` | 开发服务器，只绑 `127.0.0.1` |
| `npm run build` | 生产构建 |
| `npm run start` | 跑生产构建，只绑 `127.0.0.1` |
| `npm test` | Vitest 单测（19 个文件 / 123 例） |
| `npm run db:push` | 同步 Prisma schema 到 SQLite |
| `npm run db:studio` | 打开 Prisma Studio 看数据 |
| `npx tsc --noEmit` | 类型检查（无 npm script，直接调） |

## 目录结构

```
prisma/schema.prisma   数据模型（商品/对标/脚本/素材/排期/账号/复盘/设置）
src/lib/               纯函数业务逻辑，全部有单测
src/services/          数据访问与流程编排
src/app/api/           REST 路由，只做参数解析和响应
src/app/               页面（App Router）
src/crawlers/          选品爬虫（Playwright 子进程）
src/components/        通用 UI 组件
tests/                 Vitest，主要打 src/lib
docs/                  SOP、路线图、历史设计文档
```

分层约定：`lib` 不碰数据库，`services` 不含 HTTP 概念，`api` 不写业务逻辑。

## 已知限制

- **爬虫是占位实现，且需要额外装浏览器**：`KEYWORD` 模式实际是抓百度搜索结果标题，`LINK` 模式只取页面 title，都不是真正的精选联盟采集。要用得先 `npx playwright install chromium`（约 150MB），否则 `/products/tasks` 提交的任务会一直失败。建议直接走 CSV 导入或手动录入。
- **schema 变更无迁移文件**：只有 `prisma/schema.prisma`，靠 `db:push` 推进。改字段前先备份 `data/douyin.db`。
- **对标数据手动录入**：平台自动化采集未实现（风控与维护成本高），当前在对标库手动填。
- **剪映草稿不自动生成**：素材包导出 zip 里是分镜 / 口播 / 封面提示词等文本，剪映里的装配仍人工。
- **无登录鉴权**：靠绑定回环地址保护。用 `node .next/standalone/server.js` 部署时它读 `HOSTNAME` 环境变量，默认 `0.0.0.0`，会绕开这个保护，需要自己设 `HOSTNAME=127.0.0.1`。
