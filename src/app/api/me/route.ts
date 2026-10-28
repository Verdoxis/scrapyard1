import { connection } from "next/server";
import { NextResponse } from "next/server";
import { botStatus, tickUserTrades } from "@/lib/steam-bot";
import { getUser, houseStats, publicUser } from "@/lib/store";
import { progressJackpot } from "@/lib/jackpot";
import { listCoinflips } from "@/lib/coinflip";

export async function GET() {
  await connection();
  const user = getUser();
  tickUserTrades(user);
  progressJackpot();
  return NextResponse.json({
    user: publicUser(user),
    bot: botStatus(),
    house: houseStats(),
    coinflips: listCoinflips().slice(0, 20),
  });
}
