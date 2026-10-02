import { NextResponse } from "next/server";
import { createAccount, listAccounts, pickAccountInput } from "@/services/accountService";

export async function GET() {
  const accounts = await listAccounts();
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = pickAccountInput(body, true) as { name: string };
    const account = await createAccount(data);
    return NextResponse.json(account, { status: 201 });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
