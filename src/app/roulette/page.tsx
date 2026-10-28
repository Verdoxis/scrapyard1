"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/skins";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type RouletteColor = "red" | "black" | "green";

const COLORS: { id: RouletteColor; label: string; mult: string; bg: string }[] =
  [
    { id: "red", label: "Red", mult: "2×", bg: "#9f2d2d" },
    { id: "black", label: "Black", mult: "2×", bg: "#1f1a16" },
    { id: "green", label: "Green", mult: "14×", bg: "#1f6b3a" },
  ];

export default function RoulettePage() {
  const { user, refresh, setUser } = useApp();
  const [bet, setBet] = useState("1.00");
  const [color, setColor] = useState<RouletteColor>("red");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{
    resultColor: RouletteColor;
    won: boolean;
    payout: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  async function spin() {
    if (spinning) return;
    setError(null);
    setResult(null);
    setSpinning(true);
    try {
      const cents = Math.round(parseFloat(bet) * 100);
      const data = await api<{
        resultColor: RouletteColor;
        won: boolean;
        payout: number;
        balance: number;
        slot: number;
      }>("/api/games/roulette", {
        method: "POST",
        body: JSON.stringify({ betAmount: cents, color }),
      });
      const base = 360 * 5;
      const slotAngle = (360 / 15) * data.slot;
      setRotation((r) => r + base + (360 - slotAngle));
      setTimeout(() => {
        setResult({
          resultColor: data.resultColor,
          won: data.won,
          payout: data.payout,
        });
        setUser({ ...(user!), balance: data.balance });
        setSpinning(false);
        void refresh();
      }, 3200);
    } catch (err) {
      setSpinning(false);
      setError(err instanceof Error ? err.message : "Spin failed");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
        Provably fair
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Roulette
      </h1>
      <p className="mt-2 text-sm text-[#a89a8c]">
        7 red · 7 black · 1 green. Pick a color and spin the wheel.
      </p>

      <div className="mt-8 flex flex-col items-center gap-8">
        <div className="relative h-56 w-56">
          <div className="absolute left-1/2 top-0 z-10 h-4 w-0.5 -translate-x-1/2 bg-[#f0a060] shadow-[0_0_12px_#f0a060]" />
          <motion.div
            className="h-full w-full rounded-full border-4 border-[rgba(196,92,38,0.4)]"
            style={{
              background:
                "conic-gradient(#1f6b3a 0deg 24deg, #9f2d2d 24deg 48deg, #1f1a16 48deg 72deg, #9f2d2d 72deg 96deg, #1f1a16 96deg 120deg, #9f2d2d 120deg 144deg, #1f1a16 144deg 168deg, #9f2d2d 168deg 192deg, #1f1a16 192deg 216deg, #9f2d2d 216deg 240deg, #1f1a16 240deg 264deg, #9f2d2d 264deg 288deg, #1f1a16 288deg 312deg, #9f2d2d 312deg 336deg, #1f1a16 336deg 360deg)",
            }}
            animate={{ rotate: rotation }}
            transition={{ duration: spinning ? 3 : 0, ease: [0.12, 0.8, 0.1, 1] }}
          />
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.id)}
              className="rounded border px-3 py-4 text-center transition"
              style={{
                background: c.bg,
                borderColor:
                  color === c.id ? "#f0a060" : "rgba(255,255,255,0.08)",
                boxShadow:
                  color === c.id ? "0 0 0 1px #f0a060" : undefined,
              }}
            >
              <p className="font-display text-lg text-[#f3ebe2]">{c.label}</p>
              <p className="text-xs text-white/70">{c.mult}</p>
            </button>
          ))}
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
            disabled={spinning}
            onClick={() => void spin()}
            className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
          >
            {spinning ? "Spinning…" : "Spin"}
          </Button>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {result && !spinning && (
          <p className="font-display text-xl text-[#f3ebe2]">
            Landed {result.resultColor.toUpperCase()} —{" "}
            {result.won
              ? `won ${formatPrice(result.payout)}`
              : "better luck next raid"}
          </p>
        )}
      </div>
    </main>
  );
}
