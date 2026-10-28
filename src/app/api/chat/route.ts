import { connection } from "next/server";
import { NextResponse } from "next/server";
import {
  heartbeat,
  listMessages,
  onlineSnapshot,
  postMessage,
} from "@/lib/chat";

export async function GET() {
  await connection();
  const online = heartbeat();
  return NextResponse.json({
    messages: listMessages(),
    online,
  });
}

export async function POST(req: Request) {
  try {
    await connection();
    const body = await req.json();
    const action = String(body.action ?? "send");

    if (action === "ping") {
      return NextResponse.json({ online: heartbeat() });
    }

    const msg = postMessage(String(body.text ?? ""));
    return NextResponse.json({
      message: msg,
      messages: listMessages(),
      online: onlineSnapshot(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 400 },
    );
  }
}
