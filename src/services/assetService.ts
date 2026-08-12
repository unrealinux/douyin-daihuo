import { AssetType, AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

const VIDEO_EXTS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
export const ALLOWED_UPLOAD_EXTS = [...VIDEO_EXTS, ...IMAGE_EXTS];

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface AssetInput {
  productId?: number | null;
  scriptId?: number | null;
  fileName: string;
  filePath: string;
  fileType: AssetType;
  size: number;
  coverPath?: string | null;
  title?: string | null;
  tags?: string | null;
  status?: AssetStatus;
}

export type AssetUpdateInput = Partial<
  Pick<AssetInput, "productId" | "scriptId" | "title" | "tags" | "status" | "coverPath">
>;

export async function createAsset(input: AssetInput) {
  return prisma.asset.create({ data: input });
}

export async function listAssets() {
  return prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true } },
      script: { select: { id: true, title: true } },
      schedules: true,
    },
  });
}

export async function getAsset(id: number) {
  return prisma.asset.findUnique({ where: { id }, include: { schedules: true, product: true, script: true } });
}

export function pickAssetUpdate(body: Record<string, unknown>): AssetUpdateInput {
  const out: AssetUpdateInput = {};
  if (typeof body.title === "string" || body.title === null) out.title = body.title as string | null;
  if (typeof body.tags === "string" || body.tags === null) out.tags = body.tags as string | null;
  if (body.status === "PENDING" || body.status === "PUBLISHED" || body.status === "DROPPED") {
    out.status = body.status;
  }
  if (body.productId === null) out.productId = null;
  else if (typeof body.productId === "number" && Number.isInteger(body.productId)) out.productId = body.productId;
  else if (typeof body.productId === "string" && body.productId.trim() !== "") {
    const n = Number(body.productId);
    if (Number.isInteger(n)) out.productId = n;
  }
  if (body.scriptId === null) out.scriptId = null;
  else if (typeof body.scriptId === "number" && Number.isInteger(body.scriptId)) out.scriptId = body.scriptId;
  else if (typeof body.scriptId === "string" && body.scriptId.trim() !== "") {
    const n = Number(body.scriptId);
    if (Number.isInteger(n)) out.scriptId = n;
  }
  return out;
}

export async function updateAsset(id: number, input: AssetUpdateInput) {
  return prisma.asset.update({ where: { id }, data: input });
}

/** 仅允许删除 data/uploads 下的文件 */
export function resolveSafeUploadPath(relPath: string): string | null {
  const abs = path.resolve(process.cwd(), relPath);
  const root = path.resolve(UPLOAD_DIR);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return abs;
}

export async function deleteAsset(id: number) {
  const asset = await prisma.asset.findUnique({ where: { id } });

  await prisma.$transaction([
    prisma.schedule.deleteMany({ where: { assetId: id } }),
    prisma.asset.delete({ where: { id } }),
  ]);

  if (!asset) return;

  const fileAbs = resolveSafeUploadPath(asset.filePath);
  if (fileAbs && fs.existsSync(fileAbs)) {
    try {
      fs.unlinkSync(fileAbs);
    } catch {
      /* ignore */
    }
  }
  if (asset.coverPath) {
    const coverAbs = resolveSafeUploadPath(asset.coverPath);
    if (coverAbs && fs.existsSync(coverAbs)) {
      try {
        fs.unlinkSync(coverAbs);
      } catch {
        /* ignore */
      }
    }
  }
}

export function getFileExt(name: string): AssetType | null {
  const ext = path.extname(name).toLowerCase();
  if (VIDEO_EXTS.includes(ext)) return "VIDEO";
  if (IMAGE_EXTS.includes(ext)) return "IMAGE";
  return null;
}
