import { NextRequest, NextResponse } from "next/server";
import { getAsset, updateAsset, deleteAsset } from "@/services/assetService";
import { Prisma } from "@prisma/client";

function parseAssetId(id: string): number | null {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseAssetId(id);
  if (numId === null) return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  const asset = await getAsset(numId);
  if (!asset) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseAssetId(id);
  if (numId === null) return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  try {
    const body = await req.json();
    const asset = await updateAsset(numId, body);
    return NextResponse.json(asset);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseAssetId(id);
  if (numId === null) return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  try {
    await deleteAsset(numId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
