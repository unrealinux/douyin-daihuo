import { NextRequest, NextResponse } from "next/server";
import {
  createBenchmark,
  getBenchmarkTracks,
  listBenchmarks,
  pickBenchmarkInput,
  type BenchmarkFilters,
} from "@/services/benchmarkService";
import type { Platform } from "@prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: BenchmarkFilters = {
    track: sp.get("track") ?? undefined,
    platform: (sp.get("platform") as Platform | "ALL" | null) ?? undefined,
    keyword: sp.get("keyword") ?? undefined,
    sort: (sp.get("sort") as BenchmarkFilters["sort"]) ?? undefined,
  };
  const [items, tracks] = await Promise.all([listBenchmarks(filters), getBenchmarkTracks()]);
  return NextResponse.json({ items, tracks });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = pickBenchmarkInput(body, true) as { title: string };
    const created = await createBenchmark(data);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
