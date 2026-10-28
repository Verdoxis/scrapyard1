"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { useApp, type PublicUser } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BAN_CHOICES = [
  { id: "1d", label: "1 day" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "permanent", label: "Permanent (demo)" },
] as const;

export default function StatsPage() {
  const { user, refresh, setUser, loading } = useApp();
  const [duration, setDuration] = useState<string>("7d");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const stats = user?.stats;
  const siteValue =
    user?.siteInventory.reduce((s, i) => s + (i.skin?.price ?? 0), 0) ?? 0;

  async function selfBan() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api<{ user: PublicUser; message: string }>(
        "/api/stats",
        {
          method: "POST",
          body: JSON.stringify({ action: "self_ban", duration }),
        },
      );
      setUser(data.user);
      setMessage(data.message);
      setConfirm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Self-ban failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#a89888]">
        Loading stats…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#cd412b]">
        Account
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#efe6da]">
        Your stats
      </h1>
      <p className="mt-2 text-sm text-[#a89888]">
        Track your play history and lock yourself out if you need a break.
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

      <section className="mt-8 flex flex-wrap items-center gap-4 rounded-sm border border-[rgba(205,65,43,0.28)] bg-[rgba(18,14,10,0.92)] p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user?.avatarUrl || "/logo.svg"}
          alt=""
          className="h-16 w-16 rounded-sm border border-[rgba(205,65,43,0.4)] object-cover"
        />
        <div>
          <p className="font-display text-2xl text-[#efe6da]">
            {user?.displayName || "Not connected"}
          </p>
          <p className="font-mono text-xs text-[#8a7d70]">
            {user?.steamId64 || "Connect Steam to sync your profile"}
          </p>
          {!user?.steamConnected && (
            <Link
              href="/connect"
              className="text-xs text-[#f0a060] underline-offset-2 hover:underline"
            >
              Connect Steam
            </Link>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      <section className="mt-10 rounded-sm border border-[rgba(205,65,43,0.3)] bg-[rgba(18,14,10,0.95)] p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#cd412b]">
          Responsible play
        </p>
        <h2 className="mt-1 font-display text-2xl text-[#efe6da]">Self-ban</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#a89888]">
          Lock yourself out of coinflip and jackpot for a period. This cannot be
          shortened once set. If gambling feels out of control, take a break and
          seek help.
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

        {!confirm ? (
          <Button
            className="mt-4 border border-rose-500/50 bg-rose-950/50 text-rose-100 hover:bg-rose-900/60"
            variant="outline"
            disabled={busy || Boolean(user?.selfBanned)}
            onClick={() => setConfirm(true)}
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
              ? You will not be able to gamble until it expires.
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
                onClick={() => setConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

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
