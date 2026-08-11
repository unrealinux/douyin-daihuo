import { NextResponse } from "next/server";
import { listScripts } from "@/services/scriptService";

export async function GET() {
  const scripts = await listScripts();
  return NextResponse.json(scripts);
}
