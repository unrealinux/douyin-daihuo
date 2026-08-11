import { AssetType, AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface AssetInput {
  productId?: number;
  scriptId?: number;
  fileName: string;
  filePath: string;
  fileType: AssetType;
  size: number;
  coverPath?: string;
  title?: string;
  tags?: string;
  status?: AssetStatus;
}

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

export async function updateAsset(id: number, input: Partial<AssetInput>) {
  return prisma.asset.update({ where: { id }, data: input });
}

export async function deleteAsset(id: number) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (asset) {
    const abs = path.join(process.cwd(), asset.filePath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    if (asset.coverPath) {
      const cover = path.join(process.cwd(), asset.coverPath);
      if (fs.existsSync(cover)) fs.unlinkSync(cover);
    }
  }
  return prisma.asset.delete({ where: { id } });
}

export function getFileExt(name: string): AssetType {
  const ext = path.extname(name).toLowerCase();
  return [".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext) ? "VIDEO" : "IMAGE";
}
