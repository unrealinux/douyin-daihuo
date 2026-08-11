import { NextResponse } from "next/server";
import { createTask, listTasks, spawnRunner, checkPlaywright, pollQueuedTasks } from "@/services/taskRunner";

export async function GET() {
  void pollQueuedTasks();
  const [tasks, pw] = await Promise.all([listTasks(), checkPlaywright()]);
  return NextResponse.json({ tasks, playwright: pw });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.keyword && !body.url) {
    return NextResponse.json({ error: "需要 keyword 或 url" }, { status: 400 });
  }
  const task = await createTask({
    type: body.url ? "LINK" : "KEYWORD",
    keyword: body.keyword,
    url: body.url,
    productId: body.productId ? Number(body.productId) : undefined,
  });
  spawnRunner(task.id);
  void pollQueuedTasks();
  return NextResponse.json(task, { status: 201 });
}
