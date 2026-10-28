import { NextResponse } from "next/server";
import { botStatus } from "@/lib/steam-bot";
import { dataFilePath } from "@/lib/persist";
import fs from "fs";

export async function GET() {
  const bot = botStatus();
  let persisted = false;
  try {
    persisted = fs.existsSync(dataFilePath());
  } catch {
    persisted = false;
  }
  return NextResponse.json({
    ok: true,
    service: "scrapyard",
    bot,
    persisted,
    time: new Date().toISOString(),
  });
}
