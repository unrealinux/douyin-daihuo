# 抖音短视频带货辅助工具 — 设计文档

日期：2026-08-11
状态：已批准

## 1. 背景与目标

为抖音短视频带货个人卖家搭建一套本地工具，跑通「抓品 → 筛品 → 生成文案 → 备素材 → 排期发布」的完整闭环。个人本地单机使用，无需登录和权限。

### 核心范围（第一阶段）

1. 选品商品库 — 管理候选商品，支持手动录入、CSV 导入、自动爬取
2. 脚本文案生成 — 接入大模型 API，批量产出带货标题/钩子/口播/分镜/标签
3. 素材与排期 — 上传素材（视频/封面），关联商品和脚本，制定发布排期

推迟到后续版本：效果跟踪（Performance 表）、日历看板增强、发布提醒。

## 2. 技术栈

- Next.js 15（App Router）+ TypeScript + Tailwind CSS
- Prisma ORM + SQLite — 单文件数据库，本地零配置
- Playwright — 数据抓取，独立脚本由后端异步调度
- OpenAI SDK — 兼容任意 OpenAI 兼容接口（OpenAI / DeepSeek / 通义等），baseUrl/apiKey/model 可配置

## 3. 整体架构

```
本地浏览器 --> Next.js (App Router + TypeScript)
                  |
      +-----------+-----------+
      |           |           |
  商品库模块   脚本文案     素材与排期
  (页面/API)  (页面/API)    (页面/API)
      +-------+-+-----+-----+
              V       V
           服务层 services/
      +-------+-------+-------+
      |       |       |       |
  [SQLite] [LLM API] [Playwright 爬虫] [文件存储 data/]
```

### 项目结构

```
douyin/
├── prisma/schema.prisma        # 数据模型
├── src/
│   ├── app/                    # 页面 + API 路由
│   │   ├── products/           # 商品库
│   │   ├── scripts/            # 脚本文案
│   │   ├── assets/             # 素材与排期
│   │   └── settings/           # LLM/爬虫/通用配置
│   ├── services/               # 业务逻辑（独立可测）
│   ├── lib/                    # db、llm client、工具函数
│   ├── crawlers/               # Playwright 爬虫脚本
│   └── components/             # 共享 UI 组件
├── data/                       # SQLite 文件 + 上传素材存放
└── 全局配置文件                # 存 LLM key、爬虫参数
```

### 关键设计决定

- 爬虫不放在 API 请求内：改为后端异步任务（内存队列 + 状态表），超长抓取不阻塞页面，用户可轮询任务进度
- 爬虫脚本独立成可执行文件，由后端进程调度
- LLM key 只存在本地文件/数据库，绝不写进前端
- SQLite + Prisma 本地单文件，无外部依赖

## 4. 数据模型

Prisma + SQLite 核心 6 张表：

### Product（商品）

- id, name, url, imageUrl, category
- price, commissionRate（佣金率 %）, dailySales（近30天销量）
- trend（趋势: UP/STEADY/DOWN）, source（MANUAL/IMPORT/CRAWLER）
- status（CANDIDATE/FOLLOWING/SELECTED/DROPPED）, note
- createdAt, updatedAt
- 一对多 → ScrapeTask, ScriptIdea

### ScrapeTask（爬虫任务）

- id, productId?, type（KEYWORD/LINK）, keyword, url
- status（QUEUED/RUNNING/SUCCESS/FAILED）, message
- retryCount, createdAt, finishedAt

### ScriptIdea（脚本灵感/生成记录）

- id, productId?, title, hook（黄金前3秒）
- body（口播文案）, shotScript（分镜 JSON）, hashtags
- style（SPOKEN/REVIEW/STORY/UNBOXING）, durationSec
- llmModel, status（DRAFT/ADOPTED/DISCARDED）

### Asset（素材）

- id, productId?, scriptId?
- fileName, filePath, fileType（VIDEO/IMAGE）, size, coverPath
- status（PENDING/PUBLISHED/DROPPED）, title, tags

### Schedule（排期记录）

- id, assetId, scheduledAt（计划发布日期时间）
- publishStatus（PLANNED/PUBLISHED/SKIPPED）
- publishUrl, publishedAt

### Setting（配置 key-value, JSON 存储）

- LLM: baseUrl, apiKey, model, temperature
- 爬虫: rateLimitMs, proxyUrl, timeoutSec
- 通用: 默认类目列表等

### 独立模块设计

- 商品 → 脚本 → 素材 → 排期，四层链式关联，可完整追踪「一个品最终发了没」
- 爬虫任务独立成表：失败重试、断点续跑有据可查
- 效果跟踪模块以后只加一张 Performance 表挂到 Schedule 上，不影响现有表

## 5. 模块功能

### 模块一：选品商品库

- 列表页：卡片/表格展示，按佣金率、销量、类目、趋势筛选排序，状态标注
- 新增商品：手动录入表单 或 粘贴链接由爬虫抓取 或 CSV 批量导入（名称/链接/价格/佣金率/销量/类目）
- 爬虫任务中心：发起关键词搜索任务，任务列表显示 QUEUED/RUNNING/SUCCESS/FAILED，失败可重试，超时自动放弃
- 商品详情：编辑信息、标记状态、一键「生成脚本文案」跳转

### 模块二：脚本文案生成

- 输入：从商品库选品（带出卖点）或手动填商品信息，选风格（口播/测评/剧情/开箱）、时长
- AI 生成：标题 + 黄金3秒钩子 + 口播正文 + 分镜脚本 + 话题标签，可重新生成
- 批量生成：勾选多个商品一次生成多组文案
- 历史与采用：生成记录保存，可复制/导出，标记已采用/已废弃

### 模块三：素材与排期

- 素材上传：关联商品和脚本，拖拽上传视频/封面，本地存储
- 排期列表：素材按发布日期排序，设置计划发布时间
- 发布流程：PLANNED → 标记已发布并填抖音链接 → 后续版本自动读效果数据
- 看板视图：当月发布日历

### 公共页面

- 设置页：LLM 配置（baseUrl/apiKey/model）、爬虫配置（限速/代理/超时）
- 仪表盘：商品数、待生成脚本数、本周排期数、近7天发布数

## 6. 错误处理

| 场景 | 策略 |
|------|------|
| 爬虫抓取失败 | 自动重试 2 次，指数退避，连续失败标记失败并记录原因 |
| 爬虫超时/被风控 | 全局超时控制，可配置代理；失败降级提示「改用手动录入」 |
| LLM API 报错/限流 | 重试 1 次，返回友好错误，不清空已填内容 |
| 用户误删/误操作 | 删除均二次确认；素材文件删除同时清理磁盘 |
| 启动依赖缺失 | Playwright 浏览器未安装时给出安装指引，不影响其他功能 |

## 7. 测试策略

- 单元测试（Vitest）：服务层逻辑 — CSV 导入解析、商品筛选、脚本结果解析容错
- API 集成测试：核心接口（商品 CRUD、爬虫任务流转、素材排期）用内存数据库
- 手动验收清单：新建商品 → 生成文案 → 传素材 → 排期，关键流程人工走一遍
- 不写测试：纯 UI 展示层、LLM 调用本身

## 8. 交付阶段

- P0（核心闭环）：商品库增删改查 + 手动录入 + CSV 导入 + 脚本文案生成 + 素材上传排期 + 设置页
- P1（自动化增强）：Playwright 爬虫 + 任务中心 + 批量生成文案 + 仪表盘
- P2（后续）：效果跟踪、日历看板增强、定时发布提醒