"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp, type PublicUser } from "@/components/app-provider";
import { InventoryPicker } from "@/components/steam/inventory-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/skins";
import Link from "next/link";

const DEMO_URL =
  "https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=demoToken";

export default function ConnectPage() {
  const { user, bot, refresh, setUser } = useApp();
  const [tradeUrl, setTradeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (user?.steamTradeUrl) setTradeUrl(user.steamTradeUrl);
  }, [user?.steamTradeUrl]);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ user: PublicUser }>("/api/steam/connect", {
        method: "POST",
        body: JSON.stringify({
          steamTradeUrl: tradeUrl,
        }),
      });
      setUser(data.user);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
        Account setup
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Connect Steam
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#a89a8c]">
        Paste your trade URL — we auto-import your Steam profile picture from
        the partner id, then list skins with Steam market icons. The bot trades
        you for whatever you select to gamble.
      </p>

      <ol className="mt-8 space-y-4 rounded border border-[rgba(196,92,38,0.25)] bg-[rgba(20,16,12,0.9)] p-5 text-sm text-[#c4b5a5]">
        <li>
          <span className="font-display text-lg text-[#f0a060]">1.</span> Open
          Steam → Inventory →{" "}
          <strong className="text-[#f3ebe2]">Trade Offers</strong> →{" "}
          <strong className="text-[#f3ebe2]">Who can send me Trade Offers?</strong>
        </li>
        <li>
          <span className="font-display text-lg text-[#f0a060]">2.</span> Make
          sure your inventory is public and you have a trade URL with{" "}
          <code className="text-[#f0a060]">partner</code> +{" "}
          <code className="text-[#f0a060]">token</code>.
        </li>
        <li>
          <span className="font-display text-lg text-[#f0a060]">3.</span> Paste
          that URL below. When you create a coinflip or jackpot deposit, the
          bot sends a trade for those exact items.
        </li>
        <li>
          <span className="font-display text-lg text-[#f0a060]">4.</span> Accept
          the bot trade in Steam. Skins move into escrow and the game continues.
        </li>
      </ol>

      <div className="mt-6 grid gap-4 rounded border border-[rgba(196,92,38,0.25)] bg-[rgba(16,13,10,0.95)] p-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-[#a89a8c]">Steam trade URL</Label>
          <p className="text-xs text-[#8a7d70]">
            Your Steam persona name and avatar are imported automatically.
          </p>
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
        </div>
        <div className="sm:col-span-2">
          <p className="mb-3 text-xs text-[#8a7d70]">{bot?.message}</p>
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
          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        </div>
      </div>

      {user?.steamConnected && (
        <section className="mt-10 space-y-6">
          <div className="flex flex-wrap items-center gap-4 rounded-sm border border-[rgba(205,65,43,0.3)] bg-[rgba(18,14,10,0.9)] p-4">
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

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-[#f3ebe2]">
                Your Steam inventory
              </h2>
              <p className="text-sm text-[#a89a8c]">
                Market icons from Steam economy CDN. Select skins on Coinflip or
                Jackpot — the bot trades you for them.
              </p>
            </div>
            <div className="flex gap-2">
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
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
                  <p className="mb-3 text-sm text-[#a89a8c]">
                    Total{" "}
                    {formatPrice(
                      user.siteInventory.reduce(
                        (s, i) => s + i.skin.price,
                        0,
                      ),
                    )}
                  </p>
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
                    {user.trades.slice(0, 6).map((t) => (
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
    </main>
  );
}
