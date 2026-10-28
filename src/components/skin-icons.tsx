"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice, type Skin } from "@/lib/skins";
import { WeaponGlyph } from "@/components/weapon-glyph";
import { cn } from "@/lib/utils";

type SkinLike = Pick<
  Skin,
  "name" | "weapon" | "price" | "image" | "color" | "weaponType" | "rarity"
>;

function CursorTooltip({
  label,
  x,
  y,
  visible,
}: {
  label: string;
  x: number;
  y: number;
  visible: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] max-w-[240px] rounded-sm border border-[rgba(205,65,43,0.45)] bg-[rgba(12,9,7,0.96)] px-2.5 py-1.5 text-xs text-[#efe6da] shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
      style={{
        left: Math.min(x + 14, window.innerWidth - 250),
        top: Math.min(y + 16, window.innerHeight - 48),
      }}
    >
      {label}
    </div>,
    document.body,
  );
}

export function SkinIconChip({
  skin,
  size = "md",
  showPrice,
}: {
  skin: SkinLike;
  size?: "sm" | "md";
  showPrice?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; on: boolean }>({
    x: 0,
    y: 0,
    on: false,
  });
  const dim = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const label = `${skin.weapon} · ${skin.name}${
    showPrice !== false ? ` (${formatPrice(skin.price)})` : ""
  }`;

  return (
    <>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-sm border border-[rgba(205,65,43,0.35)] bg-[linear-gradient(180deg,rgba(40,30,22,0.95),rgba(10,8,6,0.98))]",
          dim,
        )}
        style={{ boxShadow: `inset 0 -2px 0 ${skin.color}` }}
        onMouseEnter={(e) =>
          setTip({ x: e.clientX, y: e.clientY, on: true })
        }
        onMouseMove={(e) =>
          setTip({ x: e.clientX, y: e.clientY, on: true })
        }
        onMouseLeave={() => setTip((t) => ({ ...t, on: false }))}
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
          <div className="flex h-full w-full items-center justify-center opacity-80">
            <WeaponGlyph
              type={skin.weaponType}
              color={skin.color}
              className="h-6 w-6"
            />
          </div>
        )}
      </div>
      <CursorTooltip
        label={label}
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
    <div className="mt-2 flex flex-wrap gap-1.5">
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
