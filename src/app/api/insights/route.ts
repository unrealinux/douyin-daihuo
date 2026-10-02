import { NextRequest, NextResponse } from "next/server";
import {
  INSIGHT_DIMENSIONS,
  getInsightBundle,
  getInsights,
  type InsightDimension,
} from "@/services/insightsService";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dimension = sp.get("dimension") as InsightDimension | null;
  const valid = new Set(INSIGHT_DIMENSIONS.map((d) => d.key));

  if (sp.get("all") === "1") {
    const bundle = await getInsightBundle();
    return NextResponse.json({ dimensions: INSIGHT_DIMENSIONS, bundle });
  }

  if (dimension && !valid.has(dimension)) {
    return NextResponse.json({ error: "无效的维度" }, { status: 400 });
  }
  const dim: InsightDimension = dimension && valid.has(dimension) ? dimension : "track";
  const rows = await getInsights(dim);
  return NextResponse.json({ dimension: dim, rows });
}
