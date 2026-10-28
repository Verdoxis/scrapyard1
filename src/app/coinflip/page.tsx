"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { COINFLIP_VALUE_TOLERANCE, HOUSE_RAKE_PERCENT } from "@/lib/config";
import { useApp } from "@/components/app-provider";
import { ConnectGate } from "@/components/connect-gate";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { SkinIconRow } from "@/components/skin-icons";
import {
  RustCoin,
  COIN_FLIP_DURATION_MS,
  type CoinSide,
} from "@/components/rust-coin";
import { WinModal, type WinPayload } from "@/components/win-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playCoinFlipSound, playSelectSound } from "@/lib/sfx";
import {
  pickAssetIdsForMultiplier,
  pickAssetIdsNearValue,
  selectionValue,
} from "@/lib/pick-skins";
import type { Skin } from "@/lib/skins";

const FLIP_DURATION_MS = COIN_FLIP_DURATION_MS;

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
  payoutTradeId?: string;
  creatorItems: Array<{ skin: Skin }>;
  joinerItems: Array<{ skin: Skin }>;
  winnerItems?: Array<{ skin: Skin }>;
}

function creatorWager(g: CoinGame) {
  return g.creatorItems.reduce((s, i) => s + i.skin.price, 0);
}

function isBotCreator(id: string) {
  return id.startsWith("bot-") || id.startsWith("bot-lobby") || id === "house-bot";
}

