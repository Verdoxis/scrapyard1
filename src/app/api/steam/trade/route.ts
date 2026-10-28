import { connection } from "next/server";
import { NextResponse } from "next/server";
import {
  createDepositTrade,
  createWithdrawTrade,
  tickTrades,
} from "@/lib/steam-bot";
import { getUser, publicUser } from "@/lib/store";

export async function GET() {
  await connection();
  const user = getUser();
  tickTrades(user);
  return NextResponse.json({ trades: user.trades, user: publicUser(user) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = getUser();
    const type = String(body.type);
    const steamTradeUrl = String(body.steamTradeUrl ?? user.steamTradeUrl ?? "");

    let trade;
    if (type === "deposit") {
      trade = createDepositTrade(
        user,
        steamTradeUrl,
        Array.isArray(body.skinIds) ? body.skinIds.map(String) : [],
      );
    } else if (type === "withdraw") {
      trade = createWithdrawTrade(
        user,
        steamTradeUrl,
        Array.isArray(body.instanceIds) ? body.instanceIds.map(String) : [],
      );
    } else {
      throw new Error("type must be deposit or withdraw");
    }

    return NextResponse.json({ trade, user: publicUser(user) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Trade failed" },
      { status: 400 },
    );
  }
}
