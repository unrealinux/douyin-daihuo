import { describe, it, expect } from "vitest";
import { createZip } from "@/lib/zip";

/** 极简 ZIP 读取器（仅 store），用于往返校验。 */
function readZip(bytes: Uint8Array): Record<string, string> {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("no eocd");
  const count = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const files: Record<string, string> = {};
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    expect(dv.getUint32(p, true)).toBe(0x02014b50);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    const lNameLen = dv.getUint16(localOffset + 26, true);
    const lExtraLen = dv.getUint16(localOffset + 28, true);
    const size = dv.getUint32(localOffset + 22, true);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    files[name] = decoder.decode(bytes.subarray(dataStart, dataStart + size));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

describe("createZip", () => {
  it("round-trips text files with Chinese names", () => {
    const zip = createZip([
      { name: "新文案.txt", content: "康熙八岁登基。" },
      { name: "发布信息.md", content: "# 标题\n测试" },
    ]);
    const files = readZip(zip);
    expect(files["新文案.txt"]).toBe("康熙八岁登基。");
    expect(files["发布信息.md"]).toContain("# 标题");
  });

  it("starts with a local file header signature", () => {
    const zip = createZip([{ name: "a.txt", content: "x" }]);
    expect([...zip.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("handles an empty entry list", () => {
    const zip = createZip([]);
    const files = readZip(zip);
    expect(Object.keys(files)).toHaveLength(0);
  });
});
