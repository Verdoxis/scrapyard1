import { coinflipJoinValueBounds } from "./coinflip-odds";

export interface PricedAsset {
  assetId?: string;
  locked?: boolean;
  skin: { price: number };
}

/** Pick unlocked skins whose total is nearest `targetCents` within join odds band. */
export function pickAssetIdsNearValue(
  items: PricedAsset[],
  targetCents: number,
): string[] {
  const available = items
    .filter(
      (i): i is PricedAsset & { assetId: string } =>
        Boolean(i.assetId) && !i.locked && i.skin.price > 0,
    )
    .slice()
    .sort((a, b) => b.skin.price - a.skin.price);

  if (available.length === 0 || targetCents <= 0) return [];

  const { min, max } = coinflipJoinValueBounds(targetCents);

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

  for (const item of available) {
    consider([item]);
  }

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
