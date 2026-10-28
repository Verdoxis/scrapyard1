import { HOUSE_RAKE_PERCENT } from "./config";
import { getSkinOrThrow, type EscrowItem } from "./store";

/**
 * Split pot items into winner haul vs house cut.
 * Takes lowest-value skins first until rake target is met (at least one item if pot > 1).
 */
export function applyRake(items: EscrowItem[]): {
  winnerItems: EscrowItem[];
  houseItems: EscrowItem[];
  totalValue: number;
  rakeValue: number;
  rakePercent: number;
} {
  const totalValue = items.reduce(
    (sum, i) => sum + getSkinOrThrow(i.skinId).price,
    0,
  );
  const rakeTarget = Math.floor((totalValue * HOUSE_RAKE_PERCENT) / 100);

  const sorted = [...items].sort(
    (a, b) => getSkinOrThrow(a.skinId).price - getSkinOrThrow(b.skinId).price,
  );

  const houseItems: EscrowItem[] = [];
  const winnerItems: EscrowItem[] = [];
  let rakeValue = 0;

  for (const item of sorted) {
    const price = getSkinOrThrow(item.skinId).price;
    if (
      rakeValue < rakeTarget &&
      houseItems.length + 1 < items.length // never take the entire pot
    ) {
      houseItems.push(item);
      rakeValue += price;
    } else {
      winnerItems.push(item);
    }
  }

  // If rake was 0 because everything was expensive, leave pot intact
  if (winnerItems.length === 0 && items.length > 0) {
    return {
      winnerItems: items,
      houseItems: [],
      totalValue,
      rakeValue: 0,
      rakePercent: HOUSE_RAKE_PERCENT,
    };
  }

  return {
    winnerItems,
    houseItems,
    totalValue,
    rakeValue,
    rakePercent: HOUSE_RAKE_PERCENT,
  };
}
