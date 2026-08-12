# 抖音带货助手 · 全站深色换肤设计

日期：2026-08-12
状态：已批准
关联：基于 `2026-08-11-douyin-ecommerce-tools-design.md` 已实现的功能页做视觉重构

## 背景

现有 UI 为"能用"级别的原型：单一 `accent`（#fe2c55）色、无阴影/间距/字体层级体系、无 hover/加载/空状态反馈，观感简陋。用户确认采用抖音原生质感风格（深底 + 霓虹粉/青蓝高亮），全站换肤，纯深色，适度动效。

## 设计 Token

### 颜色

| Token | 值 | 用途 |
|-------|-----|------|
| `bg` | `#0f0f13` | 页面背景 |
| `surface` | `#1a1a20` | 卡片 / 面板 |
| `surface-2` | `#232329` | 悬浮 / 次级卡片 |
| `border` | `#2e2e36` | 描边（卡片 `white/5` 变体也用） |
| `text` | `#f5f5f7` | 主文本 |
| `text-2` | `#9a9aa3` | 次级文本 |
| `accent` | `#fe2c55` | 主色（抖音粉，沿用现有） |
| `cyan` | `#22d3ee` | 次级高亮（青蓝，链接 / 趋势 UP） |
| `success` | `#22c55e` | 成功 / 已选 / 已发布 |
| `warning` | `#f59e0b` | 警告 / 排队中 |
| `danger` | `#ef4444` | 危险 / 失败 / 放弃 |

### 字体

- 系统栈：`system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
- 数字与统计使用 `font-feature-settings: "tnum"`（tabular-nums），对齐表格数字。

### 间距

4px 基准刻度：`0 / 2 / 4 / 6 / 8 / 12 / 16 / 24 / 32`。统一用 Tailwind spacing，不出现任意值。

### 圆角

- `md` (8px)：输入框、按钮、小卡片
- `lg` (12px)：大卡片、对话框面板
- `pill` (9999px)：徽章、状态标签

### 阴影

- `subtle`：`0 1px 2px rgb(0 0 0 / .4)`
- `card`：`0 4px 20px rgb(0 0 0 / .5)`

### 动效

- 过渡：仅 `150ms ease`，作用于 hover / focus / loading / 状态切换。
- 不做滚动动画、不做飘入飘出、不搞玻璃形态滥用。
- hover 反馈：按钮微提亮 + 上移 1px；卡片轻微提亮 + 阴影加深。

## 组件规范

### Nav（顶部导航）

- 深色玻璃条：`bg-black/60 backdrop-blur border-b border-white/10 sticky top-0 z-40`。
- Logo 区：抖音唱片 / 音符 inline SVG + 渐变文字（粉 `#fe2c55` → 青 `#22d3ee`）。
- 链接：`text-white/70 hover:text-white`；active（当前路由）高亮 `accent` 色 + 底部指示条 `border-b-2 border-accent`。

### Button（4 变体）

| 变体 | 样式 |
|------|------|
| primary | accent 渐变 `from-[#fe2c55] to-[#ff6b81]` 白字，hover 提亮 + `-translate-y-px` |
| secondary | `bg-transparent border border-white/10 text-white hover:bg-white/10` |
| danger | `bg-red-500/90 text-white hover:bg-red-500` |
| ghost（新增） | `bg-transparent text-white/70 hover:text-white hover:bg-white/5`，用于表格内轻操作 |

- 统一：`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150`
- `disabled`：`cursor-not-allowed opacity-50`（保留现有实现）
- focus：`focus-visible:ring-2 ring-accent/50` 焦点环

### Input / Select / Textarea

- 基底：`bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30`
- focus：`border-accent ring-1 ring-accent/30`
- `Label`：`text-sm text-white/60 mb-1`

### StatusBadge（状态徽章）

圆角 pill（`rounded-full px-2 py-0.5 text-xs font-medium`），每状态专属色 + 浅色底：

| 状态 | 配色 |
|------|------|
| CANDIDATE / PLANNED | 灰（`bg-white/10 text-white/60`） |
| FOLLOWING | 青蓝（cyan 系） |
| SELECTED / ADOPTED / SUCCESS / PUBLISHED / RUNNING | 绿 |
| DROPPED / DISCARDED / FAILED | 红 |
| QUEUED | 黄 |
| UP 趋势 | 红粉（accent 系） |
| STEADY | 灰绿 |
| DOWN 趋势 | 红 |
| 未映射 | 灰回退 |

### Card（新建轻量卡片组件）

- `bg-surface border border-white/5 rounded-lg shadow-card transition-all`
- hover：`hover:border-white/10 hover:shadow-lg`
- 商品卡 / 素材卡 / 统计卡统一使用。

### ConfirmDialog

- 遮罩：`bg-black/70`
- 面板：`bg-surface border border-white/10 rounded-lg shadow-card`
- 动作按钮沿用新 Button 变体（danger 确认 / secondary 取消）。

### 空状态 / 加载态

- 空状态：次级色图标 + 文案（`text-white/40`）。
- 加载中：骨架屏 `animate-pulse`（灰块）。
- 保留所有空状态文案与现有行为不变。

## 实施范围

### 修改文件

```
tailwind.config.ts                       修改：扩展颜色 / shadow / borderRadius / fontFamily
src/app/globals.css                      修改：深色背景、字体、tabular-nums、滚动条、focus 基础样式
src/components/ui.tsx                    重写：Button 4 变体 + Input/Select/Textarea/Label + 新增 Card
src/components/Nav.tsx                   重写：玻璃导航 + SVG 图标 + active 态
src/components/StatusBadge.tsx           重写：完整状态映射（含爬虫任务状态）
src/components/ConfirmDialog.tsx         重写：深色化
页面 6 个（仪表盘/商品库 x4/脚本 x2/素材/设置）  类名换新 token
```

### 不修改

- 服务层 / API 路由 / 测试文件（纯前端换肤，`tests/` 19 个用例不受影响）。

## 验证

1. `npx tsc --noEmit` 无错误。
2. `npm run build` 成功。
3. `npx vitest run` 全部通过（确认纯样式改动不破坏逻辑测试）。
4. 启动 `npm run dev` 肉眼检查：6 页深色观感、状态徽章配色正确、hover 过渡流畅、表单聚焦态可见、空状态正常。

## 提交策略

按任务分批提交，每批通过 tsc + build：

1. 设计 token + 基础样式（tailwind.config / globals.css）
2. 公共组件（ui.tsx / Nav / StatusBadge / ConfirmDialog）
3. 各页面换肤（dashboard / products x4 / scripts x2 / assets / settings）

## 后续（不在本次范围）

- 效果跟踪页、日历增强、发布提醒、登录权限等 P2 功能保持不变，仅使用新组件库渲染。