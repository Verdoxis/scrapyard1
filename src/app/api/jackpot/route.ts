import { connection } from "next/server";
import { NextResponse } from "next/server";
import { depositToJackpot, getPublicJackpot, progressJackpot } from "@/lib/jackpot";

export async function GET() {
  await connection();
  return NextResponse.json({ round: getPublicJackpot() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "deposit");

    if (action === "deposit") {
      const assetIds = Array.isArray(body.assetIds)
        ? body.assetIds.map(String)
        : [];
      return NextResponse.json(depositToJackpot(assetIds));
    }

    if (action === "progress") {
      return NextResponse.json({ round: progressJackpot() });
    }

    throw new Error("Unknown action");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Jackpot failed" },
      { status: 400 },
    );
  }
}
