"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
import { useApp } from "@/components/app-provider";
import { ConnectGate } from "@/components/connect-gate";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { SkinIconRow } from "@/components/skin-icons";
import { JackpotSpinner } from "@/components/jackpot-spinner";
import { Button } from "@/components/ui/button";
import { selectionValue } from "@/lib/pick-skins";
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
    <main className="mx-auto max-w-6xl px-4 py-8 pb-28">
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Jackpot
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[#a89a8c]">
        Drop skins in. Bigger cut, better odds. {HOUSE_RAKE_PERCENT}% rake.
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

  const inventory = user?.steamInventory ?? [];
  const selectedCents = useMemo(
    () => selectionValue(inventory, selected),
    [inventory, selected],
  );

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
  const canDeposit =
    !busy &&
    selected.length > 0 &&
    round?.status !== "settled" &&
    round?.status !== "spinning";

  const statusLine =
    round?.status === "spinning"
      ? "Spinning…"
      : round?.status === "settled"
        ? `Winner · ${
            round.winnerId === user?.id
              ? "you"
              : round.deposits.find((d) => d.userId === round.winnerId)
                  ?.displayName ?? "—"
          }`
        : `${seconds}s left`;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
              Current pot
            </p>
            <p className="font-display text-5xl text-[#f3ebe2]">
              {formatPrice(round?.totalValue ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-[#f0a060]">{statusLine}</p>
            {(round?.pendingTrades.length ?? 0) > 0 && (
              <p className="text-xs text-[#fbbf24]">
                Waiting on {round?.pendingTrades.length} trade(s)…
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={busy || !canSpin}
              onClick={() => void forceSpin()}
              className="mt-2 border-[rgba(196,92,38,0.45)] text-[#f0a060] hover:bg-[rgba(196,92,38,0.12)]"
            >
              Spin now
            </Button>
          </div>
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

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-2">
          <h2 className="font-display text-xl text-[#f3ebe2]">In the pot</h2>
          {(round?.deposits.length ?? 0) === 0 ? (
            <p className="text-sm text-[#a89a8c]">No deposits yet.</p>
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
                  className="rounded-sm border border-[rgba(196,92,38,0.2)] bg-black/25 px-3 py-2"
                  style={
                    won
                      ? { borderColor: "rgba(240,160,96,0.65)" }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.avatarUrl || "/logo.svg"}
                        alt=""
                        className="h-7 w-7 rounded-sm object-cover"
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

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-[#f3ebe2]">
            Deposit skins
          </h2>

          <div className="sticky top-[5.25rem] z-20 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[rgba(196,92,38,0.55)] bg-[rgba(14,11,9,0.97)] p-3 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                Your deposit
              </p>
              <p className="font-mono text-lg text-[#f0a060]">
                {formatPrice(selectedCents)}
                <span className="ml-2 text-sm text-[#a89a8c]">
                  · {selected.length} skin{selected.length === 1 ? "" : "s"}
                </span>
              </p>
            </div>
            <Button
              disabled={!canDeposit}
              onClick={() => void deposit()}
              className="h-12 min-w-[200px] bg-[#c45c26] text-base font-semibold text-[#120e0b] hover:bg-[#e07030] disabled:opacity-40"
            >
              {busy
                ? "Sending…"
                : selected.length === 0
                  ? "Pick skins below"
                  : "Deposit into jackpot"}
            </Button>
          </div>

          <InventoryPicker
            items={inventory}
            selected={selected}
            onToggle={(id) =>
              setSelected((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              )
            }
          />
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </section>
      </div>

      {/* Mobile / always-available bottom deposit bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(196,92,38,0.35)] bg-[rgba(10,8,6,0.94)] px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p className="flex-1 font-mono text-sm text-[#f0a060]">
            {formatPrice(selectedCents)}
          </p>
          <Button
            disabled={!canDeposit}
            onClick={() => void deposit()}
            className="h-11 flex-1 bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
          >
            {busy ? "Sending…" : "Deposit into jackpot"}
          </Button>
        </div>
      </div>
    </div>
  );
}
