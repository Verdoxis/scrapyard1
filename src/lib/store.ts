import { nanoid } from "nanoid";
import { HOUSE_RAKE_PERCENT } from "./config";
import { generateServerSeed, hashServerSeed } from "./fairness";
import { SKINS, type Skin } from "./skins";

export type TradeStatus =
  | "pending"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

export interface EscrowItem {
  instanceId: string;
  skinId: string;
  assetId: string;
  ownerId: string;
}

export interface TradeOffer {
  id: string;
  purpose: "coinflip_create" | "coinflip_join" | "jackpot_deposit";
  gameId: string;
  status: TradeStatus;
  steamTradeUrl: string;
  items: EscrowItem[];
  totalValue: number;
  createdAt: number;
  updatedAt: number;
  message: string;
}

export interface SteamInvItem {
  assetId: string;
  skinId: string;
  /** Locked while in an open trade or active game */
  locked: boolean;
}

export type CoinSide = "red" | "black";

export interface CoinflipGame {
  id: string;
  status: "awaiting_creator_trade" | "open" | "awaiting_joiner_trade" | "flipping" | "settled" | "cancelled";
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  creatorSide: CoinSide;
  creatorItems: EscrowItem[];
  joinerId?: string;
  joinerName?: string;
  joinerAvatar?: string | null;
  joinerSide?: CoinSide;
  joinerItems: EscrowItem[];
  winnerId?: string;
  resultSide?: CoinSide;
  totalValue: number;
  rakeValue: number;
  winnerItems: EscrowItem[];
  houseItems: EscrowItem[];
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed: string;
  nonce: number;
  createdAt: number;
  settledAt?: number;
}

export interface JackpotDeposit {
  userId: string;
  displayName: string;
  items: EscrowItem[];
  value: number;
}

export interface JackpotRound {
  id: string;
  status: "open" | "awaiting_trades" | "spinning" | "settled";
  deposits: JackpotDeposit[];
  pendingTrades: string[];
  totalValue: number;
  rakeValue: number;
  winnerId?: string;
  winnerItems: EscrowItem[];
  houseItems: EscrowItem[];
  endsAt: number;
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed: string;
  nonce: number;
  createdAt: number;
  settledAt?: number;
}

export interface UserState {
  id: string;
  displayName: string;
  steamConnected: boolean;
  steamTradeUrl: string;
  steamId64: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  steamInventory: SteamInvItem[];
  /** Skins won / held on-site after games */
  siteInventory: EscrowItem[];
  clientSeed: string;
  serverSeed: string;
  serverSeedHash: string;
  nonce: number;
  trades: TradeOffer[];
  houseEarnings: number;
}

interface GlobalState {
  users: Map<string, UserState>;
  coinflips: Map<string, CoinflipGame>;
  jackpot: JackpotRound | null;
  houseBank: EscrowItem[];
  houseEarnings: number;
}

const g = globalThis as unknown as { __scrapyardV4?: GlobalState };

function state(): GlobalState {
  if (!g.__scrapyardV4) {
    g.__scrapyardV4 = {
      users: new Map(),
      coinflips: new Map(),
      jackpot: null,
      houseBank: [],
      houseEarnings: 0,
    };
  }
  return g.__scrapyardV4;
}

export const DEMO_USER_ID = "demo-survivor";

export function buildMockSteamInventory(): SteamInvItem[] {
  return SKINS.map((skin) => ({
    assetId: `steam_${skin.id}_${nanoid(6)}`,
    skinId: skin.id,
    locked: false,
  }));
}

function freshUser(id: string): UserState {
  const serverSeed = generateServerSeed();
  return {
    id,
    displayName: id === DEMO_USER_ID ? "Survivor" : `Player-${id.slice(0, 5)}`,
    steamConnected: false,
    steamTradeUrl: "",
    steamId64: null,
    avatarUrl: null,
    profileUrl: null,
    steamInventory: [],
    siteInventory: [],
    clientSeed: nanoid(12),
    serverSeed,
    serverSeedHash: hashServerSeed(serverSeed),
    nonce: 0,
    trades: [],
    houseEarnings: 0,
  };
}

export function getUser(id = DEMO_USER_ID): UserState {
  const s = state();
  let user = s.users.get(id);
  if (!user) {
    user = freshUser(id);
    s.users.set(id, user);
  }
  return user;
}

export function saveUser(user: UserState) {
  state().users.set(user.id, user);
}

export function getSkinOrThrow(skinId: string): Skin {
  const skin = SKINS.find((x) => x.id === skinId);
  if (!skin) throw new Error(`Unknown skin ${skinId}`);
  return skin;
}

