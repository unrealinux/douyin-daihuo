import { NextResponse } from "next/server";
import {
  getLlmConfig,
  saveLlmConfig,
  getCrawlerConfig,
  saveCrawlerConfig,
  redactLlmConfig,
  isRedactedApiKey,
  LlmConfig,
  CrawlerConfig,
} from "@/services/settingService";

export async function GET() {
  const [llm, crawler] = await Promise.all([getLlmConfig(), getCrawlerConfig()]);
  return NextResponse.json({ llm: redactLlmConfig(llm), crawler });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { llm?: LlmConfig; crawler?: CrawlerConfig };
    if (body.llm) {
      const current = await getLlmConfig();
      const next: LlmConfig = {
        baseUrl: body.llm.baseUrl ?? current.baseUrl,
        model: body.llm.model ?? current.model,
        temperature:
          typeof body.llm.temperature === "number" ? body.llm.temperature : current.temperature,
        apiKey: isRedactedApiKey(body.llm.apiKey) ? current.apiKey : body.llm.apiKey,
      };
      await saveLlmConfig(next);
    }
    if (body.crawler) await saveCrawlerConfig(body.crawler);
    const [llm, crawler] = await Promise.all([getLlmConfig(), getCrawlerConfig()]);
    return NextResponse.json({ llm: redactLlmConfig(llm), crawler });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
