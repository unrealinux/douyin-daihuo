import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function contentType(ext: string) {
  return MIME[ext] ?? "application/octet-stream";
}

function toWebStream(node: fs.ReadStream) {
  return Readable.toWeb(node) as ReadableStream<Uint8Array>;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = path.basename(name);
  const abs = path.join(process.cwd(), "data", "uploads", safe);
  if (!fs.existsSync(abs)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const stat = fs.statSync(abs);
  const type = contentType(path.extname(safe).toLowerCase());
  const range = req.headers.get("range");

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m) return new NextResponse(null, { status: 416 });
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Number(m[2]) : stat.size - 1;
    if (start >= stat.size || end >= stat.size || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${stat.size}` },
      });
    }
    const stream = fs.createReadStream(abs, { start, end });
    return new NextResponse(toWebStream(stream), {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  const stream = fs.createReadStream(abs);
  return new NextResponse(toWebStream(stream), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
    },
  });
}
