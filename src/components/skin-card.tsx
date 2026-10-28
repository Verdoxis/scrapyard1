"use client";

import { useState } from "react";
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
        "group relative w-full overflow-hidden rounded-sm text-left transition",
        "border border-[rgba(196,92,38,0.22)]",
        "bg-[linear-gradient(180deg,rgba(48,36,28,0.95)_0%,rgba(14,11,9,0.98)_100%)]",
        onClick && "hover:border-[rgba(196,92,38,0.65)] hover:-translate-y-0.5",
        selected &&
          "border-[rgba(245,158,11,0.9)] ring-1 ring-[rgba(245,158,11,0.45)]",
        !onClick && "cursor-default",
      )}
      style={{
        boxShadow: selected
          ? `0 0 28px ${rarity.glow}`
          : `inset 0 -3px 0 ${rarity.color}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${skin.color}33, transparent 60%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)`,
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
            "relative flex items-center justify-center rounded-sm border border-black/40 bg-black/35",
            compact ? "h-20 w-full" : "h-28 w-full",
          )}
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(80,50,30,0.35), rgba(10,8,6,0.9))",
          }}
        >
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={skin.image}
              alt={skin.marketHashName || skin.name}
              className={cn(
                "object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]",
                compact ? "h-16 w-16" : "h-24 w-24",
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
            style={{ color: rarity.color }}
          >
            {rarity.label}
          </p>
          <p
            className={cn(
              "font-display text-sm tracking-wide text-[#f3ebe2]",
              compact && "text-xs",
            )}
          >
            {skin.weapon}
          </p>
          <p className="truncate text-xs text-[#a89a8c]">{skin.name}</p>
          <p className="pt-1 font-mono text-sm text-[#f0a060]">
            {formatPrice(skin.price)}
          </p>
        </div>
        {footer}
      </div>
    </button>
  );
}