function PlayerChip({
  name,
  avatar,
  side,
  large,
}: {
  name: string;
  avatar: string | null | undefined;
  side: CoinSide;
  large?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar || "/logo.svg"}
        alt=""
        className={cn(
          "rounded-sm border border-[rgba(205,65,43,0.45)] object-cover",
          large ? "h-14 w-14" : "h-9 w-9",
        )}
      />
      <div>
        <p
          className={cn(
            "font-semibold text-[#efe6da]",
            large ? "font-display text-2xl tracking-wide" : "text-sm",
          )}
        >
          {name}
        </p>
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
        Jump into open lobbies — or open Create Flip to build your own. Winner
        gets a Steam trade link to claim the pot.
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
  const [spinLand, setSpinLand] = useState<CoinSide | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState<string | null>(null);
  const [win, setWin] = useState<WinPayload | null>(null);

  const inventory = user?.steamInventory ?? [];

  const load = useCallback(async () => {
    const data = await api<{ games: CoinGame[] }>("/api/coinflip");
    setGames(data.games);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      if (spinId) return;
      void load();
    }, 2000);
    return () => clearInterval(id);
  }, [load, spinId]);

  const selectedCents = useMemo(
    () => selectionValue(inventory, selected),
    [inventory, selected],
  );

  const openGames = useMemo(
    () =>
      games.filter(
        (g) =>
          g.status === "open" ||
          g.status === "awaiting_creator_trade" ||
          g.status === "flipping" ||
          (g.status === "settled" && spinId === g.id),
      ),
    [games, spinId],
  );

  const history = useMemo(
    () =>
      games
        .filter((g) => g.status === "settled" && spinId !== g.id)
        .slice(0, 6),
    [games, spinId],
  );

  function applyMultiplier(m: 2 | 3 | 4) {
    playSelectSound();
    const ids = pickAssetIdsForMultiplier(inventory, selected, m);
    setSelected(ids);
  }

  function quickMatch(game: CoinGame) {
    playSelectSound();
    const target = creatorWager(game);
    const ids = pickAssetIdsNearValue(inventory, target);
    setSelected(ids);
    setJoinTarget(game.id);
    if (ids.length === 0) {
      setError(
        `Need skins within ${COINFLIP_VALUE_TOLERANCE}% of ${formatPrice(target)}. Restock on Connect if you're low.`,
      );
      setDrawerOpen(true);
      return;
    }
    setError(null);
    setMessage(
      `Quick-selected ${ids.length} skin(s) · ${formatPrice(selectionValue(inventory, ids))} to match ${formatPrice(target)}`,
    );
  }

  async function showWinIfNeeded(game: CoinGame) {
    if (game.winnerId !== user?.id || !game.resultSide) return;
    const fresh = await api<{
      user: {
        id: string;
        trades: Array<{
          id: string;
          steamTradeUrl?: string;
          purpose: string;
          gameId: string;
        }>;
      };
    }>("/api/me");
    await refresh();

    const t =
      fresh.user.trades.find((x) => x.id === game.payoutTradeId) ||
      fresh.user.trades.find(
        (x) =>
          x.purpose === "coinflip_payout" && x.gameId === game.id,
      );

    setWin({
      gameId: game.id,
      resultSide: game.resultSide,
      potValue: game.totalValue,
      rakeValue: game.rakeValue,
      items: game.winnerItems ?? [...game.creatorItems, ...game.joinerItems],
      payoutTradeId: t?.id ?? game.payoutTradeId,
      tradeUrl: t?.steamTradeUrl,
    });
  }

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
      setDrawerOpen(false);
      await refresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function join(gameId: string, assetIds?: string[]) {
    const ids =
      assetIds ??
      (joinTarget === gameId
        ? selected
        : pickAssetIdsNearValue(inventory, creatorWager(games.find((g) => g.id === gameId)!)));

    if (ids.length === 0) {
      setError("Select skins that match this lobby value first.");
      setDrawerOpen(true);
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    setSpinId(gameId);
    setSpinLand(null);
    playCoinFlipSound();
    try {
      const data = await api<{ game: CoinGame; trade: { message: string } }>(
        "/api/coinflip",
        {
          method: "POST",
          body: JSON.stringify({
            action: "join",
            gameId,
            assetIds: ids,
          }),
        },
      );
      const land = data.game.resultSide === "black" ? "black" : "red";
      setSpinLand(land);
      setSelected([]);
      setJoinTarget(null);
      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId ? { ...g, ...data.game, status: "flipping" } : g,
        ),
      );
      setTimeout(() => {
        setSpinId(null);
        setSpinLand(null);
        void (async () => {
          await refresh();
          await load();
          await showWinIfNeeded(data.game);
        })();
      }, FLIP_DURATION_MS);
    } catch (err) {
      setSpinId(null);
      setSpinLand(null);
      setError(err instanceof Error ? err.message : "Join failed");
    } finally {
      setBusy(false);
    }
  }

  async function callBot(gameId: string) {
    setBusy(true);
    setError(null);
    setSpinId(gameId);
    setSpinLand(null);
    playCoinFlipSound();
    try {
      const data = await api<{ game: CoinGame }>("/api/coinflip", {
        method: "POST",
        body: JSON.stringify({ action: "call_bot", gameId }),
      });
      const land = data.game.resultSide === "black" ? "black" : "red";
      setSpinLand(land);
      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId ? { ...g, ...data.game, status: "flipping" } : g,
        ),
      );
      setTimeout(() => {
        setSpinId(null);
        setSpinLand(null);
        void (async () => {
          await refresh();
          await load();
          await showWinIfNeeded(data.game);
        })();
      }, FLIP_DURATION_MS);
    } catch (err) {
      setSpinId(null);
      setSpinLand(null);
      setError(err instanceof Error ? err.message : "Bot call failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      {win && <WinModal win={win} onClose={() => setWin(null)} />}

      {/* Top actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl tracking-wide text-[#efe6da]">
            Open flips
          </h2>
          <p className="text-sm text-[#a89888]">
            Bigger pots first — join with a matching stake.
          </p>
        </div>
        <Button
          onClick={() => setDrawerOpen(true)}
          className="h-11 bg-[#cd412b] px-5 text-[#140c08] hover:bg-[#e25a3c]"
        >
          Create your flip
        </Button>
      </div>

      {message && (
        <p className="mb-4 text-sm text-emerald-400">{message}</p>
      )}
      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

      {/* Big lobby cards */}
      <div className="space-y-4">
        {openGames.length === 0 ? (
          <div className="rounded-sm border border-dashed border-[rgba(205,65,43,0.35)] bg-[rgba(18,14,10,0.6)] px-6 py-16 text-center">
            <p className="font-display text-2xl text-[#efe6da]">
              No open flips right now
            </p>
            <p className="mt-2 text-sm text-[#a89888]">
              Create one, or wait a moment for bot lobbies to refresh.
            </p>
            <Button
              className="mt-5 bg-[#cd412b] text-[#140c08] hover:bg-[#e25a3c]"
              onClick={() => setDrawerOpen(true)}
            >
              Create your flip
            </Button>
          </div>
        ) : (
          openGames.map((g) => {
            const wager = creatorWager(g);
            const mine = g.creatorId === user?.id;
            const joining = joinTarget === g.id;
            const matchIds = pickAssetIdsNearValue(inventory, wager);
            const canJoin =
              g.status === "open" && !mine && !isBotCreator(user?.id ?? "");
            const spinning = spinId === g.id;

            return (
              <div
                key={g.id}
                className={cn(
                  "relative overflow-hidden rounded-sm border p-5 transition",
                  spinning
                    ? "border-[#f0a060] bg-[rgba(48,28,16,0.95)] shadow-[0_0_40px_rgba(205,65,43,0.25)]"
                    : "border-[rgba(205,65,43,0.35)] bg-[rgba(18,14,10,0.94)] hover:border-[rgba(240,160,96,0.55)]",
                )}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-1.5"
                  style={{
                    background:
                      g.creatorSide === "red" ? "#cd412b" : "#3a3a3a",
                  }}
                />

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <PlayerChip
                        name={g.creatorName}
                        avatar={g.creatorAvatar}
                        side={g.creatorSide}
                        large
                      />
                      {g.joinerName && g.joinerSide && (
                        <>
                          <span className="font-display text-xl text-[#6b6258]">
                            VS
                          </span>
                          <PlayerChip
                            name={g.joinerName}
                            avatar={g.joinerAvatar}
                            side={g.joinerSide}
                            large
                          />
                        </>
                      )}
                    </div>
                    <SkinIconRow items={g.creatorItems} size="sm" />
                    {g.joinerItems.length > 0 && (
                      <SkinIconRow items={g.joinerItems} size="sm" />
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 lg:min-w-[160px]">
                    <RustCoin
                      side={g.resultSide || g.creatorSide}
                      landSide={
                        spinning ? spinLand ?? undefined : g.resultSide
                      }
                      size="lg"
                      spinning={spinning && spinLand != null}
                    />
                    <p className="font-display text-4xl tracking-wide text-[#f0a060]">
                      {formatPrice(spinning ? g.totalValue : wager)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                      {g.status.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 lg:w-52">
                    {canJoin && (
                      <>
                        <Button
                          disabled={busy || spinning}
                          onClick={() => {
                            quickMatch(g);
                            void join(g.id, matchIds);
                          }}
                          className="h-12 bg-[#cd412b] text-base text-[#140c08] hover:bg-[#e25a3c]"
                        >
                          {busy && joinTarget === g.id
                            ? "Joining…"
                            : "Join flip"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy || spinning}
                          onClick={() => {
                            quickMatch(g);
                            setDrawerOpen(true);
                          }}
                          className="border-[rgba(240,160,96,0.4)] text-[#f0a060] hover:bg-[rgba(205,65,43,0.12)]"
                        >
                          Quick select {formatPrice(wager)}
                        </Button>
                        {joining && selected.length > 0 && (
                          <p className="text-center text-[11px] text-[#a89888]">
                            Matched {formatPrice(selectedCents)} · tap Join
                            again if needed
                          </p>
                        )}
                      </>
                    )}

                    {mine && g.status === "open" && (
                      <Button
                        disabled={busy || spinning}
                        onClick={() => void callBot(g.id)}
                        className="h-11 bg-[rgba(205,65,43,0.3)] text-[#f0a060] hover:bg-[rgba(205,65,43,0.45)]"
                      >
                        Call bot opponent
                      </Button>
                    )}

                    {mine && g.status === "awaiting_creator_trade" && (
                      <p className="text-center text-xs text-[#fbbf24]">
                        Waiting for your deposit trade…
                      </p>
                    )}

                    {g.status === "settled" && g.resultSide && (
                      <p className="text-center text-sm text-[#efe6da]">
                        <span
                          style={{
                            color:
                              g.resultSide === "red" ? "#e85a45" : "#c8c8c8",
                          }}
                        >
                          {g.resultSide.toUpperCase()}
                        </span>{" "}
                        wins
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {history.length > 0 && (
        <section className="mt-10">
          <h3 className="font-display text-xl text-[#a89888]">Recent</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {history.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-sm border border-[rgba(255,255,255,0.06)] bg-black/25 px-3 py-2 text-sm"
              >
                <span className="text-[#a89888]">
                  {g.creatorName} vs {g.joinerName || "—"}
                </span>
                <span
                  className="font-mono"
                  style={{
                    color: g.resultSide === "red" ? "#e85a45" : "#c8c8c8",
                  }}
                >
                  {g.resultSide?.toUpperCase()} · {formatPrice(g.totalValue)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create flip side drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close create panel"
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[rgba(205,65,43,0.4)] bg-[rgba(12,9,7,0.98)] shadow-[-20px_0_60px_rgba(0,0,0,0.55)] transition-transform duration-300",
            drawerOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-[rgba(205,65,43,0.25)] px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#cd412b]">
                New lobby
              </p>
              <h3 className="font-display text-2xl text-[#efe6da]">
                Create flip
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="text-sm text-[#a89888] hover:text-[#efe6da]"
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                Call a side
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["red", "black"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-sm border p-3",
                      side === s
                        ? "border-[#f0a060] bg-[rgba(205,65,43,0.12)]"
                        : "border-[rgba(255,255,255,0.08)] bg-black/30",
                    )}
                  >
                    <RustCoin side={s} selected={side === s} size="sm" />
                    <span className="font-display text-lg tracking-wider text-[#efe6da]">
                      {s.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sticky-ish action strip inside drawer */}
            <div className="sticky top-0 z-10 space-y-3 rounded-sm border border-[rgba(205,65,43,0.35)] bg-[rgba(18,14,10,0.96)] p-3 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[#a89888]">
                  Stake{" "}
                  <span className="font-mono text-[#f0a060]">
                    {formatPrice(selectedCents)}
                  </span>
                </p>
                <div className="flex gap-1">
                  {([2, 3, 4] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => applyMultiplier(m)}
                      className="rounded-sm border border-[rgba(240,160,96,0.35)] px-2.5 py-1 font-mono text-xs text-[#f0a060] hover:bg-[rgba(205,65,43,0.15)]"
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>
              <Button
                disabled={busy || selected.length === 0}
                onClick={() => void create()}
                className="h-11 w-full bg-[#cd412b] text-[#140c08] hover:bg-[#e25a3c]"
              >
                {busy ? "Working…" : "Send bot trade & create lobby"}
              </Button>
              {joinTarget && selected.length > 0 && (
                <Button
                  disabled={busy}
                  onClick={() => void join(joinTarget)}
                  variant="outline"
                  className="h-10 w-full border-[rgba(240,160,96,0.45)] text-[#f0a060]"
                >
                  Join selected lobby with these skins
                </Button>
              )}
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
              emptyText="No unlocked skins — restock on Connect Steam."
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
