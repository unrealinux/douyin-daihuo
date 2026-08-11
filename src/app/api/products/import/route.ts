import { NextRequest, NextResponse } from "next/server";
import { importProductsCsv } from "@/services/productService";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
  const text = await file.text();
  try {
    const created = await importProductsCsv(text);
    return NextResponse.json({ count: created.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
