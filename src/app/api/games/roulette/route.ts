import { NextResponse } from "next/server";
import { playRoulette, type RouletteColor } from "@/lib/games";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const betAmount = Number(body.betAmount);
    const color = String(body.color) as RouletteColor;
    if (!["red", "black", "green"].includes(color)) {
      throw new Error("Pick red, black, or green.");
    }
    const result = playRoulette(betAmount, color);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Roulette failed" },
      { status: 400 },
    );
  }
}
