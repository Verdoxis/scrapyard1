import { NextResponse } from "next/server";
import { playCoinflip } from "@/lib/games";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const betAmount = Number(body.betAmount);
    const side = String(body.side) as "ct" | "t";
    if (side !== "ct" && side !== "t") {
      throw new Error("Pick CT or T.");
    }
    const result = playCoinflip(betAmount, side);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Coinflip failed" },
      { status: 400 },
    );
  }
}
