import { createHash, randomBytes } from "crypto";

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashServerSeed(serverSeed: string): string {
  return createHash("sha256").update(serverSeed).digest("hex");
}

/** Deterministic float in [0, 1) from seeds + nonce. */
export function fairFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): number {
  const h = createHash("sha256")
    .update(`${serverSeed}:${clientSeed}:${nonce}`)
    .digest("hex");
  const slice = h.slice(0, 8);
  const int = parseInt(slice, 16);
  return int / 0x100000000;
}
