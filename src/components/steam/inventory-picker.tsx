"use client";

import { useMemo } from "react";
import { formatPrice } from "@/lib/skins";
import { SkinCard } from "@/components/skin-card";
import type { EnrichedSkinItem } from "@/components/app-provider";
import { cn } from "@/lib/utils";

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
  const { picked, rest, selectedValue } = useMemo(() => {
    const unlocked = items.filter((i) => i.assetId && !i.locked);
    const selectedSet = new Set(selected);
    const byPrice = (a: EnrichedSkinItem, b: EnrichedSkinItem) =>
      (b.skin?.price ?? 0) - (a.skin?.price ?? 0);
    const pickedItems = unlocked
      .filter((i) => selectedSet.has(i.assetId!))
      .sort(byPrice);
    const restItems = unlocked
      .filter((i) => !selectedSet.has(i.assetId!))
      .sort(byPrice);
    const value = pickedItems.reduce((s, i) => s + i.skin.price, 0);
    return { picked: pickedItems, rest: restItems, selectedValue: value };
  }, [items, selected]);

  if (picked.length === 0 && rest.length === 0) {
    return (
      <p className="rounded border border-dashed border-[rgba(196,92,38,0.3)] px-4 py-10 text-center text-sm text-[#a89a8c]">
        {emptyText ?? "No Steam skins available."}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Moved / selected tray */}
      <section
        className={cn(
          "rounded-sm border px-3 py-3 transition-colors",
          picked.length > 0
            ? "border-[rgba(240,160,96,0.45)] bg-[rgba(40,24,14,0.55)]"
            : "border-dashed border-[rgba(255,255,255,0.1)] bg-black/20",
        )}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#f0a060]">
            Your stake
          </p>
          <p className="text-sm text-[#a89a8c]">
            <span className="font-mono text-[#f0a060]">{picked.length}</span>
            {" · "}
            <span className="font-mono text-[#f0a060]">
              {formatPrice(selectedValue)}
            </span>
          </p>
        </div>
        {picked.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6b6258]">
            Tap skins below — they move up here
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {picked.map((item) => (
              <SkinCard
                key={item.assetId}
                skin={item.skin}
                selected
                onClick={() => onToggle(item.assetId!)}
                compact
              />
            ))}
          </div>
        )}
      </section>

      {/* Remaining inventory */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7d70]">
            Inventory
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b6258]">
            High → low
          </p>
        </div>
        {rest.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[rgba(255,255,255,0.08)] px-4 py-8 text-center text-sm text-[#6b6258]">
            All available skins are in your stake
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rest.map((item) => (
              <SkinCard
                key={item.assetId}
                skin={item.skin}
                onClick={() => onToggle(item.assetId!)}
                compact
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
