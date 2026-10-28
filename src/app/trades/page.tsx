"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice, type Skin } from "@/lib/skins";
import { useApp } from "@/components/app-provider";
import { SkinCard } from "@/components/skin-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SteamItem = Skin & { assetId: string };

export default function TradesPage() {
  const { user, bot, refresh, setUser } = useApp();
  const [tradeUrl, setTradeUrl] = useState("");
  const [steamItems, setSteamItems] = useState<SteamItem[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<string[]>([]);
  const [selectedWithdraw, setSelectedWithdraw] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.steamTradeUrl) setTradeUrl(user.steamTradeUrl);
  }, [user?.steamTradeUrl]);

  useEffect(() => {
    void api<{ items: SteamItem[] }>("/api/steam/inventory").then((d) =>
      setSteamItems(d.items),
    );
  }, []);

  function toggleDeposit(skinId: string) {
    setSelectedDeposit((prev) =>
      prev.includes(skinId)
        ? prev.filter((id) => id !== skinId)
        : [...prev, skinId],
    );
  }

  function toggleWithdraw(instanceId: string) {
    setSelectedWithdraw((prev) =>
      prev.includes(instanceId)
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId],
    );
  }

  async function submit(type: "deposit" | "withdraw") {
    setBusy(true);
    setError(null);
    try {
      const data = await api<{
        user: NonNullable<typeof user>;
      }>("/api/steam/trade", {
        method: "POST",
        body: JSON.stringify({
          type,
          steamTradeUrl: tradeUrl,
          skinIds: type === "deposit" ? selectedDeposit : undefined,
          instanceIds: type === "withdraw" ? selectedWithdraw : undefined,
        }),
      });
      setUser(data.user);
      setSelectedDeposit([]);
      setSelectedWithdraw([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trade failed");
    } finally {
      setBusy(false);
    }
  }

  const demoUrl =
    "https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=demoToken";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
        Steam trading bot
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Deposit & withdraw
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#a89a8c]">
        {bot?.message ?? "Loading bot status…"} Paste your Steam trade URL, pick
        skins, and the bot creates an offer.
      </p>

      <div className="mt-6 rounded border border-[rgba(196,92,38,0.25)] bg-[rgba(20,16,12,0.85)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
              Bot status
            </p>
            <p className="font-display text-lg text-[#f3ebe2]">
              {bot?.botName ?? "…"}
            </p>
          </div>
          <span
            className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{
              background:
                bot?.mode === "mock"
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(34,197,94,0.15)",
              color: bot?.mode === "mock" ? "#fbbf24" : "#4ade80",
            }}
          >
            {bot?.mode ?? "…"} mode
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="tradeUrl" className="text-[#a89a8c]">
            Steam trade URL
          </Label>
          <Input
            id="tradeUrl"
            value={tradeUrl}
            onChange={(e) => setTradeUrl(e.target.value)}
            placeholder={demoUrl}
            className="border-[rgba(196,92,38,0.3)] bg-black/30 font-mono text-xs text-[#f3ebe2]"
          />
          <button
            type="button"
            className="text-xs text-[#f0a060] underline-offset-2 hover:underline"
            onClick={() => setTradeUrl(demoUrl)}
          >
            Use demo trade URL (mock mode)
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

      <Tabs defaultValue="deposit" className="mt-8">
        <TabsList className="bg-[rgba(28,22,18,0.9)]">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="mt-4 space-y-4">
          <p className="text-sm text-[#a89a8c]">
            Select skins from your Steam inventory. In mock mode these are
            simulated items — the bot auto-accepts in a few seconds.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {steamItems.map((item) => (
              <SkinCard
                key={item.assetId}
                skin={item}
                selected={selectedDeposit.includes(item.id)}
                onClick={() => toggleDeposit(item.id)}
                compact
              />
            ))}
          </div>
          <Button
            disabled={busy || selectedDeposit.length === 0}
            onClick={() => void submit("deposit")}
            className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
          >
            {busy
              ? "Sending…"
              : `Deposit ${selectedDeposit.length} skin(s)`}
          </Button>
        </TabsContent>

        <TabsContent value="withdraw" className="mt-4 space-y-4">
          <p className="text-sm text-[#a89a8c]">
            Send site inventory skins back to your Steam account via the bot.
          </p>
          {(user?.inventory.length ?? 0) === 0 ? (
            <p className="rounded border border-dashed border-[rgba(196,92,38,0.3)] px-4 py-10 text-center text-sm text-[#a89a8c]">
              Nothing to withdraw — open cases or deposit first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {user?.inventory.map((item) =>
                item.skin ? (
                  <SkinCard
                    key={item.instanceId}
                    skin={item.skin}
                    selected={selectedWithdraw.includes(item.instanceId)}
                    onClick={() => toggleWithdraw(item.instanceId)}
                    compact
                  />
                ) : null,
              )}
            </div>
          )}
          <Button
            disabled={busy || selectedWithdraw.length === 0}
            onClick={() => void submit("withdraw")}
            className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
          >
            {busy
              ? "Sending…"
              : `Withdraw ${selectedWithdraw.length} skin(s)`}
          </Button>
        </TabsContent>

        <TabsContent value="offers" className="mt-4 space-y-3">
          {(user?.trades.length ?? 0) === 0 ? (
            <p className="text-sm text-[#a89a8c]">No trade offers yet.</p>
          ) : (
            user?.trades.map((trade) => (
              <div
                key={trade.id}
                className="rounded border border-[rgba(196,92,38,0.2)] bg-[rgba(20,16,12,0.8)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg capitalize text-[#f3ebe2]">
                    {trade.type} · {trade.status}
                  </p>
                  <p className="font-mono text-sm text-[#f0a060]">
                    {formatPrice(trade.totalValue)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-[#a89a8c]">{trade.message}</p>
                <p className="mt-2 font-mono text-[10px] text-[#6b6258]">
                  {trade.id} · {trade.skinIds.join(", ")}
                </p>
              </div>
            ))
          )}
          <Button
            variant="outline"
            className="border-[rgba(196,92,38,0.35)] text-[#f0a060]"
            onClick={() => void refresh()}
          >
            Refresh offers
          </Button>
        </TabsContent>
      </Tabs>
    </main>
  );
}
