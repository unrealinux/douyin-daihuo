import { NextResponse } from "next/server";
import { batchGenerate, GenerateInput } from "@/services/scriptService";
import { prisma } from "@/lib/db";
import { ScriptStyle } from "@prisma/client";

const STYLES = new Set<string>(Object.values(ScriptStyle));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawIds: unknown[] = Array.isArray(body.productIds) ? body.productIds : [];
    const ids = [...new Set(rawIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (!ids.length) return NextResponse.json({ error: "没有有效的商品" }, { status: 400 });
    if (ids.length > 20) return NextResponse.json({ error: "单次最多批量 20 个商品" }, { status: 400 });

    const style = STYLES.has(body.style) ? (body.style as ScriptStyle) : ScriptStyle.SPOKEN;
    const durationSec = Number(body.durationSec ?? 30);

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, note: true, category: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const inputs: GenerateInput[] = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        sellingPoints: product.note ?? product.category ?? "",
        style,
        durationSec: Number.isFinite(durationSec) && durationSec > 0 ? Math.round(durationSec) : 30,
      }));

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
