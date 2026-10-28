"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
import { useApp } from "@/components/app-provider";
import { ConnectGate } from "@/components/connect-gate";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { SkinIconRow } from "@/components/skin-icons";
import { JackpotSpinner } from "@/components/jackpot-spinner";
import { Button } from "@/components/ui/button";
import type { Skin } from "@/lib/skins";

interface JackpotRound {
  id: string;
  status: string;
  totalValue: number;
  rakeValue: number;
  endsAt: number;
  winnerId?: string;
  winningTicket?: number;
  spinStartedAt?: number;
  spinEndsAt?: number;
  deposits: Array<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
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
        Skins go into a shared pot. The chance line sizes each player by what
        they put in — then it rolls through and lands on one winner.
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
    }, 800);
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

  async function forceSpin() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api("/api/jackpot", {
        method: "POST",
        body: JSON.stringify({ action: "force_spin" }),
      });
      setMessage("Chance line is rolling…");
      await refresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spin failed");
    } finally {
      setBusy(false);
    }
  }

  const remaining = Math.max(0, (round?.endsAt ?? 0) - now);
  const seconds = Math.ceil(remaining / 1000);
  const canSpin =
    (round?.deposits.length ?? 0) >= 2 &&
    round?.status !== "spinning" &&
    round?.status !== "settled";

  const statusLine =
    round?.status === "spinning"
      ? "Spinning the chance line…"
      : round?.status === "settled"
        ? `Settled · ${
            round.winnerId === user?.id
              ? "you won"
              : round.deposits.find((d) => d.userId === round.winnerId)
                  ?.displayName ?? "winner"
          } · rake ${formatPrice(round.rakeValue)}`
        : `${seconds}s left · ${round?.status?.replaceAll("_", " ") ?? "…"}`;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="rounded border border-[rgba(196,92,38,0.3)] bg-[rgba(16,13,10,0.95)] p-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
            Current pot
          </p>
          <p className="mt-2 font-display text-5xl text-[#f3ebe2]">
            {formatPrice(round?.totalValue ?? 0)}
          </p>
          <p className="mt-2 font-mono text-sm text-[#f0a060]">{statusLine}</p>
          {(round?.pendingTrades.length ?? 0) > 0 && (
            <p className="mt-2 text-xs text-[#fbbf24]">
              Waiting on {round?.pendingTrades.length} bot trade(s)…
            </p>
          )}
        </div>

        <JackpotSpinner
          deposits={round?.deposits ?? []}
          totalValue={round?.totalValue ?? 0}
          status={round?.status ?? "open"}
          winningTicket={round?.winningTicket}
          winnerId={round?.winnerId}
          spinEndsAt={round?.spinEndsAt}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-2">
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
              const won = round.winnerId === d.userId;
              return (
                <div
                  key={d.userId + d.value}
                  className="rounded border border-[rgba(196,92,38,0.2)] bg-black/30 px-3 py-2"
                  style={
                    won
                      ? {
                          borderColor: "rgba(240,160,96,0.65)",
                          boxShadow: "0 0 20px rgba(196,92,38,0.25)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.avatarUrl || "/logo.svg"}
                        alt=""
                        className="h-7 w-7 rounded-sm border border-[rgba(196,92,38,0.4)] object-cover"
                      />
                      <span className="text-[#f3ebe2]">
                        {d.displayName}
                        {won ? " · winner" : ""}
                      </span>
                    </div>
                    <span className="font-mono text-[#f0a060]">
                      {formatPrice(d.value)} · {share}%
                    </span>
                  </div>
                  <SkinIconRow items={d.items} size="sm" />
                </div>
              );
            })
          )}
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
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              )
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                busy ||
                selected.length === 0 ||
                round?.status === "settled" ||
                round?.status === "spinning"
              }
              onClick={() => void deposit()}
              className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
            >
              {busy ? "Sending trade…" : "Bot trade into jackpot"}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !canSpin}
              onClick={() => void forceSpin()}
              className="border-[rgba(196,92,38,0.45)] text-[#f0a060] hover:bg-[rgba(196,92,38,0.12)]"
            >
              Spin now
            </Button>
          </div>
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </section>
      </div>
    </div>
  );
}
