import { NextResponse } from "next/server";
import { listSchedules, createSchedule } from "@/services/scheduleService";
import { Prisma } from "@prisma/client";

export async function GET() {
  const schedules = await listSchedules();
  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schedule = await createSchedule(Number(body.assetId), new Date(body.scheduledAt));
    return NextResponse.json(schedule, { status: 201 });
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
