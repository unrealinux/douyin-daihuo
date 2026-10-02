import { NextResponse } from "next/server";
import { getPerformanceSummary, listPerformance } from "@/services/performanceService";

export async function GET() {
  const [list, summary] = await Promise.all([listPerformance(), getPerformanceSummary()]);
  return NextResponse.json({ list, summary });
}
