import { NextResponse } from "next/server";
import { sellAll, sellSkin } from "@/lib/games";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.all) {
      return NextResponse.json(sellAll());
    }
    const instanceId = String(body.instanceId ?? "");
    return NextResponse.json(sellSkin(instanceId));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sell failed" },
      { status: 400 },
    );
  }
}
