import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import {
  ALLOWED_UPLOAD_EXTS,
  MAX_UPLOAD_BYTES,
  createAsset,
  ensureUploadDir,
  getFileExt,
  UPLOAD_DIR,
} from "@/services/assetService";

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

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTS.includes(ext)) {
    return NextResponse.json(
      { error: `不支持的文件类型。允许：${ALLOWED_UPLOAD_EXTS.join(", ")}` },
      { status: 400 }
    );
  }

  const fileType = getFileExt(file.name);
  if (!fileType) {
    return NextResponse.json({ error: "无法识别文件类型" }, { status: 400 });
  }

  if (typeof file.size === "number" && file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `文件过大，上限 ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB` },
      { status: 400 }
    );
  }

  const savedName = `${randomUUID()}${ext}`;
  const abs = path.join(UPLOAD_DIR, savedName);
  let buf: Buffer;
  try {
    buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `文件过大，上限 ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB` },
        { status: 400 }
      );
    }
    await import("fs/promises").then((fsp) => fsp.writeFile(abs, buf));
  } catch {
    try {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {
      /* ignore */
    }
    return NextResponse.json({ error: "文件保存失败" }, { status: 500 });
  }

  const relPath = `data/uploads/${savedName}`;
  try {
    const asset = await createAsset({
      fileName: file.name,
      filePath: relPath,
      fileType,
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
    } catch {
      /* ignore */
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
