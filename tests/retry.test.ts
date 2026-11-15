import { describe, it, expect } from "vitest";
import { retryAsync } from "@/lib/retry";

describe("retryAsync", () => {
  it("does not retry when the first call succeeds", async () => {
    let calls = 0;
    const out = await retryAsync(async () => {
      calls++;
      return "ok";
    }, { delayMs: 0 });
    expect(out).toBe("ok");
    expect(calls).toBe(1);
  });

  it("retries once and returns the second result", async () => {
    let calls = 0;
    const out = await retryAsync(async (attempt) => {
      calls++;
      if (attempt === 1) throw new Error("boom");
      return attempt;
    }, { delayMs: 0 });
    expect(out).toBe(2);
    expect(calls).toBe(2);
  });

  it("throws the last error after exhausting attempts", async () => {
    let calls = 0;
    await expect(
      retryAsync(async (attempt) => {
        calls++;
        throw new Error(`fail-${attempt}`);
      }, { delayMs: 0 })
    ).rejects.toThrow("fail-2");
    expect(calls).toBe(2);
  });

  it("honours attempts: 1", async () => {
    let calls = 0;
    await expect(
      retryAsync(async () => {
        calls++;
        throw new Error("nope");
      }, { attempts: 1, delayMs: 0 })
    ).rejects.toThrow("nope");
    expect(calls).toBe(1);
  });
});
