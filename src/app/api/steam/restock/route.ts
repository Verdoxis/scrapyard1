import { NextResponse } from "next/server";
import {
  assertNotSelfBanned,
  getUser,
  publicUser,
  restockDemoInventory,
} from "@/lib/store";

export async function POST() {
  try {
    const user = getUser();
    if (!user.steamConnected) {
      throw new Error("Connect Steam first, then restock the demo inventory.");
    }
    assertNotSelfBanned(user);
    restockDemoInventory(user);
    return NextResponse.json({
      user: publicUser(user),
      message: `Restocked ${user.steamInventory.length} demo skins.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Restock failed" },
      { status: 400 },
    );
  }
}
