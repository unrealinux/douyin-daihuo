import { NextResponse } from "next/server";
import { batchGenerate, GenerateInput } from "@/services/scriptService";
import { getProduct } from "@/services/productService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids: unknown[] = Array.isArray(body.productIds) ? body.productIds : [];
    const style = body.style ?? "SPOKEN";
    const durationSec = Number(body.durationSec ?? 30);
    const inputs: GenerateInput[] = [];
    for (const rawId of ids) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id <= 0) continue;
      const product = await getProduct(id);
      if (product) {
        inputs.push({
          productId: product.id,
          productName: product.name,
          sellingPoints: product.note ?? product.category ?? "",
          style,
          durationSec,
        });
      }
    }
    if (!inputs.length) return NextResponse.json({ error: "没有有效的商品" }, { status: 400 });
    const results = await batchGenerate(inputs);
    return NextResponse.json(results);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
