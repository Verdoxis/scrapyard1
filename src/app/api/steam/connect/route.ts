import { NextResponse } from "next/server";
import { fetchSteamProfile } from "@/lib/steam-profile";
import { connectSteam, getUser, publicUser } from "@/lib/store";
import { heartbeat } from "@/lib/chat";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tradeUrl = String(body.steamTradeUrl ?? "");
    const user = getUser();
    const profile = await fetchSteamProfile(tradeUrl);

    connectSteam(user, tradeUrl, {
      displayName: body.displayName ? String(body.displayName) : undefined,
      steamId64: profile?.steamId64 ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      profileUrl: profile?.profileUrl ?? null,
      personaName: profile?.personaName ?? null,
    });

    heartbeat({
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });

    return NextResponse.json({
      user: publicUser(user),
      profile,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connect failed" },
      { status: 400 },
    );
  }
}
