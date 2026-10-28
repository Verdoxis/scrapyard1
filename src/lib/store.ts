import { nanoid } from "nanoid";
import { generateServerSeed, hashServerSeed } from "./fairness";
import { SKINS, type Skin } from "./skins";

export interface OwnedSkin {
  instanceId: string;
  skinId: string;
  acquiredAt: number;
  source: "case" | "deposit" | "roulette" | "coinflip" | "starter";
}

export type TradeStatus =
  | "pending"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

export interface TradeOffer {
  id: string;
  type: "deposit" | "withdraw";
  status: TradeStatus;
  steamTradeUrl: string;
  skinIds: string[];
  instanceIds?: string[];
  totalValue: number;
  createdAt: number;
  updatedAt: number;
  message: string;
}

export interface GameRound {
  id: string;
  game: "case" | "roulette" | "coinflip";
  bet: number;
  payout: number;
  result: string;
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  createdAt: number;
}

export interface UserState {
  id: string;
  displayName: string;
  balance: number;
  inventory: OwnedSkin[];
  steamTradeUrl: string;
  clientSeed: string;
  serverSeed: string;
  serverSeedHash: string;
  nonce: number;
  trades: TradeOffer[];
  history: GameRound[];
}

const globalStore = globalThis as unknown as {
  __scrapyardStore?: Map<string, UserState>;
};

function store(): Map<string, UserState> {
  if (!globalStore.__scrapyardStore) {
    globalStore.__scrapyardStore = new Map();
  }
  return globalStore.__scrapyardStore;
}

const DEMO_USER_ID = "demo-survivor";

function starterInventory(): OwnedSkin[] {
  return [
    {
      instanceId: nanoid(10),
      skinId: "ak-tempered",
      acquiredAt: Date.now(),
      source: "starter",
    },
    {
      instanceId: nanoid(10),
      skinId: "mp5-urban",
      acquiredAt: Date.now(),
      source: "starter",
    },
  ];
}

export function createUser(id = DEMO_USER_ID): UserState {
  const serverSeed = generateServerSeed();
  const user: UserState = {
    id,
    displayName: "Survivor",
    balance: 2500, // $25.00 demo balance
    inventory: starterInventory(),
    steamTradeUrl: "",
    clientSeed: nanoid(12),
    serverSeed,
    serverSeedHash: hashServerSeed(serverSeed),
    nonce: 0,
    trades: [],
    history: [],
  };
  store().set(id, user);
  return user;
}

export function getUser(id = DEMO_USER_ID): UserState {
  const existing = store().get(id);
  if (existing) return existing;
  return createUser(id);
}

export function saveUser(user: UserState): void {
  store().set(user.id, user);
}

export function publicUser(user: UserState) {
  return {
    id: user.id,
    displayName: user.displayName,
    balance: user.balance,
    inventory: user.inventory.map((item) => ({
      ...item,
      skin: SKINS.find((s) => s.id === item.skinId) ?? null,
    })),
    steamTradeUrl: user.steamTradeUrl,
    clientSeed: user.clientSeed,
    serverSeedHash: user.serverSeedHash,
    nonce: user.nonce,
    trades: user.trades.slice(0, 20),
    history: user.history.slice(0, 30).map((h) => ({
      ...h,
      // Reveal seed only after round is recorded (always revealed in history)
    })),
  };
}

export function inventoryValue(user: UserState): number {
  return user.inventory.reduce((sum, item) => {
    const skin = SKINS.find((s) => s.id === item.skinId);
    return sum + (skin?.price ?? 0);
  }, 0);
}

export function resolveOwned(
  user: UserState,
  instanceId: string,
): { owned: OwnedSkin; skin: Skin } | null {
  const owned = user.inventory.find((i) => i.instanceId === instanceId);
  if (!owned) return null;
  const skin = SKINS.find((s) => s.id === owned.skinId);
  if (!skin) return null;
  return { owned, skin };
}

/** Mock Steam inventory available for deposit */
export function mockSteamInventory(): Array<Skin & { assetId: string }> {
  const depositPool = [
    "ak-forest",
    "thompson-tundra",
    "sar-hunter",
    "python-copper",
    "lr-midnight",
    "bolt-arctic",
    "ak-ember",
    "mp5-neon",
    "lr-oxide",
  ];
  return depositPool
    .map((id) => SKINS.find((s) => s.id === id))
    .filter((s): s is Skin => Boolean(s))
    .map((skin) => ({
      ...skin,
      assetId: `steam_${skin.id}_${nanoid(6)}`,
    }));
}
