import { parse } from "csv-parse/sync";

export interface CsvProductRow {
  name: string;
  url?: string;
  category?: string;
  price?: number;
  commissionRate?: number;
  dailySales?: number;
}

const toNum = (v: string | undefined): number | undefined => {
  if (!v || String(v).trim() === "") return undefined;
  const n = Number(String(v).replace("%", "").trim());
  return Number.isFinite(n) ? n : undefined;
};

const toInt = (v: string | undefined): number | undefined => {
  const n = toNum(v);
  return n === undefined ? undefined : Math.round(n);
};

export function parseProductsCsv(text: string): CsvProductRow[] {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  return records
    .map((r) => {
      const name = (r["名称"] ?? r["name"] ?? "").trim();
      return {
        name,
        url: (r["链接"] ?? r["url"] ?? "") || undefined,
        category: (r["类目"] ?? r["category"] ?? "") || undefined,
        price: toNum(r["价格"] ?? r["price"]),
        commissionRate: toNum(r["佣金率"] ?? r["commissionRate"]),
        dailySales: toInt(r["销量"] ?? r["dailySales"]),
      };
    })
    .filter((r) => r.name);
}
