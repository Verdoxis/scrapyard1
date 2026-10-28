import { connection } from "next/server";
import { NextResponse } from "next/server";
import { botStatus, tickTrades } from "@/lib/steam-bot";
import { getUser, inventoryValue, publicUser } from "@/lib/store";

export async function GET() {
  await connection();
  const user = getUser();
  tickTrades(user);
  return NextResponse.json({
    user: publicUser(user),
    inventoryValue: inventoryValue(user),
    bot: botStatus(),
  });
}
