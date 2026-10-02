import { AccountStatus, Platform } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeAccountStats } from "@/lib/accountUtils";

export interface AccountInput {
  name: string;
  platform?: Platform | null;
  track?: string | null;
  handle?: string | null;
  status?: AccountStatus;
  followerCount?: number | null;
  note?: string | null;
}

const STR_FIELDS = ["track", "handle", "note"] as const;

export function pickAccountInput(body: Record<string, unknown>, requireName = false): Partial<AccountInput> {
  const out: Record<string, unknown> = {};
  if (typeof body.name === "string") out.name = body.name.trim();
  else if (requireName) throw new Error("name is required");

  for (const f of STR_FIELDS) {
    if (typeof body[f] === "string" || body[f] === null) {
      const v = body[f] as string | null;
      out[f] = typeof v === "string" ? v.trim() || null : null;
    }
  }
  if (typeof body.platform === "string" && (Object.values(Platform) as string[]).includes(body.platform)) {
    out.platform = body.platform;
  } else if (body.platform === null) {
    out.platform = null;
  }
  if (typeof body.status === "string" && (Object.values(AccountStatus) as string[]).includes(body.status)) {
    out.status = body.status;
  }
  if (body.followerCount === null || body.followerCount === "") out.followerCount = null;
  else if (body.followerCount !== undefined) {
    const n = Number(body.followerCount);
    if (Number.isFinite(n) && n >= 0) out.followerCount = Math.round(n);
  }
  return out as Partial<AccountInput>;
}

export async function listAccounts() {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    include: { schedules: { include: { performance: true } } },
  });
  return accounts.map((a) => {
    const { schedules, ...rest } = a;
    return { ...rest, stats: computeAccountStats(schedules) };
  });
}

export async function getAccount(id: number) {
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      schedules: {
        orderBy: { scheduledAt: "desc" },
        include: { performance: true, asset: { select: { id: true, title: true, fileName: true } } },
      },
    },
  });
  if (!account) return null;
  const { schedules, ...rest } = account;
  return { ...rest, schedules, stats: computeAccountStats(schedules) };
}

export async function createAccount(input: AccountInput) {
  return prisma.account.create({ data: input });
}

export async function updateAccount(id: number, input: Partial<AccountInput>) {
  return prisma.account.update({ where: { id }, data: input });
}

export async function deleteAccount(id: number) {
  await prisma.$transaction([
    prisma.schedule.updateMany({ where: { accountId: id }, data: { accountId: null } }),
    prisma.account.delete({ where: { id } }),
  ]);
}
