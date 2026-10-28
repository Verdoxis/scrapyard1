"use client";

import { useState } from "react";
import { RARITY_META, formatPrice, type Skin } from "@/lib/skins";
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
        "group relative w-full overflow-hidden rounded-sm text-left transition-colors",
        "border bg-[rgba(14,11,9,0.92)]",
        onClick && "hover:border-[rgba(196,92,38,0.55)]",
        !selected && "border-[rgba(255,255,255,0.08)]",
        selected && "border-[#f0a060] bg-[rgba(36,22,14,0.95)]",
        !onClick && "cursor-default",
      )}
      style={{ boxShadow: `inset 0 -3px 0 ${rarity.color}` }}
    >
      <div
        className={cn(
          "relative flex flex-col items-center gap-2 p-3",
          compact && "gap-1.5 p-2",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center bg-black/30",
            compact ? "h-20 w-full" : "h-28 w-full",
          )}
        >
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={skin.image}
              alt={skin.marketHashName || skin.name}
              className={cn(
                "object-contain",
                compact ? "h-16 w-16" : "h-24 w-24",
              )}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span
              className="text-sm font-semibold tracking-wide"
              style={{ color: rarity.color }}
            >
              {skin.name.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        <div className="w-full space-y-0.5 text-center">
          <p
            className={cn(
              "truncate text-xs font-medium",
              compact ? "text-[11px]" : "text-xs",
            )}
            style={{ color: rarity.color }}
            title={skin.name}
          >
            {skin.name}
          </p>
          <p
            className={cn(
              "font-mono",
              compact ? "text-xs" : "text-sm",
              selected ? "text-[#ffc078]" : "text-[#d8cfc3]",
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
