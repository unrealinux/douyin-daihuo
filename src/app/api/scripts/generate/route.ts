import { NextResponse } from "next/server";
import { generateScript, GenerateInput } from "@/services/scriptService";
import { LlmNotConfiguredError } from "@/lib/llm";
import { getProduct } from "@/services/productService";
import { getBenchmark } from "@/services/benchmarkService";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let benchmarkId: number | null = null;
    let referenceTranscript: string | null = null;
    if (body.benchmarkId) {
      const id = Number(body.benchmarkId);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "无效的对标 ID" }, { status: 400 });
      }
      const benchmark = await getBenchmark(id);
      if (!benchmark) return NextResponse.json({ error: "对标不存在" }, { status: 404 });
      benchmarkId = benchmark.id;
      referenceTranscript = benchmark.transcript ?? null;
    }

    let input: GenerateInput;
    if (body.productId) {
      const productId = Number(body.productId);
      if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
      }
      const product = await getProduct(productId);
      if (!product) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
      input = {
        productId: product.id,
        productName: product.name,
        sellingPoints: body.sellingPoints ?? product.note ?? product.category ?? "",
        style: body.style ?? "SPOKEN",
        durationSec: Number(body.durationSec ?? 30),
        platform: product.platform ?? null,
        track: product.track ?? null,
        benchmarkId,
        referenceTranscript,
      };
    } else {
      input = {
        productName: body.productName,
        sellingPoints: body.sellingPoints ?? "",
        style: body.style ?? "SPOKEN",
        durationSec: Number(body.durationSec ?? 30),
        track: body.track ?? null,
        benchmarkId,
        referenceTranscript,
      };
    }
    const script = await generateScript(input);
    return NextResponse.json(script, { status: 201 });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    if (e instanceof LlmNotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("no json in llm output")) {
      return NextResponse.json({ error: "模型返回了无法解析的内容，请重试或更换模型" }, { status: 502 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
