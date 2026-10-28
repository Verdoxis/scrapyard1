import { NextResponse } from "next/server";
import { addDemoBalance } from "@/lib/games";

export async function POST() {
  const result = addDemoBalance(2500);
  return NextResponse.json(result);
}
