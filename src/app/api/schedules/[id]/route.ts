import { NextRequest, NextResponse } from "next/server";
import { updateSchedule, deleteSchedule } from "@/services/scheduleService";
import { Prisma } from "@prisma/client";

function parseScheduleId(id: string): number | null {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseScheduleId(id);
  if (numId === null) return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  try {
    const body = await req.json();
    const schedule = await updateSchedule(numId, {
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      publishStatus: body.publishStatus,
      publishUrl: body.publishUrl,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      accountId:
        body.accountId === null
          ? null
          : Number.isInteger(Number(body.accountId)) && Number(body.accountId) > 0
            ? Number(body.accountId)
            : undefined,
      checklist: typeof body.checklist === "string" ? body.checklist : undefined,
      publishTitle: typeof body.publishTitle === "string" ? body.publishTitle : undefined,
      publishHashtags: typeof body.publishHashtags === "string" ? body.publishHashtags : undefined,
      commentScript: typeof body.commentScript === "string" ? body.commentScript : undefined,
    });
    return NextResponse.json(schedule);
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseScheduleId(id);
  if (numId === null) return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  try {
    await deleteSchedule(numId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
