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

export function botStatus() {
  const mode = getBotMode();
  return {
    mode,
    ready: mode === "mock",
    botName: mode === "mock" ? "Scrapyard Bot (Mock)" : "Scrapyard Bot",
    message:
      mode === "mock"
        ? "Mock bot: trade offers auto-accept so you can play without a real Steam account."
        : "Live bot mode — wire sendLiveTrade() with your Steam credentials.",
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

function advanceTrade(user: UserState, trade: TradeOffer) {
  if (trade.status === "accepted" || trade.status === "declined") return false;

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

/** Instantly accept open mock trades (demo spin / testing). */
export function forceAcceptPendingTrades(user: UserState) {
  if (getBotMode() !== "mock") return;
  for (const trade of user.trades) {
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
