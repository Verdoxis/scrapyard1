import { coinflipJoinValueBounds } from "./coinflip-odds";

export interface PricedAsset {
  assetId?: string;
  locked?: boolean;
  skin: { price: number };
}

type Picked = PricedAsset & { assetId: string };

/**
 * Pick unlocked skins whose total is nearest `targetCents` within the
 * coinflip join odds band. Uses 0/1 knapsack over reachable sums so
 * small lobbies with a tight % gap still get a match.
 */
export function pickAssetIdsNearValue(
  items: PricedAsset[],
  targetCents: number,
): string[] {
  const available = items
    .filter(
      (i): i is Picked =>
        Boolean(i.assetId) && !i.locked && i.skin.price > 0,
    )
    .slice()
    .sort((a, b) => b.skin.price - a.skin.price);

  if (available.length === 0 || targetCents <= 0) return [];

  const { min, max } = coinflipJoinValueBounds(targetCents);
  const maxInt = Math.floor(max);
  const minInt = Math.ceil(min);

  const candidates = available.filter((i) => i.skin.price <= maxInt);
  if (candidates.length === 0) return [];

  // Prefer a mix of near-target singles and smaller building blocks.
  const near = candidates
    .filter((i) => i.skin.price >= targetCents * 0.35)
    .slice(0, 24);
  const cheap = [...candidates]
    .sort((a, b) => a.skin.price - b.skin.price)
    .slice(0, 28);
  const seen = new Set<string>();
  const pool: Picked[] = [];
  for (const item of [...near, ...cheap, ...candidates]) {
    if (seen.has(item.assetId)) continue;
    seen.add(item.assetId);
    pool.push(item);
    if (pool.length >= 48) break;
  }

  // reachable sum → how we got there (prev sum + assetId)
  const how = new Map<number, { prev: number; id: string } | null>();
  how.set(0, null);

  for (const item of pool) {
    const price = item.skin.price;
    const additions: Array<[number, { prev: number; id: string }]> = [];
    for (const sum of how.keys()) {
      const next = sum + price;
      if (next > maxInt || how.has(next)) continue;
      additions.push([next, { prev: sum, id: item.assetId }]);
    }
    for (const [next, meta] of additions) {
      how.set(next, meta);
    }
  }

  let bestSum = -1;
  let bestDiff = Infinity;
  for (const sum of how.keys()) {
    if (sum < minInt || sum > maxInt) continue;
    const diff = Math.abs(sum - targetCents);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSum = sum;
    }
  }

  if (bestSum < 0) {
    // Soft fallback: closest single under/near target (UI can still warn).
    let closest: Picked | null = null;
    let closestDiff = Infinity;
    for (const item of candidates) {
      const diff = Math.abs(item.skin.price - targetCents);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = item;
      }
    }
    return closest ? [closest.assetId] : [];
  }

  const ids: string[] = [];
  let cursor = bestSum;
  while (cursor > 0) {
    const step = how.get(cursor);
    if (!step) break;
    ids.push(step.id);
    cursor = step.prev;
  }
  return ids;
}

export function selectionValue(
  items: PricedAsset[],
  selectedIds: string[],
): number {
  return items
    .filter(
      (i): i is Picked =>
        Boolean(i.assetId) && selectedIds.includes(i.assetId!),
    )
    .reduce((s, i) => s + i.skin.price, 0);
}
