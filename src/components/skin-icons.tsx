"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RARITY_META, formatPrice, type Skin } from "@/lib/skins";

type SkinLike = Pick<
  Skin,
  "name" | "weapon" | "price" | "image" | "color" | "weaponType" | "rarity"
>;

function rarityColor(skin: SkinLike) {
  return RARITY_META[skin.rarity]?.color ?? skin.color ?? "#a89888";
}

function CursorTooltip({
  name,
  color,
  x,
  y,
  visible,
}: {
  name: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] max-w-[240px] rounded-sm bg-[rgba(10,8,6,0.94)] px-2.5 py-1.5 text-xs shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
      style={{
        left: Math.min(x + 14, window.innerWidth - 250),
        top: Math.min(y + 16, window.innerHeight - 48),
        color,
      }}
    >
      {name}
    </div>,
    document.body,
  );
}

export function SkinIconChip({
  skin,
  size = "md",
}: {
  skin: SkinLike;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; on: boolean }>({
    x: 0,
    y: 0,
    on: false,
  });
  const color = rarityColor(skin);
  const dim = size === "sm" ? "h-11 w-11" : "h-14 w-14";

  return (
    <>
      <div
        className="flex shrink-0 flex-col items-center gap-1"
        onMouseEnter={(e) =>
          setTip({ x: e.clientX, y: e.clientY, on: true })
        }
        onMouseMove={(e) =>
          setTip({ x: e.clientX, y: e.clientY, on: true })
        }
        onMouseLeave={() => setTip((t) => ({ ...t, on: false }))}
      >
        <div
          className={`${dim} overflow-hidden rounded-sm bg-black/40`}
          style={{ boxShadow: `inset 0 -2px 0 ${color}` }}
        >
          {skin.image && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={skin.image}
              alt=""
              className="h-full w-full object-contain p-0.5"
              onError={() => setFailed(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[10px] font-semibold"
              style={{ color }}
            >
              {skin.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <p className="font-mono text-[10px] text-[#d8cfc3]">
          {formatPrice(skin.price)}
        </p>
      </div>
      <CursorTooltip
        name={skin.name}
        color={color}
        x={tip.x}
        y={tip.y}
        visible={tip.on}
      />
    </>
  );
}

export function SkinIconRow({
  items,
  size = "md",
}: {
  items: Array<{ skin: SkinLike }>;
  size?: "sm" | "md";
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <SkinIconChip
          key={`${item.skin.name}-${idx}`}
          skin={item.skin}
          size={size}
        />
      ))}
    </div>
  );
}
