import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { createAsset, ensureUploadDir, getFileExt, UPLOAD_DIR } from "@/services/assetService";

export async function POST(req: Request) {
  ensureUploadDir();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const ext = path.extname(file.name) || ".bin";
  const savedName = `${randomUUID()}${ext}`;
  const abs = path.join(UPLOAD_DIR, savedName);
  let buf: Buffer;
  try {
    buf = Buffer.from(await file.arrayBuffer());
    await import("fs/promises").then((fsp) => fsp.writeFile(abs, buf));
  } catch {
    try {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {}
    return NextResponse.json({ error: "文件保存失败" }, { status: 500 });
  }

  const relPath = `data/uploads/${savedName}`;
  try {
    const asset = await createAsset({
      fileName: file.name,
      filePath: relPath,
      fileType: getFileExt(file.name),
      size: buf.length,
      productId: form.get("productId") ? Number(form.get("productId")) : undefined,
      scriptId: form.get("scriptId") ? Number(form.get("scriptId")) : undefined,
      title: (form.get("title") as string) || undefined,
      tags: (form.get("tags") as string) || undefined,
    });
    return NextResponse.json(asset, { status: 201 });
  } catch {
    try {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {}
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
