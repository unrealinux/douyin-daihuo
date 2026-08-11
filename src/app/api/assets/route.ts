import { NextResponse } from "next/server";
import { listAssets } from "@/services/assetService";

export async function GET() {
  const assets = await listAssets();
  return NextResponse.json(assets);
}
