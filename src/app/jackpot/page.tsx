"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
import { useApp } from "@/components/app-provider";
import { ConnectGate } from "@/components/connect-gate";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { SkinIconRow } from "@/components/skin-icons";
import { Button } from "@/components/ui/button";
import type { Skin } from "@/lib/skins";

interface JackpotRound {
  id: string;
  status: string;
  totalValue: number;
  rakeValue: number;
  endsAt: number;
  winnerId?: string;
  deposits: Array<{
    userId: string;
    displayName: string;
    value: number;
    items: Array<{ skin: Skin }>;
  }>;
  pendingTrades: string[];
}

export default function JackpotPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
        Shared pot · {HOUSE_RAKE_PERCENT}% rake
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Jackpot
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#a89a8c]">
        Select skins from your Steam list. The bot trades you for them, then
        they enter the pot. Chance to win scales with deposit value. When the
        timer ends, one player takes the pot minus the house cut.
      </p>
      <div className="mt-8">
        <ConnectGate>
          <JackpotPanel />
        </ConnectGate>
      </div>
    </main>
  );
}

function JackpotPanel() {
  const { user, refresh } = useApp();
  const [round, setRound] = useState<JackpotRound | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const data = await api<{ round: JackpotRound }>("/api/jackpot");
    setRound(data.round);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      void load();
      setNow(Date.now());
    }, 1500);
    return () => clearInterval(id);
  }, [load]);

  async function deposit() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api<{ trade: { message: string } }>("/api/jackpot", {
        method: "POST",
        body: JSON.stringify({ action: "deposit", assetIds: selected }),
      });
      setSelected([]);
      setMessage(data.trade.message);
      await refresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setBusy(false);
    }
  }

  const remaining = Math.max(0, (round?.endsAt ?? 0) - now);
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="space-y-4">
        <div className="rounded border border-[rgba(196,92,38,0.3)] bg-[rgba(16,13,10,0.95)] p-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
            Current pot
          </p>
          <p className="mt-2 font-display text-5xl text-[#f3ebe2]">
            {formatPrice(round?.totalValue ?? 0)}
          </p>
          <p className="mt-2 font-mono text-sm text-[#f0a060]">
            {round?.status === "settled"
              ? `Settled · winner ${
                  round.winnerId === user?.id
                    ? "you"
                    : round.winnerId ?? "—"
                } · rake ${formatPrice(round.rakeValue)}`
              : `${seconds}s left · ${round?.status?.replaceAll("_", " ") ?? "…"}`}
          </p>
          {(round?.pendingTrades.length ?? 0) > 0 && (
            <p className="mt-2 text-xs text-[#fbbf24]">
              Waiting on {round?.pendingTrades.length} bot trade(s)…
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl text-[#f3ebe2]">Deposits</h2>
          {(round?.deposits.length ?? 0) === 0 ? (
            <p className="text-sm text-[#a89a8c]">
              No deposits yet — be the first in.
            </p>
          ) : (
            round?.deposits.map((d) => {
              const share =
                round.totalValue > 0
                  ? ((d.value / round.totalValue) * 100).toFixed(1)
                  : "0";
              return (
                <div
                  key={d.userId + d.value}
                  className="rounded border border-[rgba(196,92,38,0.2)] bg-black/30 px-3 py-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-[#f3ebe2]">{d.displayName}</span>
                    <span className="font-mono text-[#f0a060]">
                      {formatPrice(d.value)} · {share}%
                    </span>
                  </div>
                  <SkinIconRow items={d.items} size="sm" />
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-[#f3ebe2]">
          Deposit skins
        </h2>
        <InventoryPicker
          items={user?.steamInventory ?? []}
          selected={selected}
          onToggle={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
        />
        <Button
          disabled={busy || selected.length === 0 || round?.status === "settled"}
          onClick={() => void deposit()}
          className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
        >
          {busy ? "Sending trade…" : "Bot trade into jackpot"}
        </Button>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </section>
    </div>
  );
}
