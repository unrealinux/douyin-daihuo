import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  deleteBenchmark,
  getBenchmark,
  pickBenchmarkInput,
  updateBenchmark,
} from "@/services/benchmarkService";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "无效的对标 ID" }, { status: 400 });
  const item = await getBenchmark(id);
  if (!item) return NextResponse.json({ error: "对标不存在" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "无效的对标 ID" }, { status: 400 });
  try {
    const body = await req.json();
    const data = pickBenchmarkInput(body);
    const updated = await updateBenchmark(id, data);
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "对标不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "无效的对标 ID" }, { status: 400 });
  try {
    await deleteBenchmark(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "对标不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
