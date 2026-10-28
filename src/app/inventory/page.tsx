"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { useApp } from "@/components/app-provider";
import { SkinCard } from "@/components/skin-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InventoryPage() {
  const { user, inventoryValue, refresh } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sell(instanceId?: string) {
    setBusy(instanceId ?? "all");
    setError(null);
    try {
      const data = await api<{ credit: number; count?: number }>(
        "/api/inventory/sell",
        {
          method: "POST",
          body: JSON.stringify(
            instanceId ? { instanceId } : { all: true },
          ),
        },
      );
      setMessage(
        instanceId
          ? `Sold for ${formatPrice(data.credit)}`
          : `Sold ${data.count} skins for ${formatPrice(data.credit)}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sell failed");
    } finally {
      setBusy(null);
    }
  }

  const items = user?.inventory ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
            Site inventory
          </p>
          <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
            Your skins
          </h1>
          <p className="mt-2 text-sm text-[#a89a8c]">
            Value {formatPrice(inventoryValue)} · Sell for 95% or{" "}
            <Link href="/trades" className="text-[#f0a060] underline-offset-2 hover:underline">
              withdraw via Steam bot
            </Link>
          </p>
        </div>
        <Button
          disabled={items.length === 0 || busy === "all"}
          onClick={() => void sell()}
          variant="outline"
          className="border-[rgba(196,92,38,0.4)] text-[#f0a060] hover:bg-[rgba(196,92,38,0.12)]"
        >
          Sell all
        </Button>
      </div>

      {message && (
        <p className="mt-4 text-sm text-emerald-400">{message}</p>
      )}
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

      {items.length === 0 ? (
        <div className="mt-12 rounded border border-dashed border-[rgba(196,92,38,0.3)] px-6 py-16 text-center">
          <p className="font-display text-2xl text-[#f3ebe2]">Empty stash</p>
          <p className="mt-2 text-sm text-[#a89a8c]">
            Open a crate or deposit skins from Steam.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded bg-[#c45c26] px-4 py-2 text-sm font-semibold text-[#120e0b]"
            >
              Open cases
            </Link>
            <Link
              href="/trades"
              className="rounded border border-[rgba(240,160,96,0.35)] px-4 py-2 text-sm text-[#f0a060]"
            >
              Deposit
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) =>
            item.skin ? (
              <SkinCard
                key={item.instanceId}
                skin={item.skin}
                footer={
                  <Button
                    size="sm"
                    className="mt-2 w-full bg-[rgba(196,92,38,0.2)] text-[#f0a060] hover:bg-[rgba(196,92,38,0.35)]"
                    disabled={busy === item.instanceId}
                    onClick={(e) => {
                      e.stopPropagation();
                      void sell(item.instanceId);
                    }}
                  >
                    Sell 95%
                  </Button>
                }
              />
            ) : null,
          )}
        </div>
      )}
    </main>
  );
}
