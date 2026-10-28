import { COINFLIP_VALUE_TOLERANCE } from "./config";

export interface PricedAsset {
  assetId?: string;
  locked?: boolean;
  skin: { price: number };
}

/** Pick unlocked skins whose total is nearest `targetCents` within tolerance. */
export function pickAssetIdsNearValue(
  items: PricedAsset[],
  targetCents: number,
  tolerancePercent = COINFLIP_VALUE_TOLERANCE,
): string[] {
  const available = items
    .filter(
      (i): i is PricedAsset & { assetId: string } =>
        Boolean(i.assetId) && !i.locked && i.skin.price > 0,
    )
    .slice()
    .sort((a, b) => b.skin.price - a.skin.price);

  if (available.length === 0 || targetCents <= 0) return [];

  const min = targetCents * (1 - tolerancePercent / 100);
  const max = targetCents * (1 + tolerancePercent / 100);

  type Picked = PricedAsset & { assetId: string };
  let best: Picked[] = [];
  let bestDiff = Infinity;

  const consider = (picks: Picked[]) => {
    const sum = picks.reduce((s, p) => s + p.skin.price, 0);
    if (sum < min || sum > max) return;
    const diff = Math.abs(sum - targetCents);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = picks;
    }
  };

  // Single-item matches
  for (const item of available) {
    consider([item]);
  }

  // Multi-start greedy fills
  const starts = Math.min(available.length, 20);
  for (let start = 0; start < starts; start++) {
    const picks: Picked[] = [];
    let sum = 0;
    const ordered = [
      ...available.slice(start),
      ...available.slice(0, start),
    ];
    for (const item of ordered) {
      if (sum + item.skin.price <= max) {
        picks.push(item);
        sum += item.skin.price;
        consider(picks.slice());
        if (sum >= min) break;
      }
    }
  }

  // Smallest items first fill (covers low targets)
  {
    const picks: Picked[] = [];
    let sum = 0;
    for (const item of [...available].reverse()) {
      if (sum + item.skin.price <= max) {
        picks.push(item);
        sum += item.skin.price;
        consider(picks.slice());
        if (sum >= min) break;
      }
    }
  }

  return best.map((p) => p.assetId);
}

/**
 * Expand/replace selection so total ≈ currentValue * multiplier.
 * If nothing selected, uses a mid inventory item as the 1x base.
 */
export function pickAssetIdsForMultiplier(
  items: PricedAsset[],
  currentSelectedIds: string[],
  multiplier: 2 | 3 | 4,
): string[] {
  const available = items.filter(
    (i): i is PricedAsset & { assetId: string } =>
      Boolean(i.assetId) && !i.locked && i.skin.price > 0,
  );
  if (available.length === 0) return [];

  const selected = available.filter((i) =>
    currentSelectedIds.includes(i.assetId),
  );
  let base =
    selected.reduce((s, i) => s + i.skin.price, 0) ||
    Math.round(
      available.reduce((s, i) => s + i.skin.price, 0) / available.length,
    );

  // Prefer a real single-skin base when empty selection
  if (selected.length === 0) {
    const mid = available[Math.floor(available.length / 2)];
    base = mid?.skin.price || base;
  }

  const target = Math.max(1, base * multiplier);
  // Loosen a bit for higher multipliers so we can actually fill
  const tol = Math.max(COINFLIP_VALUE_TOLERANCE, 12 + multiplier * 2);
  const picks = pickAssetIdsNearValue(available, target, tol);
  return picks.length > 0 ? picks : currentSelectedIds;
}

export function selectionValue(
  items: PricedAsset[],
  selectedIds: string[],
): number {
  return items
    .filter(
      (i): i is PricedAsset & { assetId: string } =>
        Boolean(i.assetId) && selectedIds.includes(i.assetId!),
    )
    .reduce((s, i) => s + i.skin.price, 0);
}
