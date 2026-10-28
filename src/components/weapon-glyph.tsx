"use client";

import type { WeaponType } from "@/lib/skins";
import { cn } from "@/lib/utils";

export function WeaponGlyph({
  type,
  color,
  className,
}: {
  type: WeaponType;
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn("drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`g-${type}-${color.replace("#", "")}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#1a1410" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect
        x="8"
        y="18"
        width="104"
        height="44"
        rx="4"
        fill={`url(#g-${type}-${color.replace("#", "")})`}
        opacity="0.25"
      />
      {type === "ak" || type === "lr300" || type === "sar" ? (
        <>
          <rect x="18" y="34" width="72" height="10" rx="2" fill={color} />
          <rect x="88" y="36" width="18" height="6" rx="1" fill={color} opacity="0.85" />
          <rect x="28" y="44" width="10" height="14" rx="1" fill={color} opacity="0.7" />
          <rect x="48" y="28" width="22" height="6" rx="1" fill="#d4c4b0" opacity="0.5" />
        </>
      ) : type === "mp5" || type === "thompson" || type === "custom" ? (
        <>
          <rect x="24" y="36" width="58" height="9" rx="2" fill={color} />
          <rect x="80" y="38" width="14" height="5" fill={color} opacity="0.8" />
          <rect x="40" y="45" width="8" height="12" rx="1" fill={color} opacity="0.7" />
          <rect x="52" y="30" width="16" height="6" rx="1" fill="#d4c4b0" opacity="0.45" />
        </>
      ) : type === "bolt" ? (
        <>
          <rect x="14" y="37" width="82" height="7" rx="2" fill={color} />
          <rect x="30" y="44" width="8" height="12" rx="1" fill={color} opacity="0.7" />
          <circle cx="70" cy="34" r="5" fill="#d4c4b0" opacity="0.4" />
        </>
      ) : (
        <>
          <rect x="36" y="34" width="40" height="12" rx="3" fill={color} />
          <rect x="74" y="37" width="16" height="6" rx="1" fill={color} opacity="0.85" />
          <rect x="42" y="46" width="6" height="10" fill={color} opacity="0.7" />
        </>
      )}
      <path
        d="M20 58h80"
        stroke="#f0a060"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
    </svg>
  );
}
