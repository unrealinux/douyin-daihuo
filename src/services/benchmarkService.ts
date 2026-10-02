import { Platform } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sortBenchmarks, type BenchmarkSort } from "@/lib/benchmarkUtils";

export interface BenchmarkFilters {
  track?: string;
  platform?: Platform | "ALL";
  keyword?: string;
  sort?: BenchmarkSort;
}

export interface BenchmarkInput {
  title: string;
  platform?: Platform | null;
  track?: string | null;
  author?: string | null;
  url?: string | null;
  coverPath?: string | null;
  transcript?: string | null;
  durationSec?: number | null;
  views?: number | null;
  likes?: number | null;
  favorites?: number | null;
  shares?: number | null;
  comments?: number | null;
  publishedAt?: Date | null;
  hookType?: string | null;
  breakdown?: string | null;
  productId?: number | null;
  note?: string | null;
}

const INT_FIELDS = ["durationSec", "views", "likes", "favorites", "shares", "comments"] as const;
const STR_FIELDS = [
  "author",
  "url",
  "coverPath",
  "transcript",
  "hookType",
  "breakdown",
  "note",
  "track",
] as const;

export function pickBenchmarkInput(body: Record<string, unknown>, requireTitle = false): Partial<BenchmarkInput> {
  const out: Record<string, unknown> = {};
  if (typeof body.title === "string") out.title = body.title.trim();
  else if (requireTitle) throw new Error("title is required");

  for (const f of STR_FIELDS) {
    if (typeof body[f] === "string" || body[f] === null) {
      const v = body[f] as string | null;
      out[f] = typeof v === "string" ? v.trim() || null : null;
    }
  }
  if (typeof body.platform === "string" && (Object.values(Platform) as string[]).includes(body.platform)) {
    out.platform = body.platform;
  } else if (body.platform === null) {
    out.platform = null;
  }
  for (const f of INT_FIELDS) {
    if (body[f] === null || body[f] === "") out[f] = null;
    else if (body[f] !== undefined) {
      const n = Number(body[f]);
      if (Number.isFinite(n) && n >= 0) out[f] = Math.round(n);
    }
  }
  if (body.publishedAt === null || body.publishedAt === "") out.publishedAt = null;
  else if (typeof body.publishedAt === "string") {
    const d = new Date(body.publishedAt);
    if (!Number.isNaN(d.getTime())) out.publishedAt = d;
  }
  if (body.productId === null) out.productId = null;
  else if (body.productId !== undefined) {
    const n = Number(body.productId);
    if (Number.isInteger(n) && n > 0) out.productId = n;
  }
  return out as Partial<BenchmarkInput>;
}

export async function listBenchmarks(filters: BenchmarkFilters = {}) {
  const kw = filters.keyword?.trim();
  const items = await prisma.benchmark.findMany({
    where: {
      ...(filters.track ? { track: filters.track } : {}),
      ...(filters.platform && filters.platform !== "ALL" ? { platform: filters.platform } : {}),
      ...(kw
        ? {
            OR: [
              { title: { contains: kw } },
              { author: { contains: kw } },
              { transcript: { contains: kw } },
              { breakdown: { contains: kw } },
            ],
          }
        : {}),
    },
    include: { product: { select: { id: true, name: true } } },
  });
  return sortBenchmarks(items, filters.sort ?? "recent");
}

export async function getBenchmark(id: number) {
  return prisma.benchmark.findUnique({
    where: { id },
    include: { product: { select: { id: true, name: true } }, scriptIdeas: { select: { id: true, title: true } } },
  });
}

export async function createBenchmark(input: BenchmarkInput) {
  return prisma.benchmark.create({ data: input });
}

export async function updateBenchmark(id: number, input: Partial<BenchmarkInput>) {
  return prisma.benchmark.update({ where: { id }, data: input });
}

export async function deleteBenchmark(id: number) {
  await prisma.$transaction([
    prisma.scriptIdea.updateMany({ where: { benchmarkId: id }, data: { benchmarkId: null } }),
    prisma.benchmark.delete({ where: { id } }),
  ]);
}

/** 已用过的赛道列表，供筛选下拉。 */
export async function getBenchmarkTracks() {
  const rows = await prisma.benchmark.findMany({ select: { track: true }, distinct: ["track"] });
  return rows.map((r) => r.track).filter((t): t is string => !!t);
}
