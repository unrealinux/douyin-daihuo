import { Platform, ScriptStyle, ScriptStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLlmClient } from "@/lib/llm";
import { getLlmConfig } from "./settingService";
import { parseScriptJson } from "./scriptParser";
import { similarityRatio } from "@/lib/similarity";
import { PLATFORM_LABEL } from "@/lib/selectionUtils";

const STYLE_LABEL: Record<ScriptStyle, string> = {
  SPOKEN: "口播带货", REVIEW: "测评", STORY: "剧情", UNBOXING: "开箱",
};

/** 系统提示词内置 SOP 合规红线：锁两头破中间 / 基于正史 / 生图禁画书面 / 禁止搬运。 */
export const SCRIPT_SYSTEM_PROMPT = [
  "你是抖音/视频号带货短视频脚本专家。根据用户提供的商品信息生成带货脚本，只输出 JSON，不要输出其他内容。",
  "JSON 字段：title(标题), hook(黄金3秒钩子), body(口播正文), shotScript(分镜脚本,用\\n分隔每行), shots(分镜数组,每项{index,scene(画面/生图提示词),camera(镜头),durationSec,size(默认9:16),narration(对应口播)}), coverPrompt(3:4封面提示词), commentScript(评论区带货话术), hashtags(话题标签数组,每个以#开头), durationSec(数字)。",
  "必须遵守以下合规红线（违反任一条都不可用）：",
  "1. 锁两头、破中间：若提供了对标文案，只借鉴其前 3 秒的悬念结构，中段必须完全重写，与对标文案相似度压到 10% 以下，严禁照抄搬运。",
  "2. 史实准确：涉及历史/国学内容必须基于正史，严禁拼凑野史、编造史实或人物。",
  "3. 画面与封面严禁出现任何与「书」相关的词或物：不得出现 书、书籍、书本、线装书、书架、书页、古籍、书本封面 等描述，也不得描述翻书/摞书/手持书籍。分镜与封面只写意境场景（如深宫夜读的烛影、摇曳的宫嬿、金戈铁马的旌旗、山水人物、光影氛围），书籍画面由后期人工叠加。",
  "4. 口播正文与标题、钩子中严禁出现内部经营信息：不得出现佣金、佣金率、客单价、转化率、利润率、GMV、ROI、挂车、选品 等词，也不得报百分比分成。这些话术只用于内部决策，不能让观众听到。",
  "5. 避免广告法极限词：不要用 最好/最强/第一/绝对/100%/根治/特效/顶级 等表述。",
  "6. 口播正文中适当使用破折号——与省略号……控制语速停顿，提升真人呼吸感。",
].join("\n");

export interface GenerateInput {
  productId?: number;
  productName: string;
  sellingPoints: string;
  style: ScriptStyle;
  durationSec: number;
  platform?: Platform | null;
  track?: string | null;
  benchmarkId?: number | null;
  /** 对标口播逐字稿，仅用于结构参考与相似度核算。 */
  referenceTranscript?: string | null;
}

export async function generateScript(input: GenerateInput) {
  const [client, cfg] = await Promise.all([getLlmClient(), getLlmConfig()]);
  const prompt = buildPrompt(input, STYLE_LABEL[input.style]);
  const messages = [
    { role: "system" as const, content: SCRIPT_SYSTEM_PROMPT },
    { role: "user" as const, content: prompt },
  ];

  const call = () =>
    client.chat.completions.create({
      model: cfg.model,
      temperature: cfg.temperature,
      response_format: { type: "json_object" },
      messages,
    });

  let raw = "";
  try {
    raw = (await call()).choices[0]?.message?.content ?? "";
  } catch {
    raw = (await call()).choices[0]?.message?.content ?? "";
  }
  const parsed = parseScriptJson(raw);
  const similarity = input.referenceTranscript
    ? Math.round(similarityRatio(parsed.body, input.referenceTranscript) * 10000) / 10000
    : null;

  return prisma.scriptIdea.create({
    data: {
      productId: input.productId ?? null,
      benchmarkId: input.benchmarkId ?? null,
      title: parsed.title || null,
      hook: parsed.hook || null,
      body: parsed.body,
      shotScript: parsed.shotScript || null,
      shots: parsed.shots.length ? JSON.stringify(parsed.shots) : null,
      coverPrompt: parsed.coverPrompt || null,
      commentScript: parsed.commentScript || null,
      hashtags: parsed.hashtags.length ? JSON.stringify(parsed.hashtags) : null,
      style: input.style,
      durationSec: parsed.durationSec,
      llmModel: cfg.model,
      similarity,
      status: ScriptStatus.DRAFT,
    },
  });
}

export function buildPrompt(input: GenerateInput, styleLabel: string): string {
  const productLine = input.productId
    ? `商品名称：${input.productName}\n卖点：${input.sellingPoints}`
    : `商品信息：${input.productName}\n卖点：${input.sellingPoints || "（未填写，请合理发挥）"}`;
  const parts = [productLine, `风格：${styleLabel}`, `目标时长：${input.durationSec}秒`];
  if (input.track) parts.push(`赛道：${input.track}`);
  if (input.platform) parts.push(`发布平台：${PLATFORM_LABEL[input.platform]}`);
  if (input.referenceTranscript) {
    parts.push(
      `【对标文案（仅作结构与选题参考。必须锁两头破中间：只可借鉴前3秒悬念，中段彻底重写，相似度控制在 10% 以下，严禁照抄）】\n${input.referenceTranscript.slice(
        0,
        1500
      )}`
    );
  }
  return parts.join("\n");
}

export async function listScripts() {
  return prisma.scriptIdea.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true } },
      benchmark: { select: { id: true, title: true, track: true, platform: true } },
    },
  });
}

export async function getScript(id: number) {
  return prisma.scriptIdea.findUnique({
    where: { id },
    include: {
      product: true,
      benchmark: { select: { id: true, title: true, track: true, platform: true, url: true } },
    },
  });
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
