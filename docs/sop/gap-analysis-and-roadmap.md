# SOP 对齐差距分析与迭代路线

> 对照 `douyin-ai-video-ecommerce-sop.md`，梳理本仓库 `douyin-ecommerce-tools`
> 当前实现与 SOP 的差距，并给出分阶段改造项。
> 判断依据：`prisma/schema.prisma` + `src/services/*` + `src/app/*`。

---

## 1. 现状映射

### SOP 六阶段 vs 代码能力

| SOP 阶段 | 代码现状 | 覆盖度 |
|----------|----------|--------|
| ① 账号与选品准备 | 商品库（手动/CSV/爬虫）、佣金率、日销、趋势、状态流转；**无赛道/平台维度，无选品评分** | 🟡 60% |
| ② 对标拆解 | **完全没有**（无对标视频库、无选题资产库、无拆解字段） | 🔴 0% |
| ③ 二创文案 | LLM 生成标题/钩子/口播/分镜/标签/分镜数组/封面提示词/评论话术，风格 4 种、时长、批量；内置 SOP 红线约束、对标来源、相似度校验 | ✅ 90% |
| ④ 素材制作 | 素材上传 + 封面 + 关联商品/脚本；结构化分镜 + 封面提示词 + 一键导出 5 文件素材包 zip（剪映草稿仍为人工） | ✅ 85% |
| ⑤ 发布运营 | 排期时间线、发布状态、发布链接、发布日历；发布前自检清单（3 条红线门禁）+ 发布标题/话题/评论话术 | ✅ 90% |
| ⑥ 数据复盘 | 播放/点赞/评论/分享/收藏/订单/GMV/佣金 + 完播率/3 秒播放率/平均时长 + 自动诊断 | ✅ 90% |

### SOP 关键资产 vs 数据模型

| SOP 资产 | 现有模型 | 差距 |
|----------|----------|------|
| 商品库 + 选品标准 | `Product` | 缺 `platform`、`track`；缺选品评分 |
| **爆款选题资产库** | ❌ | 需新增 `Benchmark`（对标视频 + 逐字稿 + 数据 + 拆解） |
| 脚本/二创 | `ScriptIdea` | 已有 `benchmarkId`、`similarity`、`shots`、`coverPrompt`、`commentScript` |
| 素材 | `Asset` | 已有结构化分镜 + 封面提示词 + 素材包导出 |
| 发布 | `Schedule` | 已有 checklist、publishTitle/publishHashtags/commentScript |
| 复盘 | `Performance` | 已有 `completionRate`、`threeSecRate`、`avgWatchSec` |
| 账号矩阵 | ❌ | 需新增 `Account`（阶段 3/4） |

---

## 2. 改造路线

### Phase 1（本次实现）— SOP 主干闭环

1. **赛道 / 平台维度**：`Product` 增加 `platform`、`track`，选品、生成、脚本均可按赛道组织
2. **选品评分（四大标准落地）**：`src/lib/selectionUtils.ts`
   - 客单价 50–200、佣金率 ≥30%、单笔佣金、日销、趋势 → 0–100 分 + A/B/C/D + 亮点/预警
   - 商品列表/详情展示评分，辅助「选品中心」决策
3. **对标库 `Benchmark`（爆款选题资产库）**：模型 + 服务 + API + 页面
   - 字段：平台/赛道/标题/作者/链接/封面/逐字稿/时长/播放/点赞/收藏/转发/评论/发布时间/钩子类型/拆解要点/关联商品
   - 列表支持关键词、赛道、平台筛选；按数据热度排序
4. **二创风控红线 + 相似度**
   - `ScriptIdea` 增加 `benchmarkId`、`similarity`
   - `scriptService` 系统提示词内置 SOP 红线：锁两头破中间 / 基于正史严禁野史 / 生图禁画书面 / 严禁搬运
   - `src/lib/similarity.ts` 纯函数计算与对标逐字稿相似度，生成后回写
5. **复盘指标补全与诊断**
   - `Performance` 增加 `completionRate`（完播率）、`threeSecRate`（3 秒播放率）、`avgWatchSec`（平均播放时长）
   - `performanceUtils.diagnosePerformance` 按 SOP 基线（完播 >20%、3S >30%、播放 <200 换号）输出诊断与建议
   - 仪表盘 / 素材页展示诊断

### Phase 2（已完成）— 生产与发布提效

6. ✅ **标准化素材包导出**：`lib/scriptBundle.ts` + `lib/zip.ts`，按 SOP 文件清单产出 5 个文件并打包 zip
7. ✅ **分镜结构化**：`lib/shotUtils.ts`，`shots` 结构化字段（画面/镜头/时长/画幅/口播）
8. ✅ **发布前自检清单**：`lib/publishChecklist.ts` + `Schedule.checklist`，3 条红线未过不允许发布
9. ✅ **发布信息**：`Schedule` 增加 `publishTitle` / `publishHashtags` / `commentScript`
10. ✅ **配音气口辅助**：`lib/voiceUtils.ts`，多音字同音转译、气口规则、长句停顿建议（一键复制 TTS 文案）

### Phase 3 — 矩阵与增长

11. **账号矩阵 `Account`**：素材/排期挂账号，多账号数据对比
12. **对标自动化采集**：`ScrapeTask` 扩展 `BENCHMARK` 类型，抓对标视频数据/文案入库
13. **看板增强**：赛道 × 商品 × 素材的效果对比，爆款结构复用分析
14. **成长阶段看板**：按四阶段路线显示当前进度与下一步动作

---

## 3. 验收情况

- [x] 新增字段与模型可在 SQLite 上 `db:push` 成功
- [x] 选品评分、相似度、复盘诊断、分镜解析、素材包、自检清单、配音工具均为纯函数并有单测
- [x] 对标库可增删改查、可按赛道/平台/关键词筛选
- [x] 生成脚本时可选对标来源，落库 `benchmarkId` + `similarity`
- [x] 复盘指标可录入并展示诊断结论
- [x] 素材包可导出 zip（UTF-8 文件名，PowerShell/Node 解压校验通过）
- [x] 发布前自检 + 发布信息可保存，红线未过禁止标记发布
- [x] `npm test`（92 例）、`npx tsc --noEmit`、`npm run build` 全部通过
