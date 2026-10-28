import { NextResponse } from "next/server";
import { openCase } from "@/lib/games";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const caseId = String(body.caseId ?? "");
    const result = openCase(caseId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to open case" },
      { status: 400 },
    );
  }
}
