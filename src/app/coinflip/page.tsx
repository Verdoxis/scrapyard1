"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
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
import { LoseModal, type LosePayload } from "@/components/lose-modal";
import { cn } from "@/lib/utils";
import { playCoinLandDing } from "@/lib/sfx";
import { pickAssetIdsNearValue, selectionValue } from "@/lib/pick-skins";
import {
  isCoinflipStakeAllowed,
  winChancePercent,
} from "@/lib/coinflip-odds";
import type { Skin } from "@/lib/skins";

const FLIP_DURATION_MS = COIN_FLIP_DURATION_MS;
/** Keep the settled lobby card on screen after the coin lands. */
const HOLD_AFTER_LAND_MS = 5600;
/** Show the lose modal soon after land (card still holds underneath). */
const LOSE_MODAL_AFTER_LAND_MS = 700;

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

function SideChip({ side, size = "md" }: { side: CoinSide; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <span
      title={side === "red" ? "Red" : "Black"}
      aria-label={side === "red" ? "Red" : "Black"}
      className={cn(
        "inline-block shrink-0 rounded-full",
        dim,
        side === "red" ? "bg-[#cd412b]" : "bg-[#d0d0d0]",
      )}
    />
  );
}

function PlayerChip({
  name,
  avatar,
  side,
  large,
  align = "left",
  stake,
}: {
  name: string;
  avatar: string | null | undefined;
  side: CoinSide;
  large?: boolean;
  align?: "left" | "right";
  stake?: number;
}) {
  const right = align === "right";
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        right && "flex-row-reverse text-right",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar || "/logo.svg"}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover ring-2",
          large ? "h-12 w-12 sm:h-14 sm:w-14" : "h-9 w-9",
          side === "red" ? "ring-[#cd412b]" : "ring-[#8a8a8a]",
        )}
      />
      <div className={cn("min-w-0", right && "flex flex-col items-end")}>
        <div
          className={cn(
            "flex max-w-full items-center gap-2",
            right && "flex-row-reverse",
          )}
        >
          <p
            className={cn(
              "truncate text-[#efe6da]",
              large
                ? "font-display text-lg tracking-wide sm:text-xl"
                : "text-sm font-semibold",
            )}
          >
            {name}
          </p>
          <SideChip side={side} size={large ? "md" : "sm"} />
        </div>
        {typeof stake === "number" ? (
          <p className="mt-0.5 font-mono text-sm text-[#f0a060]">
            {formatPrice(stake)}
          </p>
        ) : (
          <p
            className="mt-0.5 text-[10px] uppercase tracking-[0.16em]"
            style={{ color: side === "red" ? "#e85a45" : "#a8a8a8" }}
          >
            {side}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CoinflipPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl tracking-wide text-[#efe6da]">
        Coinflip
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[#a89888]">
        Pick a lobby, match the stake, watch the flip. {HOUSE_RAKE_PERCENT}% rake.
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
  const [holdingResult, setHoldingResult] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState<string | null>(null);
  const [win, setWin] = useState<WinPayload | null>(null);
  const [loss, setLoss] = useState<LosePayload | null>(null);

  const inventory = user?.steamInventory ?? [];
  const onCoinLand = useCallback(() => {
    playCoinLandDing();
    setHoldingResult(true);
  }, []);

  function runFlipReveal(gameId: string, game: CoinGame) {
    const land = game.resultSide === "black" ? "black" : "red";
    setSpinLand(land);
    setHoldingResult(false);
    setGames((prev) =>
      prev.map((g) =>
        g.id === gameId ? { ...g, ...game, status: "flipping" } : g,
      ),
    );

    window.setTimeout(() => {
      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId ? { ...g, ...game, status: "settled" } : g,
        ),
      );
      setHoldingResult(true);
    }, FLIP_DURATION_MS);

    // Lose modal pops quickly; win waits until the hold finishes.
    window.setTimeout(() => {
      void showResultAfterFlip(game, "lose");
    }, FLIP_DURATION_MS + LOSE_MODAL_AFTER_LAND_MS);

    window.setTimeout(() => {
      setSpinId(null);
      setSpinLand(null);
      setHoldingResult(false);
      void (async () => {
        await refresh();
        await load();
        await showResultAfterFlip(game, "win");
      })();
    }, FLIP_DURATION_MS + HOLD_AFTER_LAND_MS);
  }

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
        .slice(0, 40),
    [games, spinId],
  );

  function openJoinPicker(game: CoinGame, autoQuick = true) {
    setError(null);
    setMessage(null);
    setJoinTarget(game.id);
    setDrawerOpen(true);
    if (!autoQuick) {
      setSelected([]);
      return;
    }
    try {
      const target = creatorWager(game);
      const ids = pickAssetIdsNearValue(inventory, target);
      setSelected(ids);
      if (ids.length === 0) {
        setError(
          `No unlocked skins near ${formatPrice(target)}. Restock on Account or pick manually.`,
        );
        return;
      }
      const value = selectionValue(inventory, ids);
      if (!isCoinflipStakeAllowed(target, value)) {
        setError(
          `Adjust skins so your stake is closer to ${formatPrice(target)}.`,
        );
      }
    } catch {
      setSelected([]);
      setError("Could not auto-pick skins — choose them below.");
    }
  }

  function openCreateDrawer() {
    setJoinTarget(null);
    setSelected([]);
    setError(null);
    setMessage(null);
    setDrawerOpen(true);
  }

  const joinGame = joinTarget
    ? games.find((g) => g.id === joinTarget) ?? null
    : null;
  const joinTargetCents = joinGame ? creatorWager(joinGame) : 0;
  const joinInRange =
    Boolean(joinGame) &&
    selected.length > 0 &&
    isCoinflipStakeAllowed(joinTargetCents, selectedCents);
  const joinYourChance = winChancePercent(selectedCents, joinTargetCents);

  async function showResultAfterFlip(
    game: CoinGame,
    only?: "win" | "lose",
  ) {
    if (!game.resultSide || !user?.id) return;

    const iAmCreator = game.creatorId === user.id;
    const iAmJoiner = game.joinerId === user.id;
    if (!iAmCreator && !iAmJoiner) return;

    const won = game.winnerId === user.id;
    if (only === "win" && !won) return;
    if (only === "lose" && won) return;

    const yourStake = iAmCreator
      ? game.creatorItems.reduce((s, i) => s + i.skin.price, 0)
      : game.joinerItems.reduce((s, i) => s + i.skin.price, 0);

    if (won) {
      await refresh();
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
      return;
    }

    setLoss({
      gameId: game.id,
      resultSide: game.resultSide,
      potValue: game.totalValue,
      opponentName: iAmCreator ? game.joinerName : game.creatorName,
      yourStake,
      items: iAmCreator ? game.creatorItems : game.joinerItems,
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
    setHoldingResult(false);
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
      setSelected([]);
      setJoinTarget(null);
      setDrawerOpen(false);
      runFlipReveal(gameId, data.game);
    } catch (err) {
      setSpinId(null);
      setSpinLand(null);
      setHoldingResult(false);
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
    setHoldingResult(false);
    try {
      const data = await api<{ game: CoinGame }>("/api/coinflip", {
        method: "POST",
        body: JSON.stringify({ action: "call_bot", gameId }),
      });
      runFlipReveal(gameId, data.game);
    } catch (err) {
      setSpinId(null);
      setSpinLand(null);
      setHoldingResult(false);
      setError(err instanceof Error ? err.message : "Bot call failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      {win && <WinModal win={win} onClose={() => setWin(null)} />}
      {loss && <LoseModal loss={loss} onClose={() => setLoss(null)} />}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl tracking-wide text-[#efe6da]">
          Open flips
        </h2>
        <button
          type="button"
          onClick={openCreateDrawer}
          className="inline-flex h-12 items-center gap-2 rounded-sm bg-[#cd412b] px-6 font-display text-sm tracking-[0.14em] text-[#140c08] shadow-[0_8px_24px_rgba(205,65,43,0.35)] transition hover:bg-[#e25a3c] hover:shadow-[0_10px_28px_rgba(205,65,43,0.45)]"
        >
          Create flip
        </button>
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
            <button
              type="button"
              className="mt-5 inline-flex h-12 items-center rounded-sm bg-[#cd412b] px-6 font-display text-sm tracking-[0.14em] text-[#140c08] shadow-[0_8px_24px_rgba(205,65,43,0.35)] transition hover:bg-[#e25a3c]"
              onClick={openCreateDrawer}
            >
              Create flip
            </button>
          </div>
        ) : (
          openGames.map((g) => {
            const wager = creatorWager(g);
            const joinerWagerCents = g.joinerItems.reduce(
              (s, i) => s + i.skin.price,
              0,
            );
            const mine = g.creatorId === user?.id;
            const joining = joinTarget === g.id && drawerOpen;
            const canJoin =
              g.status === "open" && !mine && !isBotCreator(user?.id ?? "");
            const activeFlip = spinId === g.id;
            const spinning = activeFlip && spinLand != null && !holdingResult;
            const revealing = activeFlip;
            const joinerSide =
              g.joinerSide ?? (g.creatorSide === "red" ? "black" : "red");
            const creatorWon =
              (g.status === "settled" || holdingResult) &&
              activeFlip &&
              g.winnerId === g.creatorId;
            const joinerWon =
              (g.status === "settled" || holdingResult) &&
              activeFlip &&
              Boolean(g.joinerId) &&
              g.winnerId === g.joinerId;
            const pot =
              revealing || g.joinerId ? g.totalValue : wager;

            return (
              <div
                key={g.id}
                className={cn(
                  "relative overflow-hidden rounded-sm border transition-colors duration-500",
                  revealing
                    ? "border-[#f0a060] bg-[rgba(40,24,14,0.98)]"
                    : "border-[rgba(205,65,43,0.28)] bg-[rgba(14,11,9,0.96)] hover:border-[rgba(240,160,96,0.45)]",
                )}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-1"
                  style={{
                    background:
                      g.creatorSide === "red" ? "#cd412b" : "#6a6a6a",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-1"
                  style={{
                    background:
                      joinerSide === "red" ? "#cd412b" : "#6a6a6a",
                  }}
                />

                <div className="grid grid-cols-1 items-stretch gap-0 md:grid-cols-[minmax(0,1fr)_9.5rem_minmax(0,1fr)]">
                  {/* Left — creator */}
                  <div
                    className={cn(
                      "flex min-w-0 flex-col justify-center gap-3 px-5 py-5 md:pr-3",
                      creatorWon && "bg-[rgba(205,65,43,0.1)]",
                    )}
                  >
                    <PlayerChip
                      name={g.creatorName}
                      avatar={g.creatorAvatar}
                      side={g.creatorSide}
                      large
                      align="left"
                      stake={wager}
                    />
                    <SkinIconRow items={g.creatorItems} size="sm" />
                    {creatorWon && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0a060]">
                        Winner
                      </p>
                    )}
                  </div>

                  {/* Center — flip */}
                  <div className="flex flex-col items-center justify-center gap-1.5 border-y border-[rgba(255,255,255,0.05)] bg-black/25 px-3 py-5 md:border-x md:border-y-0">
                    <RustCoin
                      side={
                        (revealing ? spinLand : null) ||
                        g.resultSide ||
                        g.creatorSide
                      }
                      landSide={
                        revealing
                          ? spinLand ?? undefined
                          : g.resultSide
                      }
                      size="lg"
                      spinning={spinning}
                      onLand={revealing ? onCoinLand : undefined}
                    />
                    <p className="font-display text-2xl tracking-wide text-[#f0a060] sm:text-3xl">
                      {formatPrice(pot)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                      {spinning
                        ? "Flipping…"
                        : holdingResult && activeFlip && g.resultSide
                          ? `${g.resultSide} wins`
                          : g.status === "settled" && g.resultSide
                            ? `${g.resultSide} wins`
                            : "vs"}
                    </p>
                  </div>

                  {/* Right — joiner / join CTA */}
                  <div
                    className={cn(
                      "flex min-w-0 flex-col justify-center gap-3 px-5 py-5 md:pl-3",
                      joinerWon && "bg-[rgba(205,65,43,0.1)]",
                    )}
                  >
                    {g.joinerName ? (
                      <>
                        <PlayerChip
                          name={g.joinerName}
                          avatar={g.joinerAvatar}
                          side={joinerSide}
                          large
                          align="right"
                          stake={joinerWagerCents}
                        />
                        {g.joinerItems.length > 0 && (
                          <SkinIconRow
                            items={g.joinerItems}
                            size="sm"
                            align="right"
                          />
                        )}
                        {joinerWon && (
                          <p className="text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0a060]">
                            Winner
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="font-display text-lg tracking-wide text-[#6b6258]">
                              Open slot
                            </p>
                            <p
                              className="text-[10px] uppercase tracking-[0.16em]"
                              style={{
                                color:
                                  joinerSide === "red" ? "#e85a45" : "#a8a8a8",
                              }}
                            >
                              {joinerSide}
                            </p>
                          </div>
                          <SideChip side={joinerSide} />
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-full border border-dashed sm:h-14 sm:w-14",
                              joinerSide === "red"
                                ? "border-[#cd412b]/55 bg-[rgba(205,65,43,0.08)]"
                                : "border-[#8a8a8a]/55 bg-black/30",
                            )}
                          >
                            <span className="text-lg text-[#6b6258]">?</span>
                          </div>
                        </div>

                        {canJoin && (
                          <button
                            type="button"
                            disabled={busy || revealing}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openJoinPicker(g, true);
                            }}
                            className="relative z-10 inline-flex h-12 w-full max-w-[220px] items-center justify-center rounded-sm bg-[#cd412b] font-display text-sm tracking-[0.14em] text-[#140c08] shadow-[0_8px_24px_rgba(205,65,43,0.3)] transition hover:bg-[#e25a3c] disabled:opacity-50"
                          >
                            {joining ? "Opening…" : "Join"}
                          </button>
                        )}

                        {mine && g.status === "open" && (
                          <button
                            type="button"
                            disabled={busy || revealing}
                            onClick={() => void callBot(g.id)}
                            className="inline-flex h-11 w-full max-w-[220px] items-center justify-center rounded-sm border border-[rgba(240,160,96,0.35)] bg-black/30 text-xs font-semibold uppercase tracking-[0.16em] text-[#f0a060] transition hover:bg-[rgba(205,65,43,0.2)] disabled:opacity-50"
                          >
                            Call bot
                          </button>
                        )}

                        {mine && g.status === "awaiting_creator_trade" && (
                          <p className="text-right text-xs text-[#fbbf24]">
                            Waiting on your trade…
                          </p>
                        )}
                      </div>
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
          <div className="mb-3 flex items-end justify-between gap-3">
            <h3 className="font-display text-xl text-[#a89888]">Recent</h3>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b6258]">
              Scroll for more
            </p>
          </div>
          <div className="max-h-72 space-y-1.5 overflow-y-auto overscroll-contain rounded-sm border border-[rgba(255,255,255,0.06)] bg-black/20 p-2 pr-1">
            {history.map((g) => {
              const winnerName =
                g.winnerId === g.creatorId
                  ? g.creatorName
                  : g.winnerId === g.joinerId
                    ? g.joinerName
                    : null;
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-sm transition hover:bg-black/35"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[#efe6da]">
                      {g.creatorName}
                      <span className="text-[#6b6258]"> vs </span>
                      {g.joinerName || "—"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#8a7d70]">
                      {winnerName ? `${winnerName} won` : "Settled"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className="font-mono text-sm"
                      style={{
                        color:
                          g.resultSide === "red" ? "#e85a45" : "#c8c8c8",
                      }}
                    >
                      {g.resultSide?.toUpperCase()}
                    </p>
                    <p className="font-mono text-[11px] text-[#f0a060]">
                      {formatPrice(g.totalValue)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {drawerOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex justify-end">
            <button
              type="button"
              aria-label="Close panel"
              className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
              onClick={() => {
                setDrawerOpen(false);
                setJoinTarget(null);
              }}
            />
            <aside
              role="dialog"
              aria-modal
              className="relative z-[201] flex h-full w-full max-w-md translate-x-0 flex-col border-l border-[rgba(205,65,43,0.45)] bg-[rgba(12,9,7,0.99)] shadow-[-24px_0_60px_rgba(0,0,0,0.65)] animate-in slide-in-from-right duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[rgba(205,65,43,0.25)] px-5 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#cd412b]">
                    {joinGame ? "Join lobby" : "New lobby"}
                  </p>
                  <h3 className="font-display text-2xl text-[#efe6da]">
                    {joinGame ? `Join ${joinGame.creatorName}` : "Create flip"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setJoinTarget(null);
                  }}
                  className="text-sm text-[#a89888] hover:text-[#efe6da]"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {joinGame ? (
                  <div className="rounded-sm border border-[rgba(205,65,43,0.3)] bg-black/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <PlayerChip
                        name={joinGame.creatorName}
                        avatar={joinGame.creatorAvatar}
                        side={joinGame.creatorSide}
                      />
                      <p className="font-mono text-[#f0a060]">
                        {formatPrice(joinTargetCents)}
                      </p>
                    </div>
                    <SkinIconRow items={joinGame.creatorItems} size="sm" />
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
                      Your side
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
                )}

                <div className="sticky top-0 z-10 space-y-3 rounded-sm border border-[rgba(205,65,43,0.35)] bg-[rgba(18,14,10,0.96)] p-3 backdrop-blur">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a7d70]">
                        Your stake
                      </p>
                      <p className="font-mono text-lg text-[#f0a060]">
                        {formatPrice(selectedCents)}
                      </p>
                    </div>
                    {joinGame && selected.length > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a7d70]">
                          Win chance
                        </p>
                        <p
                          className={cn(
                            "font-display text-3xl tracking-wide",
                            joinInRange ? "text-[#efe6da]" : "text-rose-400",
                          )}
                        >
                          {joinYourChance.toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>
                  {message && (
                    <p className="text-sm text-emerald-400">{message}</p>
                  )}
                  {error && <p className="text-sm text-rose-400">{error}</p>}

                  {joinGame ? (
                    <button
                      type="button"
                      disabled={busy || !joinInRange}
                      onClick={() => void join(joinGame.id, selected)}
                      className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-[#cd412b] font-display text-sm tracking-[0.14em] text-[#140c08] shadow-[0_8px_24px_rgba(205,65,43,0.35)] transition hover:bg-[#e25a3c] disabled:opacity-45"
                    >
                      {busy
                        ? "Joining…"
                        : joinInRange
                          ? `Join · ${joinYourChance.toFixed(0)}%`
                          : selected.length === 0
                            ? "Pick skins"
                            : "Stake too far — adjust"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || selected.length === 0}
                      onClick={() => void create()}
                      className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-[#cd412b] font-display text-sm tracking-[0.14em] text-[#140c08] shadow-[0_8px_24px_rgba(205,65,43,0.35)] transition hover:bg-[#e25a3c] disabled:opacity-45"
                    >
                      {busy ? "Working…" : "Create flip"}
                    </button>
                  )}
                </div>

                {joinGame && (
                  <button
                    type="button"
                    onClick={() => openJoinPicker(joinGame, true)}
                    className="flex w-full items-center justify-between gap-3 rounded-sm border border-[rgba(240,160,96,0.55)] bg-[rgba(205,65,43,0.16)] px-4 py-3.5 text-left transition hover:border-[#f0a060] hover:bg-[rgba(205,65,43,0.24)]"
                  >
                    <span>
                      <span className="block font-display text-lg tracking-wide text-[#efe6da]">
                        Quick select
                      </span>
                      <span className="mt-0.5 block text-xs text-[#a89888]">
                        Auto-pick skins near {formatPrice(joinTargetCents)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-sm bg-[#cd412b] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#140c08]">
                      Fill
                    </span>
                  </button>
                )}

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
                  emptyText="No unlocked skins — restock on Account."
                />
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}
