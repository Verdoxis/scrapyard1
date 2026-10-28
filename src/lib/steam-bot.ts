/**
 * Steam trade bot — mock by default.
 * When a user selects skins to gamble, the bot sends a trade offer for those items.
 */

import {
  getUser,
  saveUser,
  type EscrowItem,
  type TradeOffer,
  type TradeStatus,
  type UserState,
  nanoid,
  itemsValue,
} from "./store";

export function getBotMode(): "mock" | "live" {
  return process.env.STEAM_BOT_MODE === "live" ? "live" : "mock";
}

function liveCredentialsPresent() {
  return Boolean(
    process.env.STEAM_ACCOUNT_NAME &&
      process.env.STEAM_PASSWORD &&
      process.env.STEAM_SHARED_SECRET &&
      process.env.STEAM_IDENTITY_SECRET &&
      process.env.STEAM_BOT_STEAM_ID,
  );
}

export function botStatus() {
  const mode = getBotMode();
  if (mode === "mock") {
    return {
      mode,
      ready: true,
      botName: process.env.STEAM_BOT_NAME || "Scrapyard Bot (Mock)",
      message:
        "Mock bot: trade offers auto-accept so you can play end-to-end without a real Steam bot.",
    };
  }

  const ready = liveCredentialsPresent();
  return {
    mode,
    ready,
    botName: process.env.STEAM_BOT_NAME || "Scrapyard Bot",
    message: ready
      ? "Live mode credentials detected. Hook sendLiveTrade() / offer polling to steamcommunity before taking real deposits."
      : "Live mode is on, but Steam bot env vars are incomplete — fill .env from .env.example.",
  };
}

export function createGambleTrade(opts: {
  user: UserState;
  purpose: TradeOffer["purpose"];
  gameId: string;
  assetIds: string[];
}): TradeOffer {
  const { user, purpose, gameId, assetIds } = opts;

  if (!user.steamConnected || !user.steamTradeUrl) {
    throw new Error("Connect your Steam trade URL before gambling.");
  }
  if (assetIds.length === 0) {
    throw new Error("Select at least one skin.");
  }

  const items: EscrowItem[] = assetIds.map((assetId) => {
    const inv = user.steamInventory.find((i) => i.assetId === assetId);
    if (!inv) throw new Error(`Skin ${assetId} not in your Steam inventory.`);
    if (inv.locked) throw new Error(`Skin ${assetId} is already locked in a trade.`);
    return {
      instanceId: nanoid(10),
      skinId: inv.skinId,
      assetId: inv.assetId,
      ownerId: user.id,
    };
  });

  for (const item of items) {
    const inv = user.steamInventory.find((i) => i.assetId === item.assetId);
    if (inv) inv.locked = true;
  }

  const trade: TradeOffer = {
    id: nanoid(12),
    purpose,
    gameId,
    status: "pending",
    steamTradeUrl: user.steamTradeUrl,
    items,
    totalValue: itemsValue(items),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    message: "Bot is sending you a trade offer for the selected skins…",
  };

  user.trades.unshift(trade);
  saveUser(user);
  return trade;
}

function isPayout(purpose: TradeOffer["purpose"]) {
  return purpose === "coinflip_payout" || purpose === "jackpot_payout";
}

function advanceTrade(user: UserState, trade: TradeOffer) {
  if (trade.status === "accepted" || trade.status === "declined") return false;
  // Payouts wait for the player to accept via the win modal / Steam link
  if (isPayout(trade.purpose)) return false;

  const age = Date.now() - trade.createdAt;
  let next: TradeStatus = trade.status;
  if (age > 3500) next = "accepted";
  else if (age > 1200) next = "sent";

  if (next === trade.status) return false;

  trade.status = next;
  trade.updatedAt = Date.now();

  if (next === "sent") {
    trade.message =
      "Trade offer sent to your Steam. Accept it to put skins into the game.";
  }

  if (next === "accepted") {
    // Remove from Steam inventory — now in escrow for the game
    const assetSet = new Set(trade.items.map((i) => i.assetId));
    user.steamInventory = user.steamInventory.filter(
      (i) => !assetSet.has(i.assetId),
    );
    trade.message = "Trade accepted — skins are in escrow for the game.";
  }

  saveUser(user);
  return true;
}

export function tickUserTrades(user: UserState) {
  if (getBotMode() !== "mock") return;
  for (const trade of user.trades) {
    if (trade.status === "pending" || trade.status === "sent") {
      advanceTrade(user, trade);
    }
  }
}

export function getTrade(user: UserState, tradeId: string) {
  return user.trades.find((t) => t.id === tradeId);
}

export function findAcceptedTrade(user: UserState, tradeId: string) {
  tickUserTrades(user);
  const trade = getTrade(user, tradeId);
  return trade?.status === "accepted" ? trade : null;
}

/** Force-accept for tests / mock speed-up after enough time */
export function forceAcceptIfReady(userId: string, tradeId: string) {
  const user = getUser(userId);
  tickUserTrades(user);
  return getTrade(user, tradeId);
}

/** Instantly accept open mock deposit trades (demo spin / testing). */
export function forceAcceptPendingTrades(user: UserState) {
  if (getBotMode() !== "mock") return;
  for (const trade of user.trades) {
    if (isPayout(trade.purpose)) continue;
    if (trade.status !== "pending" && trade.status !== "sent") continue;
    trade.status = "accepted";
    trade.updatedAt = Date.now();
    trade.message = "Trade accepted — skins are in escrow for the game.";
    const assetSet = new Set(trade.items.map((i) => i.assetId));
    user.steamInventory = user.steamInventory.filter(
      (i) => !assetSet.has(i.assetId),
    );
  }
  saveUser(user);
}

/** Bot sends winnings to the player — they open the link to accept. */
export function createPayoutTrade(opts: {
  user: UserState;
  purpose: "coinflip_payout" | "jackpot_payout";
  gameId: string;
  items: EscrowItem[];
}): TradeOffer {
  const { user, purpose, gameId, items } = opts;
  const offerId = nanoid(8);
  const trade: TradeOffer = {
    id: nanoid(12),
    purpose,
    gameId,
    status: "sent",
    steamTradeUrl: `https://steamcommunity.com/tradeoffer/${offerId}/`,
    items: items.map((i) => ({ ...i, ownerId: user.id })),
    totalValue: itemsValue(items),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    message:
      "You won! Open the Steam trade offer and accept to receive your skins.",
  };
  user.trades.unshift(trade);
  saveUser(user);
  return trade;
}

/** Player accepted the payout trade — skins land in Steam inventory. */
export function acceptPayoutTrade(user: UserState, tradeId: string) {
  const trade = user.trades.find((t) => t.id === tradeId);
  if (!trade) throw new Error("Trade not found.");
  if (!isPayout(trade.purpose)) {
    throw new Error("This is not a payout trade.");
  }
  if (trade.status === "accepted") return trade;

  trade.status = "accepted";
  trade.updatedAt = Date.now();
  trade.message = "Trade accepted — winnings are in your Steam inventory.";

  for (const item of trade.items) {
    user.steamInventory.push({
      assetId: `won_${item.skinId}_${nanoid(6)}`,
      skinId: item.skinId,
      locked: false,
    });
  }
  // Clear matching site-inventory holds if any
  const wonIds = new Set(trade.items.map((i) => i.instanceId));
  user.siteInventory = user.siteInventory.filter((i) => !wonIds.has(i.instanceId));
  saveUser(user);
  return trade;
}
