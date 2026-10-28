"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CASES, caseSkins, getCase } from "@/lib/cases";
import { RARITY_META, formatPrice, type Skin } from "@/lib/skins";
import { api } from "@/lib/api";
import { SkinCard } from "@/components/skin-card";
import { WeaponGlyph } from "@/components/weapon-glyph";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/app-provider";

export function CaseOpener({ caseId }: { caseId?: string }) {
  const { user, refresh, setUser } = useApp();
  const [activeId, setActiveId] = useState(caseId ?? CASES[0].id);
  const caseDef = getCase(activeId)!;
  const skins = useMemo(() => caseSkins(caseDef), [caseDef]);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<Skin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [reel, setReel] = useState<Skin[]>(() =>
    Array.from({ length: 40 }, (_, i) => skins[i % skins.length]),
  );

  useEffect(() => {
    setReel(Array.from({ length: 40 }, (_, i) => skins[i % skins.length]));
    setOffset(0);
    setWon(null);
  }, [skins]);

  async function open() {
    if (spinning) return;
    setError(null);
    setWon(null);
    setSpinning(true);
    try {
      const result = await api<{
        skin: Skin;
        balance: number;
      }>("/api/cases/open", {
        method: "POST",
        body: JSON.stringify({ caseId: activeId }),
      });

      const winIndex = 32;
      const nextReel = Array.from({ length: 40 }, (_, i) => {
        if (i === winIndex) return result.skin;
        return skins[Math.floor(Math.random() * skins.length)];
      });
      setReel(nextReel);

      const itemWidth = 148;
      const target = winIndex * itemWidth - itemWidth * 2.2;
      setOffset(0);
      requestAnimationFrame(() => {
        setOffset(target);
      });

      setTimeout(() => {
        setWon(result.skin);
        setSpinning(false);
        if (user) setUser({ ...user, balance: result.balance });
        void refresh();
      }, 4200);
    } catch (err) {
      setSpinning(false);
      setError(err instanceof Error ? err.message : "Open failed");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {CASES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              if (spinning) return;
              setActiveId(c.id);
              setWon(null);
              setOffset(0);
            }}
            className="rounded border px-3 py-2 text-left transition"
            style={{
              borderColor:
                c.id === activeId ? c.accent : "rgba(196,92,38,0.2)",
              background:
                c.id === activeId
                  ? "rgba(196,92,38,0.12)"
                  : "rgba(20,16,12,0.7)",
            }}
          >
            <p className="font-display text-sm tracking-wide text-[#f3ebe2]">
              {c.name}
            </p>
            <p className="font-mono text-xs text-[#f0a060]">
              {formatPrice(c.price)}
            </p>
          </button>
        ))}
      </div>

      <section className="relative overflow-hidden rounded-lg border border-[rgba(196,92,38,0.25)] bg-[rgba(16,13,10,0.95)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse at top, ${caseDef.accent}33, transparent 55%)`,
          }}
        />
        <div className="relative space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
                Case opening
              </p>
              <h2 className="font-display text-3xl tracking-wide text-[#f3ebe2] sm:text-4xl">
                {caseDef.name}
              </h2>
              <p className="mt-1 max-w-md text-sm text-[#a89a8c]">
                {caseDef.description}
              </p>
            </div>
            <Button
              size="lg"
              disabled={spinning}
              onClick={() => void open()}
              className="bg-[#c45c26] px-8 font-display text-lg tracking-wider text-[#120e0b] hover:bg-[#e07030]"
            >
              {spinning ? "Opening…" : `Open · ${formatPrice(caseDef.price)}`}
            </Button>
          </div>

          <div className="relative h-40 overflow-hidden rounded border border-[rgba(240,160,96,0.2)] bg-black/40">
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-[#f0a060] shadow-[0_0_18px_#f0a060]" />
            <motion.div
              className="absolute top-3 flex gap-2"
              animate={{ x: -offset }}
              transition={{
                duration: spinning ? 4 : 0,
                ease: [0.15, 0.75, 0.1, 1],
              }}
            >
              {reel.map((skin, i) => (
                <div
                  key={`${skin.id}-${i}`}
                  className="flex h-[120px] w-[140px] shrink-0 flex-col items-center justify-center rounded border border-white/5 bg-[rgba(30,24,18,0.9)]"
                  style={{
                    boxShadow: `inset 0 -2px 0 ${RARITY_META[skin.rarity].color}`,
                  }}
                >
                  <WeaponGlyph
                    type={skin.weaponType}
                    color={skin.color}
                    className="h-14 w-20"
                  />
                  <p className="mt-1 truncate px-2 text-[10px] text-[#a89a8c]">
                    {skin.name}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}

          <AnimatePresence>
            {won && !spinning && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center gap-4 rounded border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] p-4"
              >
                <WeaponGlyph type={won.weaponType} color={won.color} className="h-16 w-24" />
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: RARITY_META[won.rarity].color }}
                  >
                    {RARITY_META[won.rarity].label}
                  </p>
                  <p className="font-display text-xl text-[#f3ebe2]">
                    {won.weapon} · {won.name}
                  </p>
                  <p className="font-mono text-[#f0a060]">
                    {formatPrice(won.price)}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-xl tracking-wide text-[#f3ebe2]">
          Contains
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {skins.map((skin) => (
            <SkinCard key={skin.id} skin={skin} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
