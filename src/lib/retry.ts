/** 轻量重试：失败后按 delayMs 线性退避，用尽后抛最后一次错误。 */
export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

export async function retryAsync<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = Math.max(1, opts.attempts ?? 2);
  const delayMs = Math.max(0, opts.delayMs ?? 800);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      if (attempt < attempts) await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastErr;
}
