import { connection } from "next/server";
import { NextResponse } from "next/server";
import {
  applySelfBan,
  getUser,
  isSelfBanned,
  publicUser,
} from "@/lib/store";

const BAN_OPTIONS: Record<string, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  permanent: 100 * 365 * 24 * 60 * 60 * 1000,
};

export async function GET() {
  await connection();
  const user = getUser();
  return NextResponse.json({
    user: publicUser(user),
    selfBanned: isSelfBanned(user),
    banOptions: Object.keys(BAN_OPTIONS),
  });
}

export async function POST(req: Request) {
  try {
    await connection();
    const body = await req.json();
    const action = String(body.action ?? "");
    const user = getUser();

    if (action === "self_ban") {
      const key = String(body.duration ?? "7d");
      const ms = BAN_OPTIONS[key];
      if (!ms) throw new Error("Pick a valid self-ban duration.");
      const until = applySelfBan(user, ms);
      return NextResponse.json({
        user: publicUser(user),
        selfBanUntil: until,
        message: `Self-ban set until ${new Date(until).toLocaleString()}.`,
      });
    }

    throw new Error("Unknown action");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stats action failed" },
      { status: 400 },
    );
  }
}
