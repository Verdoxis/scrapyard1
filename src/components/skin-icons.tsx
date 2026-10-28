"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { RARITY_META, formatPrice, type Skin } from "@/lib/skins";

type SkinLike = Pick<
  Skin,
  "name" | "weapon" | "price" | "image" | "color" | "weaponType" | "rarity"
>;

function rarityColor(skin: SkinLike) {
  return RARITY_META[skin.rarity]?.color ?? skin.color ?? "#a89888";
}

type TipState = {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
} | null;

let tipState: TipState = null;
const tipListeners = new Set<(t: TipState) => void>();

function setGlobalTip(next: TipState) {
  tipState = next;
  tipListeners.forEach((fn) => fn(next));
}

/** One portal tip for the whole page — mount once near SkinIconRow. */
export function SkinCursorTipHost() {
  const [tip, setTip] = useState<TipState>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onTip = (t: TipState) => setTip(t);
    tipListeners.add(onTip);
    setTip(tipState);
    return () => {
      tipListeners.delete(onTip);
    };
  }, []);

  if (!mounted || !tip) return null;

  return createPortal(
    <div
      data-skin-tooltip="true"
      className="pointer-events-none fixed z-[2147483646] max-w-[220px] rounded-sm border px-2.5 py-1.5 text-xs font-medium shadow-[0_8px_28px_rgba(0,0,0,0.65)]"
      style={{
        left: Math.min(tip.x + 16, window.innerWidth - 220),
        top: Math.min(tip.y + 18, window.innerHeight - 40),
        color: tip.color,
        borderColor: `${tip.color}88`,
        background: "rgba(8,6,5,0.96)",
      }}
    >
      {tip.name}
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
  const id = useId();
  const [failed, setFailed] = useState(false);
  const color = rarityColor(skin);
  const dim = size === "sm" ? "h-11 w-11" : "h-14 w-14";

  function show(e: React.PointerEvent | React.MouseEvent) {
    setGlobalTip({
      id,
      name: skin.name,
      color,
      x: e.clientX,
      y: e.clientY,
    });
  }

  function hide() {
    if (tipState?.id === id) setGlobalTip(null);
  }

  return (
    <div
      className="flex shrink-0 flex-col items-center gap-1"
      onPointerEnter={show}
      onPointerMove={show}
      onPointerLeave={hide}
      onMouseEnter={show}
      onMouseMove={show}
      onMouseLeave={hide}
    >
      <div
        className={`${dim} overflow-hidden rounded-sm bg-black/40`}
        style={{ boxShadow: `inset 0 -2px 0 ${color}` }}
      >
        {skin.image && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={skin.image}
            alt={skin.name}
            draggable={false}
            className="pointer-events-none h-full w-full object-contain p-0.5"
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
      <p className="pointer-events-none font-mono text-[10px] text-[#d8cfc3]">
        {formatPrice(skin.price)}
      </p>
    </div>
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
