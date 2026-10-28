import { connection } from "next/server";
import { NextResponse } from "next/server";
import { botStatus, tickUserTrades } from "@/lib/steam-bot";
import { getUser, publicUser } from "@/lib/store";

export async function GET() {
  await connection();
  const user = getUser();
  tickUserTrades(user);
  return NextResponse.json({
    bot: botStatus(),
    connected: user.steamConnected,
    items: publicUser(user).steamInventory,
    siteInventory: publicUser(user).siteInventory,
  });
}
