import { NextResponse } from "next/server";
import { generateScript, GenerateInput } from "@/services/scriptService";
import { LlmNotConfiguredError } from "@/lib/llm";
import { getProduct } from "@/services/productService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      };
    } else {
      input = {
        productName: body.productName,
        sellingPoints: body.sellingPoints ?? "",
        style: body.style ?? "SPOKEN",
        durationSec: Number(body.durationSec ?? 30),
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
