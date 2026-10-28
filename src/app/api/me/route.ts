import { connection } from "next/server";
import { NextResponse } from "next/server";
import { heartbeat } from "@/lib/chat";
import { listCoinflips } from "@/lib/coinflip";
import { progressJackpot } from "@/lib/jackpot";
import { botStatus, tickUserTrades } from "@/lib/steam-bot";
import { getUser, houseStats, publicUser } from "@/lib/store";

export async function GET() {
  await connection();
  const user = getUser();
  tickUserTrades(user);
  progressJackpot();
  const online = heartbeat({
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  });
  return NextResponse.json({
    user: publicUser(user),
    bot: botStatus(),
    house: houseStats(),
    coinflips: listCoinflips().slice(0, 20),
    onlineCount: online.count,
  });
}
