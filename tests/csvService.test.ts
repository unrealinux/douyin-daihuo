import { describe, it, expect } from "vitest";
import { parseProductsCsv } from "@/services/csvService";

describe("csvService", () => {
  it("parses standard columns", () => {
    const csv = "名称,链接,价格,佣金率,销量,类目\n测试商品,http://x.com,99,30,1000,家居\n";
    const rows = parseProductsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "测试商品",
      url: "http://x.com",
      price: 99,
      commissionRate: 30,
      dailySales: 1000,
      category: "家居",
    });
  });

  it("handles commissionRate with % sign", () => {
    const rows = parseProductsCsv("名称,佣金率\n商品A,25%\n");
    expect(rows[0].commissionRate).toBe(25);
  });

  it("supports english column names", () => {
    const csv = "name,price\ngoods,50\n";
    const rows = parseProductsCsv(csv);
    expect(rows[0].name).toBe("goods");
    expect(rows[0].price).toBe(50);
  });

  it("skips empty rows and rows without name", () => {
    const csv = "名称,价格\n\n,10\n有名字,5\n";
    const rows = parseProductsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("有名字");
  });
});
