import { NextResponse } from "next/server";
import { createTask, listTasks, spawnRunner, checkPlaywright, pollQueuedTasks } from "@/services/taskRunner";

const MAX_URL_LENGTH = 2000;

export async function GET() {
  // 恢复因进程退出而未跑完的排队任务
  void pollQueuedTasks();
  const [tasks, pw] = await Promise.all([listTasks(), checkPlaywright()]);
  return NextResponse.json({ tasks, playwright: pw });
}

export async function POST(req: Request) {
  let body: { url?: unknown; productId?: unknown };
  try {
    body = (await req.json()) as { url?: unknown; productId?: unknown };
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
  }

  const raw = typeof body.url === "string" ? body.url.trim() : "";
  if (!raw) return NextResponse.json({ error: "需要商品链接" }, { status: 400 });
  if (raw.length > MAX_URL_LENGTH) return NextResponse.json({ error: "链接过长" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "链接格式不正确" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "只支持 http / https 链接" }, { status: 400 });
  }

  const productId = Number(body.productId);
  const task = await createTask({
    type: "LINK",
    url: parsed.toString(),
    productId: Number.isInteger(productId) && productId > 0 ? productId : undefined,
  });
  spawnRunner(task.id);
  return NextResponse.json(task, { status: 201 });
}
