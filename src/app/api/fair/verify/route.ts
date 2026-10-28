import { connection } from "next/server";
import { NextResponse } from "next/server";
import { fairFloat, hashServerSeed } from "@/lib/fairness";
import { getCoinflip, getJackpot, itemsValue } from "@/lib/store";

export async function GET(req: Request) {
  await connection();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "jackpot" ? "jackpot" : "coinflip";
  const id = String(searchParams.get("id") ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { error: "Enter a Game ID." },
      { status: 400 },
    );
  }

  if (type === "coinflip") {
    const game = getCoinflip(id);
    if (!game) {
      return NextResponse.json(
        { error: "Coinflip not found." },
        { status: 404 },
      );
    }
    if (game.status !== "settled" && game.status !== "flipping") {
      return NextResponse.json(
        {
          error:
            "Round is still open — the server seed is revealed after settle.",
          preview: {
            id: game.id,
            status: game.status,
            serverSeedHash: game.serverSeedHash,
            clientSeed: game.clientSeed,
            nonce: game.nonce,
          },
        },
        { status: 400 },
      );
    }
    if (!game.serverSeed) {
      return NextResponse.json(
        { error: "Server seed not available for this round." },
        { status: 400 },
      );
    }

    const roll = fairFloat(game.serverSeed, game.clientSeed, game.nonce);
    const hashCheck = hashServerSeed(game.serverSeed);
    const creatorWager = itemsValue(game.creatorItems);
    const joinerWager = itemsValue(game.joinerItems);
    const total = creatorWager + joinerWager;
    const creatorChance = total > 0 ? creatorWager / total : 0.5;

    return NextResponse.json({
      type: "coinflip",
      id: game.id,
      status: game.status,
      serverSeed: game.serverSeed,
      serverSeedHash: game.serverSeedHash,
      hashMatches: hashCheck === game.serverSeedHash,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      roll,
      resultSide: game.resultSide,
      winnerId: game.winnerId,
      creatorChance,
      explanation: `Roll ${roll.toFixed(8)} vs creator share ${(creatorChance * 100).toFixed(2)}% — creator wins if roll < share.`,
    });
  }

  const round = getJackpot();
  if (round.id !== id) {
    // Only current in-memory round exists in this demo — still try match
    return NextResponse.json(
      {
        error:
          "Jackpot round not found. In this demo only the current round is kept in memory — paste its ID after it settles.",
      },
      { status: 404 },
    );
  }
  if (round.status !== "settled" && round.status !== "spinning") {
    return NextResponse.json(
      {
        error: "Round is still open — seeds unlock after the spin.",
        preview: {
          id: round.id,
          status: round.status,
          serverSeedHash: round.serverSeedHash,
          clientSeed: round.clientSeed,
          nonce: round.nonce,
        },
      },
      { status: 400 },
    );
  }
  if (!round.serverSeed) {
    return NextResponse.json(
      { error: "Server seed not available yet." },
      { status: 400 },
    );
  }

  const roll = fairFloat(round.serverSeed, round.clientSeed, round.nonce);
  const hashCheck = hashServerSeed(round.serverSeed);

  return NextResponse.json({
    type: "jackpot",
    id: round.id,
    status: round.status,
    serverSeed: round.serverSeed,
    serverSeedHash: round.serverSeedHash,
    hashMatches: hashCheck === round.serverSeedHash,
    clientSeed: round.clientSeed,
    nonce: round.nonce,
    roll,
    winningTicket: round.winningTicket,
    winnerId: round.winnerId,
    explanation: `Winning ticket ${roll.toFixed(8)} lands on the deposit slice covering that point on the chance line.`,
  });
}
