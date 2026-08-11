import { NextRequest, NextResponse } from "next/server";
import { listProducts, createProduct, ProductFilters } from "@/services/productService";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: ProductFilters = {
    status: (sp.get("status") as ProductFilters["status"]) ?? undefined,
    category: sp.get("category") ?? undefined,
    minRate: sp.get("minRate") && Number.isFinite(Number(sp.get("minRate"))) ? Number(sp.get("minRate")) : undefined,
    sort: (sp.get("sort") as ProductFilters["sort"]) ?? undefined,
    order: (sp.get("order") as ProductFilters["order"]) ?? undefined,
    keyword: sp.get("keyword") ?? undefined,
  };
  const items = await listProducts(filters);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
