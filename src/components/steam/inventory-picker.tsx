"use client";

import { formatPrice } from "@/lib/skins";
import { SkinCard } from "@/components/skin-card";
import type { EnrichedSkinItem } from "@/components/app-provider";

export function InventoryPicker({
  items,
  selected,
  onToggle,
  emptyText,
}: {
  items: EnrichedSkinItem[];
  selected: string[];
  onToggle: (assetId: string) => void;
  emptyText?: string;
}) {
  const available = items.filter((i) => i.assetId && !i.locked);
  const selectedValue = available
    .filter((i) => selected.includes(i.assetId!))
    .reduce((s, i) => s + i.skin.price, 0);

  if (available.length === 0) {
    return (
      <p className="rounded border border-dashed border-[rgba(196,92,38,0.3)] px-4 py-10 text-center text-sm text-[#a89a8c]">
        {emptyText ?? "No Steam skins available."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#a89a8c]">
        Selected{" "}
        <span className="font-mono text-[#f0a060]">
          {selected.length}
        </span>{" "}
        ·{" "}
        <span className="font-mono text-[#f0a060]">
          {formatPrice(selectedValue)}
        </span>
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {available.map((item) => (
          <SkinCard
            key={item.assetId}
            skin={item.skin}
            selected={selected.includes(item.assetId!)}
            onClick={() => onToggle(item.assetId!)}
            compact
          />
        ))}
      </div>
    </div>
  );
}
