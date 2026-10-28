"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
import { useApp } from "@/components/app-provider";
import { ConnectGate } from "@/components/connect-gate";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CoinSide = "red" | "black";

interface CoinGame {
  id: string;
  status: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  creatorSide: CoinSide;
  joinerId?: string;
  joinerName?: string;
  joinerAvatar?: string | null;
  joinerSide?: CoinSide;
  totalValue: number;
  rakeValue: number;
  winnerId?: string;
  resultSide?: CoinSide;
  creatorItems: Array<{
    skin: { name: string; weapon: string; price: number; image?: string };
  }>;
  joinerItems: Array<{
    skin: { name: string; weapon: string; price: number; image?: string };
  }>;
}

function RustCoin({
  side,
  selected,
  size = "md",
  spinning,
}: {
  side: CoinSide;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  spinning?: boolean;
}) {
  const dim =
    size === "lg" ? "h-28 w-28" : size === "sm" ? "h-12 w-12" : "h-20 w-20";
  const isRed = side === "red";
  return (
    <motion.div
      aria-label={isRed ? "Red" : "Black"}
      className={cn(
        "relative flex items-center justify-center rounded-full",
        dim,
        selected && "ring-2 ring-[#f0a060] ring-offset-2 ring-offset-[#0a0806]",
      )}
      style={{
        background: isRed
          ? "radial-gradient(circle at 35% 30%, #e85a45, #8b1a12 55%, #3a0808)"
          : "radial-gradient(circle at 35% 30%, #3a3a3a, #121212 55%, #050505)",
        boxShadow: isRed
          ? "inset 0 0 0 3px rgba(255,180,140,0.25), 0 8px 20px rgba(140,20,10,0.45)"
          : "inset 0 0 0 3px rgba(180,180,180,0.2), 0 8px 20px rgba(0,0,0,0.55)",
      }}
      animate={spinning ? { rotateY: 720 } : { rotateY: 0 }}
      transition={spinning ? { duration: 1.4, ease: "easeInOut" } : { duration: 0 }}
    >
      <span
        className="pointer-events-none absolute inset-2 rounded-full border"
        style={{
          borderColor: isRed ? "rgba(255,120,80,0.35)" : "rgba(255,255,255,0.12)",
        }}
      />
    </motion.div>
  );
}

function PlayerChip({
  name,
  avatar,
  side,
}: {
  name: string;
  avatar: string | null | undefined;
  side: CoinSide;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar || "/logo.svg"}
        alt=""
        className="h-8 w-8 rounded-sm border border-[rgba(205,65,43,0.4)] object-cover"
      />
      <div>
        <p className="text-sm font-semibold text-[#efe6da]">{name}</p>
        <p
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: side === "red" ? "#e85a45" : "#a8a8a8" }}
        >
          {side}
        </p>
      </div>
    </div>
  );
}

export default function CoinflipPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#cd412b]">
        Red / black · {HOUSE_RAKE_PERCENT}% rake
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#efe6da]">
        Coinflip
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#a89888]">
        Pick skins, call red or black. Your Steam name shows on the lobby. Bot
        trades you in — winner takes the pot minus house cut.
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
  const [side, setSide] = useState<CoinSide>("red");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [spinId, setSpinId] = useState<string | null>(null);

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
    setSpinId(gameId);
    try {
      await api("/api/coinflip", {
        method: "POST",
        body: JSON.stringify({ action: "call_bot", gameId }),
      });
      setTimeout(() => {
        setMessage("Flip settled — check winnings on Connect Steam.");
        setSpinId(null);
        void refresh();
        void load();
      }, 1400);
    } catch (err) {
      setSpinId(null);
      setError(err instanceof Error ? err.message : "Bot call failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-[rgba(205,65,43,0.25)] bg-[rgba(18,14,10,0.9)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user?.avatarUrl || "/logo.svg"}
            alt=""
            className="h-12 w-12 rounded-sm border border-[rgba(205,65,43,0.4)] object-cover"
          />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
              Playing as
            </p>
            <p className="font-display text-2xl tracking-wide text-[#efe6da]">
              {user?.displayName || "Steam user"}
            </p>
          </div>
        </div>

        <h2 className="font-display text-2xl text-[#efe6da]">Call a side</h2>
        <div className="grid grid-cols-2 gap-3">
          {(["red", "black"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={cn(
                "flex flex-col items-center gap-3 rounded-sm border p-4 transition",
                side === s
                  ? "border-[#f0a060] bg-[rgba(205,65,43,0.12)]"
                  : "border-[rgba(255,255,255,0.08)] bg-black/30",
              )}
            >
              <RustCoin side={s} selected={side === s} />
              <span className="font-display text-xl tracking-wider text-[#efe6da]">
                {s.toUpperCase()}
              </span>
            </button>
          ))}
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
          className="bg-[#cd412b] text-[#140c08] hover:bg-[#e25a3c]"
        >
          {busy ? "Working…" : "Send bot trade & create lobby"}
        </Button>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl text-[#efe6da]">Open flips</h2>
        {games.length === 0 ? (
          <p className="text-sm text-[#a89888]">No active coinflips yet.</p>
        ) : (
          games.map((g) => (
            <div
              key={g.id}
              className="rounded-sm border border-[rgba(205,65,43,0.28)] bg-[rgba(18,14,10,0.92)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <PlayerChip
                  name={g.creatorName}
                  avatar={g.creatorAvatar}
                  side={g.creatorSide}
                />
                <div className="flex items-center gap-2">
                  <RustCoin
                    side={g.resultSide || g.creatorSide}
                    size="sm"
                    spinning={spinId === g.id || g.status === "flipping"}
                  />
                  <p className="font-mono text-[#f0a060]">
                    {formatPrice(g.totalValue)}
                  </p>
                </div>
              </div>

              {g.joinerName && g.joinerSide && (
                <div className="mt-3">
                  <PlayerChip
                    name={g.joinerName}
                    avatar={g.joinerAvatar}
                    side={g.joinerSide}
                  />
                </div>
              )}

              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#8a7d70]">
                {g.status.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs text-[#a89888]">
                {g.creatorName}:{" "}
                {g.creatorItems
                  .map((i) => `${i.skin.name} (${formatPrice(i.skin.price)})`)
                  .join(", ")}
              </p>
              {g.joinerItems.length > 0 && g.joinerName && (
                <p className="text-xs text-[#a89888]">
                  {g.joinerName}:{" "}
                  {g.joinerItems
                    .map((i) => `${i.skin.name} (${formatPrice(i.skin.price)})`)
                    .join(", ")}
                </p>
              )}

              {g.status === "settled" && (
                <p className="mt-2 text-sm text-[#efe6da]">
                  <span
                    style={{
                      color: g.resultSide === "red" ? "#e85a45" : "#c8c8c8",
                    }}
                  >
                    {g.resultSide?.toUpperCase()}
                  </span>{" "}
                  wins · rake {formatPrice(g.rakeValue)} ·{" "}
                  {g.winnerId === user?.id
                    ? g.creatorName
                    : g.winnerId === "house-bot"
                      ? g.joinerName || "Scrapyard Bot"
                      : g.winnerId === g.creatorId
                        ? g.creatorName
                        : g.joinerName}
                </p>
              )}

              {(g.status === "open" || g.status === "awaiting_creator_trade") &&
                g.creatorId === user?.id && (
                  <Button
                    size="sm"
                    className="mt-3 bg-[rgba(205,65,43,0.25)] text-[#f0a060] hover:bg-[rgba(205,65,43,0.4)]"
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
