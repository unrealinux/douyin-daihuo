import { NextResponse } from "next/server";
import { getScript } from "@/services/scriptService";
import { buildScriptBundle } from "@/lib/scriptBundle";
import { createZip } from "@/lib/zip";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scriptId = Number(id);
  if (!Number.isInteger(scriptId) || scriptId <= 0) {
    return NextResponse.json({ error: "无效的脚本 ID" }, { status: 400 });
  }

  const script = await getScript(scriptId);
  if (!script) return NextResponse.json({ error: "脚本不存在" }, { status: 404 });

  const files = buildScriptBundle(script);

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ files });
  }

  const zip = createZip(files.map((f) => ({ name: f.name, content: f.content })));
  const safeTitle = (script.title ?? `script-${script.id}`).replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);
  const filename = `${safeTitle || `script-${script.id}`}.zip`;

  return new Response(zip as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(zip.byteLength),
      "Content-Disposition": `attachment; filename="script-${script.id}.zip"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
