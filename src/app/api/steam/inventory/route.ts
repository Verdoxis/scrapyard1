import { connection } from "next/server";
import { NextResponse } from "next/server";
import { mockSteamInventory } from "@/lib/store";
import { botStatus } from "@/lib/steam-bot";

export async function GET() {
  await connection();
  return NextResponse.json({
    bot: botStatus(),
    items: mockSteamInventory(),
  });
}
