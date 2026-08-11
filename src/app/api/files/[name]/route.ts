import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = path.basename(name);
  const abs = path.join(process.cwd(), "data", "uploads", safe);
  if (!fs.existsSync(abs)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const buf = fs.readFileSync(abs);
  const ext = path.extname(safe).toLowerCase();
  const contentType =
    ext === ".mp4" ? "video/mp4" :
    ext === ".webm" ? "video/webm" :
    ext === ".png" ? "image/png" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": contentType } });
}
