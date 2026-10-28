"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { useApp, type PublicUser } from "@/components/app-provider";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEMO_URL =
  "https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=demoToken";

const BAN_CHOICES = [
  { id: "1d", label: "1 day" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "permanent", label: "Permanent (demo)" },
] as const;

export default function AccountPage() {
  const { user, bot, refresh, setUser, loading } = useApp();
  const [tradeUrl, setTradeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [restockMsg, setRestockMsg] = useState<string | null>(null);
  const [duration, setDuration] = useState<string>("7d");
  const [banMsg, setBanMsg] = useState<string | null>(null);
  const [banError, setBanError] = useState<string | null>(null);
  const [confirmBan, setConfirmBan] = useState(false);

  useEffect(() => {
    if (user?.steamTradeUrl) setTradeUrl(user.steamTradeUrl);
  }, [user?.steamTradeUrl]);

  const stats = user?.stats;
  const siteValue =
    user?.siteInventory.reduce((s, i) => s + (i.skin?.price ?? 0), 0) ?? 0;
  const history = user?.gameHistory ?? [];

  async function connect() {
    setBusy(true);
    setError(null);
    setRestockMsg(null);
    try {
      const data = await api<{ user: PublicUser }>("/api/steam/connect", {
        method: "POST",
        body: JSON.stringify({ steamTradeUrl: tradeUrl }),
      });
      setUser(data.user);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy(false);
    }
  }

  async function restock() {
    setBusy(true);
    setError(null);
    setRestockMsg(null);
    try {
      const data = await api<{ user: PublicUser; message: string }>(
        "/api/steam/restock",
        { method: "POST", body: "{}" },
      );
      setUser(data.user);
      setRestockMsg(data.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restock failed");
    } finally {
      setBusy(false);
    }
  }

  async function selfBan() {
    setBusy(true);
    setBanError(null);
    setBanMsg(null);
    try {
      const data = await api<{ user: PublicUser; message: string }>(
        "/api/stats",
        {
          method: "POST",
          body: JSON.stringify({ action: "self_ban", duration }),
        },
      );
      setUser(data.user);
      setBanMsg(data.message);
      setConfirmBan(false);
      await refresh();
    } catch (err) {
      setBanError(err instanceof Error ? err.message : "Self-ban failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#a89888]">
        Loading account…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#cd412b]">
        Profile
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#efe6da]">
        Account
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#a89888]">
        Connect Steam, track every win and loss, and manage self-ban from one
        place.
      </p>

      {user?.selfBanned && (
        <div className="mt-6 rounded-sm border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          Self-ban active until{" "}
          <strong>
            {user.selfBanUntil
              ? new Date(user.selfBanUntil).toLocaleString()
              : "further notice"}
          </strong>
          . Coinflip and jackpot are locked.
        </div>
      )}

      {/* Steam connect */}
      <section className="mt-8 rounded-sm border border-[rgba(205,65,43,0.28)] bg-[rgba(18,14,10,0.94)] p-5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#c45c26]">
          Steam
        </p>
        <h2 className="mt-1 font-display text-2xl text-[#efe6da]">
          {user?.steamConnected ? "Connected" : "Connect Steam"}
        </h2>

        {user?.steamConnected ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl || "/logo.svg"}
              alt=""
              className="h-16 w-16 rounded-sm border border-[rgba(205,65,43,0.45)] object-cover"
            />
            <div>
              <p className="font-display text-2xl text-[#efe6da]">
                {user.displayName}
              </p>
              <p className="font-mono text-xs text-[#a89888]">
                {user.steamId64 || "Steam linked"}
              </p>
              {user.profileUrl && (
                <a
                  href={user.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#f0a060] underline-offset-2 hover:underline"
                >
                  Open Steam profile
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#a89a8c]">
            Paste your trade URL to import your Steam name, avatar, and demo
            inventory.
          </p>
        )}

        <div className="mt-5 space-y-2">
          <Label className="text-[#a89a8c]">Steam trade URL</Label>
          <Input
            value={tradeUrl}
            onChange={(e) => setTradeUrl(e.target.value)}
            className="border-[rgba(196,92,38,0.3)] bg-black/30 font-mono text-xs text-[#f3ebe2]"
            placeholder={DEMO_URL}
          />
          <button
            type="button"
            className="text-xs text-[#f0a060] underline-offset-2 hover:underline"
            onClick={() => setTradeUrl(DEMO_URL)}
          >
            Use demo trade URL (mock bot)
          </button>
          <p className="text-xs text-[#8a7d70]">{bot?.message}</p>
          <Button
            disabled={busy || !tradeUrl}
            onClick={() => void connect()}
            className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
          >
            {busy
              ? "Connecting…"
              : user?.steamConnected
                ? "Update connection"
                : "Connect & load inventory"}
          </Button>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>
      </section>

      {/* Stats */}
      <section className="mt-8">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#cd412b]">
          Overview
        </p>
        <h2 className="mt-1 font-display text-2xl text-[#efe6da]">Stats</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Games played", value: String(stats?.gamesPlayed ?? 0) },
            { label: "Wins", value: String(stats?.gamesWon ?? 0) },
            { label: "Losses", value: String(stats?.gamesLost ?? 0) },
            {
              label: "Win rate",
              value:
                stats && stats.gamesPlayed > 0
                  ? `${((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(0)}%`
                  : "—",
            },
            {
              label: "Total wagered",
              value: formatPrice(stats?.totalWagered ?? 0),
            },
            { label: "Total won", value: formatPrice(stats?.totalWon ?? 0) },
            { label: "Total lost", value: formatPrice(stats?.totalLost ?? 0) },
            {
              label: "Biggest win",
              value: formatPrice(stats?.biggestWin ?? 0),
            },
            { label: "Site winnings", value: formatPrice(siteValue) },
            {
              label: "Coinflips",
              value: String(stats?.coinflipsPlayed ?? 0),
            },
            {
              label: "Jackpots",
              value: String(stats?.jackpotsPlayed ?? 0),
            },
            {
              label: "Member since",
              value: user?.joinedAt
                ? new Date(user.joinedAt).toLocaleDateString()
                : "—",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-sm border border-[rgba(205,65,43,0.22)] bg-[rgba(16,12,10,0.9)] px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a7d70]">
                {card.label}
              </p>
              <p className="mt-1 font-display text-2xl tracking-wide text-[#efe6da]">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Full game history */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#cd412b]">
              Ledger
            </p>
            <h2 className="mt-1 font-display text-2xl text-[#efe6da]">
              All games
            </h2>
            <p className="mt-1 text-sm text-[#a89888]">
              Every coinflip and jackpot — wins and losses.
            </p>
          </div>
          <p className="font-mono text-xs text-[#8a7d70]">
            {history.length} recorded
          </p>
        </div>

        {history.length === 0 ? (
          <div className="mt-4 rounded-sm border border-dashed border-[rgba(205,65,43,0.3)] px-4 py-10 text-center text-sm text-[#a89888]">
            No games yet. Play a coinflip or jackpot and results show up here.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-sm border border-[rgba(205,65,43,0.28)]">
            <div className="hidden grid-cols-[88px_1fr_1fr_100px_100px_100px] gap-2 border-b border-[rgba(205,65,43,0.2)] bg-black/40 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[#8a7d70] sm:grid">
              <span>Result</span>
              <span>Game</span>
              <span>Opponent</span>
              <span>Wagered</span>
              <span>Payout</span>
              <span>When</span>
            </div>
            <ul className="divide-y divide-[rgba(255,255,255,0.05)]">
              {history.map((g) => (
                <li
                  key={g.id}
                  className="grid gap-1 bg-[rgba(14,11,9,0.92)] px-3 py-3 sm:grid-cols-[88px_1fr_1fr_100px_100px_100px] sm:items-center sm:gap-2"
                >
                  <span
                    className={cn(
                      "inline-flex w-fit rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      g.won
                        ? "bg-emerald-950/60 text-emerald-300"
                        : "bg-rose-950/50 text-rose-300",
                    )}
                  >
                    {g.won ? "Win" : "Loss"}
                  </span>
                  <span className="text-sm text-[#efe6da]">
                    <span className="capitalize">{g.game}</span>
                    {g.resultSide ? (
                      <span
                        className="ml-2 font-mono text-xs uppercase"
                        style={{
                          color:
                            g.resultSide === "red" ? "#e85a45" : "#c8c8c8",
                        }}
                      >
                        {g.resultSide}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm text-[#a89888]">
                    {g.opponentName || "—"}
                  </span>
                  <span className="font-mono text-sm text-[#d8cfc3]">
                    {formatPrice(g.wagered)}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm",
                      g.won ? "text-[#f0a060]" : "text-[#8a7d70]",
                    )}
                  >
                    {formatPrice(g.payout)}
                  </span>
                  <span className="text-xs text-[#6b6258]">
                    {new Date(g.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Inventory when connected */}
      {user?.steamConnected && (
        <section className="mt-10 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[#efe6da]">
                Steam inventory
              </h2>
              <p className="text-sm text-[#a89888]">
                Restock demo skins anytime after trades.
              </p>
              {restockMsg && (
                <p className="mt-1 text-sm text-emerald-400">{restockMsg}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() => void restock()}
                variant="outline"
                className="border-[rgba(196,92,38,0.45)] text-[#f0a060] hover:bg-[rgba(196,92,38,0.12)]"
              >
                {busy ? "Working…" : "Restock demo skins"}
              </Button>
              <Link
                href="/coinflip"
                className="rounded bg-[#c45c26] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#120e0b]"
              >
                Coinflip
              </Link>
              <Link
                href="/jackpot"
                className="rounded border border-[rgba(240,160,96,0.35)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#f0a060]"
              >
                Jackpot
              </Link>
            </div>
          </div>
          <InventoryPicker
            items={user.steamInventory}
            selected={selected}
            onToggle={(id) =>
              setSelected((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              )
            }
          />

          {(user.siteInventory.length > 0 || user.trades.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {user.siteInventory.length > 0 && (
                <div>
                  <h3 className="mb-2 font-display text-xl text-[#f3ebe2]">
                    Site winnings
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {user.siteInventory.map((item) => (
                      <div
                        key={item.instanceId}
                        className="rounded border border-[rgba(196,92,38,0.2)] bg-black/30 px-3 py-2 text-xs"
                      >
                        <p className="text-[#f3ebe2]">
                          {item.skin.weapon} · {item.skin.name}
                        </p>
                        <p className="font-mono text-[#f0a060]">
                          {formatPrice(item.skin.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {user.trades.length > 0 && (
                <div>
                  <h3 className="mb-2 font-display text-xl text-[#f3ebe2]">
                    Recent bot trades
                  </h3>
                  <div className="space-y-2">
                    {user.trades.slice(0, 8).map((t) => (
                      <div
                        key={t.id}
                        className="rounded border border-[rgba(196,92,38,0.2)] bg-black/30 px-3 py-2 text-xs"
                      >
                        <p className="capitalize text-[#f3ebe2]">
                          {t.purpose.replaceAll("_", " ")} · {t.status}
                        </p>
                        <p className="text-[#a89a8c]">{t.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Self-ban */}
      <section className="mt-10 rounded-sm border border-[rgba(205,65,43,0.3)] bg-[rgba(18,14,10,0.95)] p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#cd412b]">
          Responsible play
        </p>
        <h2 className="mt-1 font-display text-2xl text-[#efe6da]">Self-ban</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#a89888]">
          Lock yourself out of coinflip and jackpot for a period. This cannot be
          shortened once set.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BAN_CHOICES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDuration(opt.id)}
              className="rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
              style={{
                borderColor:
                  duration === opt.id ? "#f0a060" : "rgba(255,255,255,0.1)",
                background:
                  duration === opt.id
                    ? "rgba(205,65,43,0.2)"
                    : "rgba(0,0,0,0.25)",
                color: duration === opt.id ? "#f0a060" : "#a89888",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {!confirmBan ? (
          <Button
            className="mt-4 border border-rose-500/50 bg-rose-950/50 text-rose-100 hover:bg-rose-900/60"
            variant="outline"
            disabled={busy || Boolean(user?.selfBanned)}
            onClick={() => setConfirmBan(true)}
          >
            {user?.selfBanned ? "Already self-banned" : "Start self-ban…"}
          </Button>
        ) : (
          <div className="mt-4 space-y-3 rounded-sm border border-rose-500/40 bg-rose-950/30 p-4">
            <p className="text-sm text-rose-100">
              Confirm self-ban for{" "}
              <strong>
                {BAN_CHOICES.find((b) => b.id === duration)?.label}
              </strong>
              ?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-rose-600 text-white hover:bg-rose-500"
                disabled={busy}
                onClick={() => void selfBan()}
              >
                {busy ? "Applying…" : "Confirm self-ban"}
              </Button>
              <Button
                variant="outline"
                className="border-[rgba(240,160,96,0.35)] text-[#f0a060]"
                onClick={() => setConfirmBan(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        {banMsg && <p className="mt-3 text-sm text-emerald-400">{banMsg}</p>}
        {banError && <p className="mt-3 text-sm text-rose-400">{banError}</p>}
        <p className="mt-4 text-xs text-[#6b6258]">
          Support:{" "}
          <a
            href="https://www.begambleaware.org/"
            target="_blank"
            rel="noreferrer"
            className="text-[#f0a060] underline-offset-2 hover:underline"
          >
            BeGambleAware.org
          </a>
        </p>
      </section>
    </main>
  );
}
