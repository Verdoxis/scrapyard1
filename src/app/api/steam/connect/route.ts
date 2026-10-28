import { NextResponse } from "next/server";
import { connectSteam, getUser, publicUser } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = getUser();
    connectSteam(
      user,
      String(body.steamTradeUrl ?? ""),
      body.displayName ? String(body.displayName) : undefined,
    );
    return NextResponse.json({ user: publicUser(user) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connect failed" },
      { status: 400 },
    );
  }
}
