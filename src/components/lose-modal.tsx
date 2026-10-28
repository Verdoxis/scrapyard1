"use client";

import { formatPrice, type Skin } from "@/lib/skins";
import { SkinIconRow } from "@/components/skin-icons";
import { RustCoin, type CoinSide } from "@/components/rust-coin";
import { Button } from "@/components/ui/button";

export interface LosePayload {
  gameId: string;
  resultSide: CoinSide;
  potValue: number;
  opponentName?: string;
  yourStake: number;
  items?: Array<{ skin: Skin }>;
}

export function LoseModal({
  loss,
  onClose,
}: {
  loss: LosePayload;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-[101] my-auto w-full max-w-md overflow-hidden rounded-sm border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(24,20,18,0.98),rgba(10,8,6,0.99))] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-7 sm:py-8"
      >
        <p className="text-center text-[10px] uppercase tracking-[0.28em] text-[#8a7d70]">
          Close one
        </p>
        <div className="mt-4 flex justify-center">
          <RustCoin
            side={loss.resultSide}
            landSide={loss.resultSide}
            size="md"
          />
        </div>
        <h2 className="mt-4 text-center font-display text-3xl tracking-wide text-[#efe6da] sm:text-4xl">
          You lost this flip
        </h2>
        <p className="mt-2 text-center text-sm text-[#a89888]">
          {loss.resultSide === "red" ? "Red" : "Black"} landed
          {loss.opponentName ? ` · ${loss.opponentName} takes the pot` : ""}.
        </p>
        <p className="mt-4 text-center font-mono text-lg text-[#6b6258]">
          Pot was {formatPrice(loss.potValue)}
          {loss.yourStake > 0 ? ` · you put in ${formatPrice(loss.yourStake)}` : ""}
        </p>
        {loss.items && loss.items.length > 0 && (
          <div className="mt-4 flex justify-center opacity-70">
            <SkinIconRow items={loss.items} size="sm" />
          </div>
        )}
        <Button
          onClick={onClose}
          className="mt-6 h-11 w-full bg-[rgba(205,65,43,0.35)] text-[#f0a060] hover:bg-[rgba(205,65,43,0.5)]"
        >
          Back to lobbies
        </Button>
      </div>
    </div>
  );
}
