"use client";

import { useState } from "react";
import { formatPrice, type Skin } from "@/lib/skins";
import { SkinIconRow } from "@/components/skin-icons";
import { RustCoin, type CoinSide } from "@/components/rust-coin";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useApp, type PublicUser } from "@/components/app-provider";

export interface WinPayload {
  gameId: string;
  resultSide: CoinSide;
  potValue: number;
  rakeValue: number;
  items: Array<{ skin: Skin }>;
  payoutTradeId?: string;
  tradeUrl?: string;
}

export function WinModal({
  win,
  onClose,
}: {
  win: WinPayload;
  onClose: () => void;
}) {
  const { setUser, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptTrade() {
    if (!win.payoutTradeId) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (win.tradeUrl) {
        window.open(win.tradeUrl, "_blank", "noopener,noreferrer");
      }
      const data = await api<{ user: PublicUser; message: string }>(
        "/api/steam/trade",
        {
          method: "POST",
          body: JSON.stringify({
            action: "accept_payout",
            tradeId: win.payoutTradeId,
          }),
        },
      );
      setUser(data.user);
      setAccepted(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-[101] my-auto flex max-h-[min(92vh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-[rgba(240,160,96,0.55)] bg-[linear-gradient(180deg,rgba(42,24,14,0.98),rgba(10,8,6,0.99))] shadow-[0_0_80px_rgba(205,65,43,0.35)]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-center text-[10px] uppercase tracking-[0.32em] text-[#f0a060]">
            You won the flip
          </p>
          <div className="mt-3 flex justify-center sm:mt-4">
            <RustCoin
              side={win.resultSide}
              landSide={win.resultSide}
              size="md"
            />
          </div>
          <h2
            className="mt-3 text-center font-display text-4xl tracking-wide sm:mt-4 sm:text-5xl"
            style={{
              color: win.resultSide === "red" ? "#e85a45" : "#d0d0d0",
            }}
          >
            {win.resultSide.toUpperCase()}
          </h2>
          <p className="mt-2 text-center font-mono text-xl text-[#f0a060] sm:text-2xl">
            {formatPrice(win.potValue - win.rakeValue)}
          </p>
          <p className="text-center text-xs text-[#8a7d70]">
            {win.rakeValue > 0
              ? `after ${formatPrice(win.rakeValue)} house cut (small item)`
              : "full pot — no small item for a house cut"}
          </p>

          <div className="mt-4 flex justify-center sm:mt-5">
            <SkinIconRow items={win.items} size="sm" />
          </div>

          {accepted ? (
            <div className="mt-5 space-y-3 text-center sm:mt-6">
              <p className="text-sm text-emerald-400">
                Trade accepted — skins are in your Steam inventory.
              </p>
              <Button
                onClick={onClose}
                className="w-full bg-[#cd412b] text-[#140c08] hover:bg-[#e25a3c]"
              >
                Back to lobby
              </Button>
            </div>
          ) : (
            <div className="mt-5 space-y-3 sm:mt-6">
              <p className="text-center text-sm text-[#c4b5a5]">
                The bot sent your winnings. Open the trade offer and accept to
                claim the skins on Steam.
              </p>
              {win.tradeUrl && (
                <a
                  href={win.tradeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all rounded-sm border border-[rgba(240,160,96,0.35)] bg-black/40 px-3 py-2 text-center font-mono text-[11px] text-[#f0a060] underline-offset-2 hover:underline"
                >
                  {win.tradeUrl}
                </a>
              )}
              <Button
                disabled={busy || !win.payoutTradeId}
                onClick={() => void acceptTrade()}
                className="h-12 w-full bg-[#cd412b] text-base font-semibold text-[#140c08] hover:bg-[#e25a3c]"
              >
                {busy ? "Opening…" : "Accept trade & claim skins"}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs text-[#8a7d70] hover:text-[#a89888]"
              >
                Claim later from Connect
              </button>
              {error && (
                <p className="text-center text-sm text-rose-400">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
