/**
 * Integrate a velocity profile: ramp up → constant cruise → ramp down.
 * Continuous velocity (no ease kinks) — shared by coinflip + jackpot.
 */
export function cruiseProgress(
  t: number,
  tA = 0.16,
  tC = 0.58,
): number {
  const area = 0.5 - 0.5 * tA + 0.5 * tC;
  const v = 1 / area;

  if (t <= 0) return 0;
  if (t >= 1) return 1;

  if (t <= tA) {
    return (0.5 * v * t * t) / tA;
  }
  if (t <= tC) {
    return 0.5 * v * tA + v * (t - tA);
  }
  const pC = 0.5 * v * tA + v * (tC - tA);
  const u = (t - tC) / (1 - tC);
  return pC + v * (1 - tC) * (u - 0.5 * u * u);
}
