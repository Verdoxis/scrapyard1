import { COINFLIP_MAX_CHANCE_DIFF_PERCENT } from "./config";

/** Gap between two stakes' win chances, in percentage points (0–100). */
export function coinflipChanceDiffPercent(aCents: number, bCents: number): number {
  const total = aCents + bCents;
  if (total <= 0) return 0;
  return (Math.abs(aCents - bCents) / total) * 100;
}

export function isCoinflipStakeAllowed(
  creatorCents: number,
  joinerCents: number,
): boolean {
  return (
    coinflipChanceDiffPercent(creatorCents, joinerCents) <=
    COINFLIP_MAX_CHANCE_DIFF_PERCENT
  );
}

/** Join stake band around the creator that keeps chance diff ≤ max. */
export function coinflipJoinValueBounds(creatorCents: number) {
  const d = COINFLIP_MAX_CHANCE_DIFF_PERCENT / 100;
  const safe = Math.max(creatorCents, 1);
  return {
    min: (safe * (1 - d)) / (1 + d),
    max: (safe * (1 + d)) / (1 - d),
  };
}

export function winChancePercent(yourCents: number, theirCents: number): number {
  const total = yourCents + theirCents;
  if (total <= 0) return 50;
  return (yourCents / total) * 100;
}
