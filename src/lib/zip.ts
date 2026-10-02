/**
 * 极简 ZIP 打包器（仅 store，不压缩）。用于导出 SOP 标准化素材包。
 * 不依赖任何第三方库；文件名按 UTF-8 编码并置 UTF-8 标志位。
 */

export interface ZipEntry {
  name: string;
  content: string | Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// DOS 时间戳：固定为 2024-01-01 00:00:00，保证输出稳定可测。
const DOS_TIME = 0;
const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1;

function u16(out: number[], v: number) {
  out.push(v & 0xff, (v >>> 8) & 0xff);
}

function u32(out: number[], v: number) {
  out.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
}

export function createZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: number[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = typeof entry.content === "string" ? encoder.encode(entry.content) : entry.content;
    const crc = crc32(data);

    const local: number[] = [];
    u32(local, 0x04034b50); // local file header signature
    u16(local, 20); // version needed
    u16(local, 0x0800); // UTF-8 filename flag
    u16(local, 0); // compression = store
    u16(local, DOS_TIME);
    u16(local, DOS_DATE);
    u32(local, crc);
    u32(local, data.length); // compressed size
    u32(local, data.length); // uncompressed size
    u16(local, nameBytes.length);
    u16(local, 0); // extra length
    chunks.push(new Uint8Array(local), nameBytes, data);

    u32(central, 0x02014b50); // central directory signature
    u16(central, 20); // version made by
    u16(central, 20); // version needed
    u16(central, 0x0800);
    u16(central, 0);
    u16(central, DOS_TIME);
    u16(central, DOS_DATE);
    u32(central, crc);
    u32(central, data.length);
    u32(central, data.length);
    u16(central, nameBytes.length);
    u16(central, 0); // extra
    u16(central, 0); // comment
    u16(central, 0); // disk number
    u16(central, 0); // internal attrs
    u32(central, 0); // external attrs
    u32(central, offset); // relative offset of local header
    central.push(...nameBytes);

    offset += local.length + nameBytes.length + data.length;
  }

  const centralBytes = new Uint8Array(central);
  const eocd: number[] = [];
  u32(eocd, 0x06054b50); // end of central directory signature
  u16(eocd, 0); // disk number
  u16(eocd, 0); // disk with central directory
  u16(eocd, entries.length);
  u16(eocd, entries.length);
  u32(eocd, centralBytes.length);
  u32(eocd, offset); // central directory offset
  u16(eocd, 0); // comment length
  const eocdBytes = new Uint8Array(eocd);

  const total = offset + centralBytes.length + eocdBytes.length;
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  out.set(centralBytes, cursor);
  cursor += centralBytes.length;
  out.set(eocdBytes, cursor);
  return out;
}
