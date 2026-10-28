import { connection } from "next/server";
import { NextResponse } from "next/server";
import { acceptPayoutTrade, tickUserTrades } from "@/lib/steam-bot";
import { getUser, publicUser } from "@/lib/store";

export async function GET() {
  await connection();
  const user = getUser();
  tickUserTrades(user);
  return NextResponse.json({ trades: user.trades, user: publicUser(user) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "accept_payout");
    const user = getUser();

    if (action === "accept_payout") {
      const trade = acceptPayoutTrade(user, String(body.tradeId));
      return NextResponse.json({
        trade,
        user: publicUser(user),
        message: trade.message,
      });
    }

    throw new Error("Unknown action");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Trade failed" },
      { status: 400 },
    );
  }
}
