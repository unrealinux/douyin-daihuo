import { NextRequest, NextResponse } from "next/server";
import { getScript, setScriptStatus, deleteScript } from "@/services/scriptService";
import { Prisma, ScriptStatus } from "@prisma/client";

function parseScriptId(id: string): number | null {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseScriptId(id);
  if (numId === null) return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
  const script = await getScript(numId);
  if (!script) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(script);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseScriptId(id);
  if (numId === null) return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
  try {
    const body = (await req.json()) as { status?: ScriptStatus };
    if (!body.status) return NextResponse.json({ error: "no status" }, { status: 400 });
    const script = await setScriptStatus(numId, body.status);
    return NextResponse.json(script);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "脚本不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseScriptId(id);
  if (numId === null) return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
  try {
    await deleteScript(numId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "脚本不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
