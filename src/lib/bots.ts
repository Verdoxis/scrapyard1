import { SKINS } from "./skins";
import {
  itemsValue,
  nanoid,
  type EscrowItem,
} from "./store";

/** Build a set of escrow skins near a target value (for bot opponents). */
export function botItemsNearValue(targetCents: number): EscrowItem[] {
  const pool = [...SKINS].sort((a, b) => a.price - b.price);
  const picks: EscrowItem[] = [];
  let value = 0;
  // Greedy fill toward target
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const skin of shuffled) {
    if (value >= targetCents * 0.92) break;
    if (value + skin.price > targetCents * 1.1) continue;
    picks.push({
      instanceId: nanoid(10),
      skinId: skin.id,
      assetId: `bot_${skin.id}_${nanoid(6)}`,
      ownerId: "house-bot",
    });
    value += skin.price;
  }
  if (picks.length === 0) {
    const fallback = pool.find((s) => s.price > 0) ?? pool[0];
    picks.push({
      instanceId: nanoid(10),
      skinId: fallback.id,
      assetId: `bot_${fallback.id}_${nanoid(6)}`,
      ownerId: "house-bot",
    });
  }
  return picks;
}

export function botDepositValue(items: EscrowItem[]) {
  return itemsValue(items);
}
