/**
 * Steam trade bot adapter.
 *
 * Default: MOCK mode — simulates trade offers so the site is fully playable
 * without Steam credentials.
 *
 * Live mode: set STEAM_BOT_MODE=live and provide:
 *   STEAM_ACCOUNT_NAME
 *   STEAM_PASSWORD
 *   STEAM_SHARED_SECRET
 *   STEAM_IDENTITY_SECRET
 *   STEAM_BOT_STEAM_ID
 *
 * Live mode requires steam-user / steam-tradeoffer-manager packages and a
 * dedicated bot account. Wire those in sendLiveTrade() when ready.
 */

import { nanoid } from "nanoid";
import type { TradeOffer, TradeStatus, UserState } from "./store";
import { getSkin } from "./skins";
import { saveUser } from "./store";

export type BotMode = "mock" | "live";

export function getBotMode(): BotMode {
  return process.env.STEAM_BOT_MODE === "live" ? "live" : "mock";
}

export function botStatus() {
  const mode = getBotMode();
  const ready =
    mode === "mock" ||
    Boolean(
      process.env.STEAM_ACCOUNT_NAME &&
        process.env.STEAM_PASSWORD &&
        process.env.STEAM_SHARED_SECRET &&
        process.env.STEAM_IDENTITY_SECRET,
    );
  return {
    mode,
    ready,
    botName:
      mode === "mock"
        ? "Scrapyard Bot (Mock)"
        : process.env.STEAM_BOT_NAME || "Scrapyard Bot",
    message:
      mode === "mock"
        ? "Running in mock mode — trades auto-complete locally. No real Steam items move."
        : ready
          ? "Live Steam bot credentials detected."
          : "Live mode selected but Steam credentials are missing.",
  };
}

function advanceMockTrade(user: UserState, tradeId: string) {
  const trade = user.trades.find((t) => t.id === tradeId);
  if (!trade || trade.status === "accepted" || trade.status === "declined") {
    return;
  }

  // pending -> sent after ~1.5s, accepted after ~4s
  const age = Date.now() - trade.createdAt;
  let next: TradeStatus = trade.status;
  if (age > 4000) next = "accepted";
  else if (age > 1500) next = "sent";

  if (next === trade.status) return;

  trade.status = next;
  trade.updatedAt = Date.now();

  if (next === "sent") {
    trade.message =
      trade.type === "deposit"
        ? "Mock bot sent a trade offer. Accepting automatically…"
        : "Mock bot is sending your skins…";
  }

  if (next === "accepted") {
    if (trade.type === "deposit") {
      for (const skinId of trade.skinIds) {
        user.inventory.push({
          instanceId: nanoid(10),
          skinId,
          acquiredAt: Date.now(),
          source: "deposit",
        });
      }
      trade.message = `Deposit complete — ${trade.skinIds.length} skin(s) added to site inventory.`;
    } else {
      const remove = new Set(trade.instanceIds ?? []);
      user.inventory = user.inventory.filter((i) => !remove.has(i.instanceId));
      trade.message = `Withdraw complete — ${trade.skinIds.length} skin(s) sent to your Steam.`;
    }
  }

  saveUser(user);
}

export function tickTrades(user: UserState) {
  if (getBotMode() !== "mock") return;
  for (const trade of user.trades) {
    if (trade.status === "pending" || trade.status === "sent") {
      advanceMockTrade(user, trade.id);
    }
  }
}

export function createDepositTrade(
  user: UserState,
  steamTradeUrl: string,
  skinIds: string[],
): TradeOffer {
  if (!steamTradeUrl.includes("steamcommunity.com/tradeoffer/new")) {
    throw new Error(
      "Invalid Steam trade URL. It should look like https://steamcommunity.com/tradeoffer/new/?partner=…&token=…",
    );
  }
  if (skinIds.length === 0) {
    throw new Error("Select at least one skin to deposit.");
  }

  const totalValue = skinIds.reduce(
    (sum, id) => sum + (getSkin(id)?.price ?? 0),
    0,
  );

  const trade: TradeOffer = {
    id: nanoid(12),
    type: "deposit",
    status: "pending",
    steamTradeUrl,
    skinIds,
    totalValue,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    message:
      getBotMode() === "mock"
        ? "Mock bot preparing trade offer…"
        : "Bot queueing live Steam trade offer…",
  };

  user.steamTradeUrl = steamTradeUrl;
  user.trades.unshift(trade);
  saveUser(user);

  if (getBotMode() === "live") {
    void sendLiveTrade(trade).catch((err) => {
      trade.status = "declined";
      trade.message = `Live trade failed: ${err instanceof Error ? err.message : "unknown error"}`;
      trade.updatedAt = Date.now();
      saveUser(user);
    });
  }

  return trade;
}

export function createWithdrawTrade(
  user: UserState,
  steamTradeUrl: string,
  instanceIds: string[],
): TradeOffer {
  if (!steamTradeUrl.includes("steamcommunity.com/tradeoffer/new")) {
    throw new Error(
      "Invalid Steam trade URL. It should look like https://steamcommunity.com/tradeoffer/new/?partner=…&token=…",
    );
  }
  if (instanceIds.length === 0) {
    throw new Error("Select at least one skin to withdraw.");
  }

  const owned = instanceIds.map((id) => {
    const item = user.inventory.find((i) => i.instanceId === id);
    if (!item) throw new Error(`Skin ${id} not in your inventory.`);
    return item;
  });

  const skinIds = owned.map((o) => o.skinId);
  const totalValue = skinIds.reduce(
    (sum, id) => sum + (getSkin(id)?.price ?? 0),
    0,
  );

  const trade: TradeOffer = {
    id: nanoid(12),
    type: "withdraw",
    status: "pending",
    steamTradeUrl,
    skinIds,
    instanceIds,
    totalValue,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    message:
      getBotMode() === "mock"
        ? "Mock bot preparing withdraw offer…"
        : "Bot queueing live Steam withdraw…",
  };

  user.steamTradeUrl = steamTradeUrl;
  user.trades.unshift(trade);
  saveUser(user);

  if (getBotMode() === "live") {
    void sendLiveTrade(trade).catch((err) => {
      trade.status = "declined";
      trade.message = `Live trade failed: ${err instanceof Error ? err.message : "unknown error"}`;
      trade.updatedAt = Date.now();
      saveUser(user);
    });
  }

  return trade;
}

/**
 * Placeholder for a real Steam bot integration.
 * Install steam-user, steam-totp, steam-tradeoffer-manager and implement here.
 */
async function sendLiveTrade(trade: TradeOffer): Promise<void> {
  if (!botStatus().ready) {
    throw new Error(
      "Steam bot credentials missing. Set STEAM_* env vars or use mock mode.",
    );
  }
  // Real implementation would:
  // 1. Login with steam-user + steam-totp
  // 2. Create TradeOfferManager offer to partner/token from trade.steamTradeUrl
  // 3. Add items (deposit: receive user's items; withdraw: send bot items)
  // 4. Send offer and poll until accepted
  console.info("[steam-bot] live trade queued", trade.id);
  throw new Error(
    "Live Steam bot not wired yet — install steam packages and implement sendLiveTrade(), or set STEAM_BOT_MODE=mock.",
  );
}
