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