export function itemsValue(items: { skinId: string }[]): number {
  return items.reduce((sum, i) => sum + getSkinOrThrow(i.skinId).price, 0);
}

export function enrichItem(item: EscrowItem | SteamInvItem) {
  return {
    ...item,
    skin: getSkinOrThrow(item.skinId),
  };
}

export function connectSteam(
  user: UserState,
  tradeUrl: string,
  opts?: {
    displayName?: string;
    steamId64?: string | null;
    avatarUrl?: string | null;
    profileUrl?: string | null;
    personaName?: string | null;
  },
) {
  if (!tradeUrl.includes("steamcommunity.com/tradeoffer/new")) {
    throw new Error(
      "Invalid trade URL. Use the link from Steam → Inventory → Trade Offers → Who can send me Trade Offers.",
    );
  }
  user.steamTradeUrl = tradeUrl.trim();
  user.steamConnected = true;
  user.steamId64 = opts?.steamId64 ?? user.steamId64;
  user.avatarUrl = opts?.avatarUrl ?? user.avatarUrl;
  user.profileUrl = opts?.profileUrl ?? user.profileUrl;
  // Prefer Steam persona name as the site display name
  if (opts?.personaName?.trim()) {
    user.displayName = opts.personaName.trim().slice(0, 32);
  } else if (opts?.displayName?.trim()) {
    user.displayName = opts.displayName.trim().slice(0, 32);
  }
  // Always refresh listed skins from the Steam market catalog for demo
  user.steamInventory = buildMockSteamInventory();
  saveUser(user);
  return user;
}

export function getCoinflips(): CoinflipGame[] {
  return [...state().coinflips.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getCoinflip(id: string) {
  return state().coinflips.get(id);
}

export function saveCoinflip(game: CoinflipGame) {
  state().coinflips.set(game.id, game);
}

export function getJackpot(): JackpotRound {
  const s = state();
  if (!s.jackpot || s.jackpot.status === "settled") {
    s.jackpot = createJackpotRound();
  }
  return s.jackpot;
}

export function saveJackpot(round: JackpotRound) {
  state().jackpot = round;
}

function createJackpotRound(): JackpotRound {
  const serverSeed = generateServerSeed();
  return {
    id: nanoid(10),
    status: "open",
    deposits: [],
    pendingTrades: [],
    totalValue: 0,
    rakeValue: 0,
    winnerItems: [],
    houseItems: [],
    endsAt: Date.now() + 90_000,
    serverSeedHash: hashServerSeed(serverSeed),
    serverSeed,
    clientSeed: "jackpot",
    nonce: 0,
    createdAt: Date.now(),
  };
}

export function rotateJackpotIfNeeded() {
  const s = state();
  if (!s.jackpot || s.jackpot.status === "settled") {
    s.jackpot = createJackpotRound();
  }
  return s.jackpot;
}

export function addHouseItems(items: EscrowItem[], value: number) {
  const s = state();
  s.houseBank.push(...items);
  s.houseEarnings += value;
}

export function publicUser(user: UserState) {
  return {
    id: user.id,
    displayName: user.displayName,
    steamConnected: user.steamConnected,
    steamTradeUrl: user.steamTradeUrl,
    steamId64: user.steamId64,
    avatarUrl: user.avatarUrl,
    profileUrl: user.profileUrl,
    steamInventory: user.steamInventory.map(enrichItem),
    siteInventory: user.siteInventory.map(enrichItem),
    clientSeed: user.clientSeed,
    serverSeedHash: user.serverSeedHash,
    nonce: user.nonce,
    trades: user.trades.slice(0, 25),
  };
}

export function publicCoinflip(game: CoinflipGame) {
  return {
    ...game,
    creatorItems: game.creatorItems.map(enrichItem),
    joinerItems: game.joinerItems.map(enrichItem),
    winnerItems: game.winnerItems.map(enrichItem),
    houseItems: game.houseItems.map(enrichItem),
    // hide seed until settled
    serverSeed: game.status === "settled" ? game.serverSeed : undefined,
  };
}

export function publicJackpot(round: JackpotRound) {
  return {
    ...round,
    deposits: round.deposits.map((d) => ({
      ...d,
      items: d.items.map(enrichItem),
    })),
    winnerItems: round.winnerItems.map(enrichItem),
    houseItems: round.houseItems.map(enrichItem),
    serverSeed: round.status === "settled" ? round.serverSeed : undefined,
  };
}

export function houseStats() {
  const s = state();
  return {
    earnings: s.houseEarnings,
    itemCount: s.houseBank.length,
    rakePercent: HOUSE_RAKE_PERCENT,
  };
}

export { nanoid, state };
