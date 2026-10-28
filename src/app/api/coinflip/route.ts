import { connection } from "next/server";
import { NextResponse } from "next/server";
import {
  callBotOpponent,
  createCoinflip,
  joinCoinflip,
  listCoinflips,
  progressCoinflip,
} from "@/lib/coinflip";

export async function GET() {
  await connection();
  return NextResponse.json({ games: listCoinflips() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "create");

    if (action === "create") {
      const side = body.side === "black" ? "black" : "red";
      const assetIds = Array.isArray(body.assetIds)
        ? body.assetIds.map(String)
        : [];
      return NextResponse.json(createCoinflip(assetIds, side));
    }

    if (action === "join") {
      const assetIds = Array.isArray(body.assetIds)
        ? body.assetIds.map(String)
        : [];
      return NextResponse.json(joinCoinflip(String(body.gameId), assetIds));
    }

    if (action === "call_bot") {
      return NextResponse.json({
        game: callBotOpponent(String(body.gameId)),
      });
    }

    if (action === "progress") {
      return NextResponse.json({
        game: progressCoinflip(String(body.gameId)),
      });
    }

    throw new Error("Unknown action");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Coinflip failed" },
      { status: 400 },
    );
  }
}
