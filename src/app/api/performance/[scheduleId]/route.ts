import { NextResponse } from "next/server";
import { upsertPerformance } from "@/services/performanceService";
import { Prisma } from "@prisma/client";

export async function PUT(req: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await params;
  const id = Number(scheduleId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "无效的排期 ID" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const perf = await upsertPerformance(id, body);
    return NextResponse.json(perf);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      (e.code === "P2025" || e.code === "P2003")
    ) {
      return NextResponse.json({ error: "排期不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
