"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { RARITY_META, formatPrice, type Skin } from "@/lib/skins";
import { WeaponGlyph } from "@/components/weapon-glyph";
import { cn } from "@/lib/utils";

export function SkinCard({
  skin,
  selected,
  onClick,
  footer,
  compact,
}: {
  skin: Skin;
  selected?: boolean;
  onClick?: () => void;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  const rarity = RARITY_META[skin.rarity];
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(skin.image) && !imgFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-sm text-left transition-all duration-150",
        "border bg-[linear-gradient(180deg,rgba(48,36,28,0.95)_0%,rgba(14,11,9,0.98)_100%)]",
        onClick && "hover:border-[rgba(196,92,38,0.65)] hover:-translate-y-0.5",
        !selected && "border-[rgba(196,92,38,0.22)]",
        selected &&
          "z-[1] -translate-y-1 scale-[1.03] border-[#f0a060] bg-[linear-gradient(180deg,rgba(90,45,20,0.98)_0%,rgba(28,14,8,0.99)_100%)]",
        !onClick && "cursor-default",
      )}
      style={{
        boxShadow: selected
          ? `0 0 0 2px rgba(240,160,96,0.95), 0 0 36px ${rarity.glow}, 0 12px 28px rgba(0,0,0,0.55), inset 0 -4px 0 ${rarity.color}`
          : `inset 0 -3px 0 ${rarity.color}`,
      }}
    >
      {selected && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(240,160,96,0.28),transparent_55%)]" />
          <div className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-sm bg-[#cd412b] text-[#140c08] shadow-[0_0_12px_rgba(205,65,43,0.65)]">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        </>
      )}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${skin.color}33, transparent 60%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${selected ? "#f0a060" : rarity.color}, transparent)`,
        }}
      />
      <div
        className={cn(
          "relative flex flex-col items-center gap-2 p-3",
          compact && "gap-1 p-2",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center rounded-sm border bg-black/35",
            compact ? "h-20 w-full" : "h-28 w-full",
            selected
              ? "border-[rgba(240,160,96,0.55)]"
              : "border-black/40",
          )}
          style={{
            backgroundImage: selected
              ? "linear-gradient(135deg, rgba(140,70,30,0.55), rgba(10,8,6,0.92))"
              : "linear-gradient(135deg, rgba(80,50,30,0.35), rgba(10,8,6,0.9))",
          }}
        >
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={skin.image}
              alt={skin.marketHashName || skin.name}
              className={cn(
                "object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)] transition",
                compact ? "h-16 w-16" : "h-24 w-24",
                selected && "scale-110 drop-shadow-[0_0_18px_rgba(240,160,96,0.45)]",
              )}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <WeaponGlyph
              type={skin.weaponType}
              color={skin.color}
              className={compact ? "h-14 w-20" : "h-20 w-28"}
            />
          )}
        </div>
        <div className="w-full space-y-0.5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: selected ? "#f0a060" : rarity.color }}
          >
            {selected ? "Selected" : rarity.label}
          </p>
          <p
            className={cn(
              "font-display text-sm tracking-wide text-[#f3ebe2]",
              compact && "text-xs",
            )}
          >
            {skin.weapon}
          </p>
          <p
            className={cn(
              "truncate text-xs",
              selected ? "text-[#f3ebe2]" : "text-[#a89a8c]",
            )}
          >
            {skin.name}
          </p>
          <p
            className={cn(
              "pt-1 font-mono text-sm",
              selected ? "text-[#ffc078]" : "text-[#f0a060]",
            )}
          >
            {formatPrice(skin.price)}
          </p>
        </div>
        {footer}
      </div>
    </button>
  );
}
