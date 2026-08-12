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

export const API_KEY_REDACTED = "••••••••";

export function redactLlmConfig(cfg: LlmConfig): LlmConfig & { apiKeyConfigured: boolean } {
  return {
    ...cfg,
    apiKey: cfg.apiKey ? API_KEY_REDACTED : "",
    apiKeyConfigured: Boolean(cfg.apiKey),
  };
}

export function isRedactedApiKey(value: string | undefined | null): boolean {
  if (!value) return true;
  return value === API_KEY_REDACTED || /^•+$/.test(value);
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
