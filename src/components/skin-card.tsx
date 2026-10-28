"use client";

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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-md text-left transition",
        "bg-[linear-gradient(165deg,rgba(40,34,28,0.95),rgba(18,15,12,0.98))]",
        "border border-[rgba(196,92,38,0.18)]",
        onClick && "hover:border-[rgba(196,92,38,0.55)] hover:-translate-y-0.5",
        selected && "border-[rgba(245,158,11,0.85)] ring-1 ring-[rgba(245,158,11,0.4)]",
        !onClick && "cursor-default",
      )}
      style={{
        boxShadow: selected
          ? `0 0 24px ${rarity.glow}`
          : `inset 0 -2px 0 ${rarity.color}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)` }}
      />
      <div className={cn("flex flex-col items-center gap-2 p-3", compact && "p-2 gap-1")}>
        <WeaponGlyph
          type={skin.weaponType}
          color={skin.color}
          className={compact ? "h-14 w-20" : "h-20 w-28"}
        />
        <div className="w-full space-y-0.5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: rarity.color }}
          >
            {rarity.label}
          </p>
          <p className={cn("font-display text-sm tracking-wide text-[#f3ebe2]", compact && "text-xs")}>
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
