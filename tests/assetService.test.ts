import { describe, it, expect } from "vitest";
import { pickAssetUpdate, resolveSafeUploadPath, getFileExt, UPLOAD_DIR } from "@/services/assetService";
import path from "path";

describe("assetService guards", () => {
  it("pickAssetUpdate only allows safe fields", () => {
    const patch = pickAssetUpdate({
      title: "t",
      filePath: "evil",
      fileName: "x.exe",
      status: "PUBLISHED",
      unknown: 1,
    });
    expect(patch).toEqual({ title: "t", status: "PUBLISHED" });
    expect((patch as Record<string, unknown>).filePath).toBeUndefined();
  });

  it("resolveSafeUploadPath rejects path traversal", () => {
    expect(resolveSafeUploadPath("data/uploads/a.mp4")).toBe(path.join(UPLOAD_DIR, "a.mp4"));
    expect(resolveSafeUploadPath("data/uploads/../.env")).toBeNull();
    expect(resolveSafeUploadPath("C:/Windows/System32/x")).toBeNull();
  });

  it("getFileExt rejects unknown types", () => {
    expect(getFileExt("a.mp4")).toBe("VIDEO");
    expect(getFileExt("a.png")).toBe("IMAGE");
    expect(getFileExt("a.exe")).toBeNull();
  });
});
