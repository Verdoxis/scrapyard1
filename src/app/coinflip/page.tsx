"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CoinflipPage() {
  const { user, refresh, setUser } = useApp();
  const [bet, setBet] = useState("1.00");
  const [side, setSide] = useState<"ct" | "t">("ct");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"ct" | "t" | null>(null);
  const [won, setWon] = useState(false);
  const [payout, setPayout] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [spins, setSpins] = useState(0);

  async function flip() {
    if (flipping) return;
    setError(null);
    setResult(null);
    setFlipping(true);
    try {
      const cents = Math.round(parseFloat(bet) * 100);
      const data = await api<{
        result: "ct" | "t";
        won: boolean;
        payout: number;
        balance: number;
      }>("/api/games/coinflip", {
        method: "POST",
        body: JSON.stringify({ betAmount: cents, side }),
      });
      setSpins((s) => s + 6 + (data.result === "ct" ? 0 : 1));
      setTimeout(() => {
        setResult(data.result);
        setWon(data.won);
        setPayout(data.payout);
        setUser({ ...(user!), balance: data.balance });
        setFlipping(false);
        void refresh();
      }, 1800);
    } catch (err) {
      setFlipping(false);
      setError(err instanceof Error ? err.message : "Flip failed");
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
        50 / 50
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Coinflip
      </h1>
      <p className="mt-2 text-sm text-[#a89a8c]">
        Call CT or T against the house bot. Double or nothing.
      </p>

      <div className="mt-10 flex flex-col items-center gap-8">
        <motion.div
          className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-[rgba(196,92,38,0.45)] font-display text-4xl tracking-wider text-[#f3ebe2]"
          style={{
            background:
              result === "t" || (flipping && side === "t")
                ? "linear-gradient(145deg,#8b3a1a,#3a1a10)"
                : "linear-gradient(145deg,#3a5a7a,#152030)",
          }}
          animate={{ rotateY: spins * 180 }}
          transition={{ duration: flipping ? 1.6 : 0, ease: "easeInOut" }}
        >
          {result ? result.toUpperCase() : side.toUpperCase()}
        </motion.div>

        <div className="grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("ct")}
            className="rounded border px-4 py-4 font-display text-xl tracking-wide"
            style={{
              borderColor: side === "ct" ? "#60a5fa" : "rgba(255,255,255,0.1)",
              background: "linear-gradient(145deg,#243a52,#152030)",
              color: "#dbeafe",
            }}
          >
            CT
          </button>
          <button
            type="button"
            onClick={() => setSide("t")}
            className="rounded border px-4 py-4 font-display text-xl tracking-wide"
            style={{
              borderColor: side === "t" ? "#f0a060" : "rgba(255,255,255,0.1)",
              background: "linear-gradient(145deg,#6b3a22,#2a160e)",
              color: "#fde7d4",
            }}
          >
            T
          </button>
        </div>

        <div className="flex w-full max-w-sm items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7d70]">
              $
            </span>
            <Input
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              className="border-[rgba(196,92,38,0.3)] bg-[rgba(20,16,12,0.9)] pl-7 text-[#f3ebe2]"
            />
          </div>
          <Button
            disabled={flipping}
            onClick={() => void flip()}
            className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
          >
            {flipping ? "Flipping…" : "Flip"}
          </Button>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {result && !flipping && (
          <p className="font-display text-xl text-[#f3ebe2]">
            {result.toUpperCase()} —{" "}
            {won ? `won ${formatPrice(payout)}` : "lost the flip"}
          </p>
        )}
      </div>
    </main>
  );
}
