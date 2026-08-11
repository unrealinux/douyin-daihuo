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
