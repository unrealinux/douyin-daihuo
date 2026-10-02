import { Platform, ProductStatus, Trend } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseProductsCsv } from "./csvService";
import type { CsvProductRow } from "./csvService";

export interface ProductFilters {
  status?: ProductStatus | "ALL";
  category?: string;
  track?: string;
  platform?: Platform | "ALL";
  minRate?: number;
  sort?: "commissionRate" | "dailySales" | "updatedAt";
  order?: "asc" | "desc";
  keyword?: string;
}

export function filterProducts<T extends { name: string; category?: string | null; track?: string | null; platform?: string | null; commissionRate?: number | null; dailySales?: number | null; status: string; updatedAt: Date }>(
  items: T[],
  filters: ProductFilters
): T[] {
  let out = items;
  if (filters.status && filters.status !== "ALL") {
    out = out.filter((p) => p.status === filters.status);
  }
  if (filters.category) {
    out = out.filter((p) => p.category === filters.category);
  }
  if (filters.track) {
    out = out.filter((p) => p.track === filters.track);
  }
  if (filters.platform && filters.platform !== "ALL") {
    out = out.filter((p) => p.platform === filters.platform);
  }
  if (filters.minRate !== undefined) {
    out = out.filter((p) => (p.commissionRate ?? 0) >= filters.minRate!);
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    out = out.filter((p) => p.name.toLowerCase().includes(kw));
  }
  const sort = filters.sort ?? "updatedAt";
  const order = filters.order ?? "desc";
  return [...out].sort((a, b) => {
    const va = a[sort];
    const vb = b[sort];
    const numA = va instanceof Date ? va.getTime() : (typeof va === "number" ? va : 0);
    const numB = vb instanceof Date ? vb.getTime() : (typeof vb === "number" ? vb : 0);
    return order === "asc" ? numA - numB : numB - numA;
  });
}

export async function listProducts(filters: ProductFilters = {}) {
  const items = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { scriptIdeas: true, assets: true } } },
  });
  const filtered = filterProducts(items, filters);
  return filtered;
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: { scriptIdeas: { orderBy: { createdAt: "desc" } }, assets: true },
  });
}

export interface ProductInput {
  name: string;
  url?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  commissionRate?: number;
  dailySales?: number;
  trend?: Trend;
  platform?: Platform | null;
  track?: string | null;
  note?: string;
  status?: ProductStatus;
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: number, input: Partial<ProductInput>) {
  return prisma.product.update({ where: { id }, data: input });
}

export async function deleteProduct(id: number) {
  // 先解除关联，保留脚本/素材/任务记录（与列表页删除确认文案一致）
  await prisma.$transaction([
    prisma.scriptIdea.updateMany({ where: { productId: id }, data: { productId: null } }),
    prisma.asset.updateMany({ where: { productId: id }, data: { productId: null } }),
    prisma.scrapeTask.updateMany({ where: { productId: id }, data: { productId: null } }),
    prisma.product.delete({ where: { id } }),
  ]);
}

export async function importProductsCsv(text: string) {
  const rows = parseProductsCsv(text);
  const created = await prisma.$transaction(
    rows.map((row: CsvProductRow) =>
      prisma.product.create({
        data: {
          name: row.name,
          url: row.url,
          category: row.category,
          price: row.price,
          commissionRate: row.commissionRate,
          dailySales: row.dailySales,
          source: "IMPORT",
        },
      })
    )
  );
  return created;
}

export async function getCategories() {
  const rows = await prisma.product.findMany({ select: { category: true }, distinct: ["category"] });
  return rows.map((r) => r.category).filter((c): c is string => !!c);
}

