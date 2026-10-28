import { HOUSE_RAKE_PERCENT } from "./config";
import { getSkinOrThrow, type EscrowItem } from "./store";

/**
 * Max share of the pot a single house-cut item may be.
 * Bigger than this → not a "small item"; skip the cut.
 */
export const HOUSE_CUT_MAX_ITEM_POT_FRACTION = 0.1;

/**
 * Cheapest item may overshoot the % target by this factor and still count
 * as a fair small cut. Beyond that (typical on tiny pots), no cut is taken.
 */
export const HOUSE_CUT_MAX_OVERSHOOT = 2.5;

function noRake(items: EscrowItem[], totalValue: number) {
  return {
    winnerItems: items,
    houseItems: [] as EscrowItem[],
    totalValue,
    rakeValue: 0,
    rakePercent: HOUSE_RAKE_PERCENT,
  };
}

/**
 * Split pot items into winner haul vs house cut.
 *
 * House takes the lowest-value skin(s) that approximate HOUSE_RAKE_PERCENT.
 * On small pots — when there is no suitably small item — the cut is skipped
 * entirely so the winner keeps the full pot.
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

  // Need at least two skins so the house can take one without emptying the pot
  if (items.length < 2 || totalValue <= 0) {
    return noRake(items, totalValue);
  }

  const rakeTarget = Math.floor((totalValue * HOUSE_RAKE_PERCENT) / 100);
  if (rakeTarget <= 0) {
    return noRake(items, totalValue);
  }

  const sorted = [...items].sort(
    (a, b) => getSkinOrThrow(a.skinId).price - getSkinOrThrow(b.skinId).price,
  );

  const cheapestPrice = getSkinOrThrow(sorted[0].skinId).price;
  const maxSmallItem = Math.max(
    Math.floor(rakeTarget * HOUSE_CUT_MAX_OVERSHOOT),
    Math.floor(totalValue * HOUSE_CUT_MAX_ITEM_POT_FRACTION),
  );

  // Tiny trade / no junk skin in the pot → no house cut
  if (cheapestPrice > maxSmallItem) {
    return noRake(items, totalValue);
  }

  const houseItems: EscrowItem[] = [];
  const winnerItems: EscrowItem[] = [];
  let rakeValue = 0;

  for (const item of sorted) {
    const price = getSkinOrThrow(item.skinId).price;
    const canTake =
      rakeValue < rakeTarget &&
      houseItems.length + 1 < items.length &&
      price <= maxSmallItem &&
      // Don't keep stacking once we'd more than double the target
      (houseItems.length === 0 || rakeValue + price <= rakeTarget * HOUSE_CUT_MAX_OVERSHOOT);

    if (canTake) {
      houseItems.push(item);
      rakeValue += price;
    } else {
      winnerItems.push(item);
    }
  }

  if (winnerItems.length === 0) {
    return noRake(items, totalValue);
  }

  return {
    winnerItems,
    houseItems,
    totalValue,
    rakeValue,
    rakePercent: HOUSE_RAKE_PERCENT,
  };
}
