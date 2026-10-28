import { connection } from "next/server";
import { NextResponse } from "next/server";
import { tickUserTrades } from "@/lib/steam-bot";
import { getUser, publicUser } from "@/lib/store";

export async function GET() {
  await connection();
  const user = getUser();
  tickUserTrades(user);
  return NextResponse.json({ trades: user.trades, user: publicUser(user) });
}
