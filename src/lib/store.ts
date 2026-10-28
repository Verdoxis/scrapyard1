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

export type TradePurpose =
  | "coinflip_create"
  | "coinflip_join"
  | "jackpot_deposit"
  | "coinflip_payout"
  | "jackpot_payout";

export interface TradeOffer {
  id: string;
  purpose: TradePurpose;
  gameId: string;
  status: TradeStatus;
  /** Steam trade offer URL the player opens to accept */
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
  /** Payout trade the winner must accept on Steam */
  payoutTradeId?: string;
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
  avatarUrl: string | null;
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
  /** Fair roll in [0,1) — position on the chance line */
  winningTicket?: number;
  winnerItems: EscrowItem[];
  houseItems: EscrowItem[];
  endsAt: number;
  spinStartedAt?: number;
  spinEndsAt?: number;
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed: string;
  nonce: number;
  createdAt: number;
  settledAt?: number;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  coinflipsPlayed: number;
  jackpotsPlayed: number;
  biggestWin: number;
}

export interface GameHistoryEntry {
  id: string;
  game: "coinflip" | "jackpot";
  gameId: string;
  won: boolean;
  wagered: number;
  payout: number;
  opponentName?: string;
  resultSide?: string;
  createdAt: number;
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
  stats: UserStats;
  gameHistory: GameHistoryEntry[];
  /** Unix ms; if set and in the future, gambling is blocked */
  selfBanUntil: number | null;
  joinedAt: number;
}

interface GlobalState {
  users: Map<string, UserState>;
  coinflips: Map<string, CoinflipGame>;
  jackpot: JackpotRound | null;
  houseBank: EscrowItem[];
  houseEarnings: number;
}

const g = globalThis as unknown as { __scrapyardV8?: GlobalState };

function state(): GlobalState {
  if (!g.__scrapyardV8) {
    g.__scrapyardV8 = {
      users: new Map(),
      coinflips: new Map(),
      jackpot: null,
      houseBank: [],
      houseEarnings: 0,
    };
  }
  return g.__scrapyardV8;
}

export function emptyStats(): UserStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    coinflipsPlayed: 0,
    jackpotsPlayed: 0,
    biggestWin: 0,
  };
}

export const DEMO_USER_ID = "demo-survivor";

/** Demo inventory — several copies of each catalog skin for testing. */
const DEMO_COPIES_PER_SKIN = 4;

export function buildMockSteamInventory(): SteamInvItem[] {
  const items: SteamInvItem[] = [];
  for (const skin of SKINS) {
    for (let i = 0; i < DEMO_COPIES_PER_SKIN; i++) {
      items.push({
        assetId: `steam_${skin.id}_${nanoid(6)}`,
        skinId: skin.id,
        locked: false,
      });
    }
  }
  // Extra high-value copies so jackpot/coinflip pots feel meatier
  const premium = SKINS.filter(
    (s) => s.rarity === "legendary" || s.rarity === "relic" || s.rarity === "epic",
  );
  for (const skin of premium) {
    for (let i = 0; i < 2; i++) {
      items.push({
        assetId: `steam_${skin.id}_x_${nanoid(6)}`,
        skinId: skin.id,
        locked: false,
      });
    }
  }
  return items;
}

/** Replace demo Steam inventory with a fresh full stack. */
export function restockDemoInventory(user: UserState) {
  user.steamInventory = buildMockSteamInventory();
  saveUser(user);
  return user;
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
    stats: emptyStats(),
    gameHistory: [],
    selfBanUntil: null,
    joinedAt: Date.now(),
  };
}

export function isSelfBanned(user: UserState): boolean {
  return Boolean(user.selfBanUntil && user.selfBanUntil > Date.now());
}

export function assertNotSelfBanned(user: UserState) {
  if (isSelfBanned(user)) {
    const until = new Date(user.selfBanUntil!).toLocaleString();
    throw new Error(`Self-ban active until ${until}. Gambling is locked.`);
  }
}

export function recordGameResult(
  user: UserState,
  opts: {
    game: "coinflip" | "jackpot";
    gameId?: string;
    wagered: number;
    payout: number;
    won: boolean;
    opponentName?: string;
    resultSide?: string;
  },
) {
  const s = user.stats ?? emptyStats();
  s.gamesPlayed += 1;
  s.totalWagered += opts.wagered;
  if (opts.game === "coinflip") s.coinflipsPlayed += 1;
  if (opts.game === "jackpot") s.jackpotsPlayed += 1;
  if (opts.won) {
    s.gamesWon += 1;
    s.totalWon += opts.payout;
    s.biggestWin = Math.max(s.biggestWin, opts.payout);
  } else {
    s.gamesLost += 1;
    s.totalLost += opts.wagered;
  }
  user.stats = s;

  if (!user.gameHistory) user.gameHistory = [];
  user.gameHistory.unshift({
    id: nanoid(10),
    game: opts.game,
    gameId: opts.gameId ?? nanoid(8),
    won: opts.won,
    wagered: opts.wagered,
    payout: opts.payout,
    opponentName: opts.opponentName,
    resultSide: opts.resultSide,
    createdAt: Date.now(),
  });
  // Keep a long but bounded ledger
  if (user.gameHistory.length > 200) {
    user.gameHistory = user.gameHistory.slice(0, 200);
  }
  saveUser(user);
}

export function applySelfBan(user: UserState, durationMs: number) {
  if (durationMs <= 0) throw new Error("Invalid ban duration.");
  const until = Date.now() + durationMs;
  user.selfBanUntil = Math.max(user.selfBanUntil ?? 0, until);
  saveUser(user);
  return user.selfBanUntil;
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

const SETTLED_GRACE_MS = 14_000;

export function getJackpot(): JackpotRound {
  const s = state();
  if (!s.jackpot) {
    s.jackpot = createJackpotRound();
    return s.jackpot;
  }
  if (
    s.jackpot.status === "settled" &&
    s.jackpot.settledAt &&
    Date.now() - s.jackpot.settledAt > SETTLED_GRACE_MS
  ) {
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
    endsAt: Date.now() + 45_000,
    serverSeedHash: hashServerSeed(serverSeed),
    serverSeed,
    clientSeed: "jackpot",
    nonce: 0,
    createdAt: Date.now(),
  };
}

export function rotateJackpotIfNeeded() {
  return getJackpot();
}

export function addHouseItems(items: EscrowItem[], value: number) {
  const s = state();
  s.houseBank.push(...items);
  s.houseEarnings += value;
}

export function publicUser(user: UserState) {
  const banned = isSelfBanned(user);
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
    stats: user.stats ?? emptyStats(),
    gameHistory: (user.gameHistory ?? []).slice(0, 100),
    selfBanUntil: user.selfBanUntil,
    selfBanned: banned,
    joinedAt: user.joinedAt ?? Date.now(),
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
