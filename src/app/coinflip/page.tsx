"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
import { useApp } from "@/components/app-provider";
import { ConnectGate } from "@/components/connect-gate";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { Button } from "@/components/ui/button";

interface CoinGame {
  id: string;
  status: string;
  creatorId: string;
  creatorSide: "ct" | "t";
  joinerId?: string;
  joinerSide?: "ct" | "t";
  totalValue: number;
  rakeValue: number;
  winnerId?: string;
  resultSide?: "ct" | "t";
  creatorItems: Array<{ skin: { name: string; weapon: string; price: number } }>;
  joinerItems: Array<{ skin: { name: string; weapon: string; price: number } }>;
}

export default function CoinflipPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
        Skin vs skin · {HOUSE_RAKE_PERCENT}% rake
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Coinflip
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#a89a8c]">
        Pick skins from your listed Steam inventory. The bot sends you a trade
        for those items. Once accepted, your lobby opens — call a bot opponent
        or wait for a joiner. Winner takes the pot minus the house cut.
      </p>
      <div className="mt-8">
        <ConnectGate>
          <CoinflipLobby />
        </ConnectGate>
      </div>
    </main>
  );
}

function CoinflipLobby() {
  const { user, refresh } = useApp();
  const [games, setGames] = useState<CoinGame[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [side, setSide] = useState<"ct" | "t">("ct");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api<{ games: CoinGame[] }>("/api/coinflip");
    setGames(data.games);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 2000);
    return () => clearInterval(id);
  }, [load]);

  async function create() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api<{ trade: { message: string } }>("/api/coinflip", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          assetIds: selected,
          side,
        }),
      });
      setSelected([]);
      setMessage(data.trade.message);
      await refresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function callBot(gameId: string) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/coinflip", {
        method: "POST",
        body: JSON.stringify({ action: "call_bot", gameId }),
      });
      setMessage("Flip settled — check winnings on Connect Steam.");
      await refresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bot call failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-[#f3ebe2]">
          Create a flip
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("ct")}
            className="rounded border px-4 py-3 font-display text-xl"
            style={{
              borderColor: side === "ct" ? "#60a5fa" : "rgba(255,255,255,0.1)",
              background: "linear-gradient(145deg,#243a52,#152030)",
              color: "#dbeafe",
            }}
          >
            CT
          </button>
          <button
            type="button"
            onClick={() => setSide("t")}
            className="rounded border px-4 py-3 font-display text-xl"
            style={{
              borderColor: side === "t" ? "#f0a060" : "rgba(255,255,255,0.1)",
              background: "linear-gradient(145deg,#6b3a22,#2a160e)",
              color: "#fde7d4",
            }}
          >
            T
          </button>
        </div>
        <InventoryPicker
          items={user?.steamInventory ?? []}
          selected={selected}
          onToggle={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          emptyText="No unlocked Steam skins — connect Steam or wait for trades to finish."
        />
        <Button
          disabled={busy || selected.length === 0}
          onClick={() => void create()}
          className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
        >
          {busy ? "Working…" : "Send bot trade & create lobby"}
        </Button>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl text-[#f3ebe2]">Open flips</h2>
        {games.length === 0 ? (
          <p className="text-sm text-[#a89a8c]">No active coinflips yet.</p>
        ) : (
          games.map((g) => (
            <div
              key={g.id}
              className="rounded border border-[rgba(196,92,38,0.25)] bg-[rgba(20,16,12,0.9)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg capitalize text-[#f3ebe2]">
                  {g.creatorSide.toUpperCase()} · {g.status.replaceAll("_", " ")}
                </p>
                <p className="font-mono text-[#f0a060]">
                  {formatPrice(g.totalValue)}
                </p>
              </div>
              <p className="mt-1 text-xs text-[#a89a8c]">
                Creator items:{" "}
                {g.creatorItems
                  .map((i) => `${i.skin.weapon} ${i.skin.name}`)
                  .join(", ")}
              </p>
              {g.joinerItems.length > 0 && (
                <p className="text-xs text-[#a89a8c]">
                  Joiner:{" "}
                  {g.joinerItems
                    .map((i) => `${i.skin.weapon} ${i.skin.name}`)
                    .join(", ")}
                </p>
              )}
              {g.status === "settled" && (
                <p className="mt-2 text-sm text-[#f3ebe2]">
                  {g.resultSide?.toUpperCase()} wins · rake{" "}
                  {formatPrice(g.rakeValue)} · winner{" "}
                  {g.winnerId === user?.id
                    ? "you"
                    : g.winnerId === "house-bot"
                      ? "bot"
                      : g.winnerId}
                </p>
              )}
              {(g.status === "open" || g.status === "awaiting_creator_trade") &&
                g.creatorId === user?.id && (
                  <Button
                    size="sm"
                    className="mt-3 bg-[rgba(196,92,38,0.25)] text-[#f0a060] hover:bg-[rgba(196,92,38,0.4)]"
                    disabled={busy || g.status !== "open"}
                    onClick={() => void callBot(g.id)}
                  >
                    {g.status === "open"
                      ? "Call bot opponent"
                      : "Waiting for your trade…"}
                  </Button>
                )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
