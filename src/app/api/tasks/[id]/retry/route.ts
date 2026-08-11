import { NextRequest, NextResponse } from "next/server";
import { retryTask } from "@/services/taskRunner";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await retryTask(Number(id));
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(task);
}
