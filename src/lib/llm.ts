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
