import { botItemsNearValue } from "./bots";
import { COINFLIP_VALUE_TOLERANCE } from "./config";
import { fairFloat } from "./fairness";
import { applyRake } from "./rake";
import { createGambleTrade, findAcceptedTrade, tickUserTrades } from "./steam-bot";
import {
  addHouseItems,
  assertNotSelfBanned,
  getCoinflip,
  getCoinflips,
  getUser,
  itemsValue,
  nanoid,
  publicCoinflip,
  recordGameResult,
  saveCoinflip,
  saveUser,
  type CoinSide,
  type CoinflipGame,
  type UserState,
} from "./store";

function requireSteam(user: UserState) {
  if (!user.steamConnected) {
    throw new Error("Connect Steam first — paste your trade URL on the Connect page.");
  }
  assertNotSelfBanned(user);
}

function opposite(side: CoinSide): CoinSide {
  return side === "red" ? "black" : "red";
}

export function listCoinflips() {
  for (const game of getCoinflips()) {
    progressCoinflip(game.id);
  }
  return getCoinflips()
    .filter((g) => g.status !== "cancelled")
    .map(publicCoinflip);
}

export function createCoinflip(assetIds: string[], side: CoinSide) {
  const user = getUser();
  requireSteam(user);

  const trade = createGambleTrade({
    user,
    purpose: "coinflip_create",
    gameId: "pending",
    assetIds,
  });

  const game: CoinflipGame = {
    id: nanoid(10),
    status: "awaiting_creator_trade",
    creatorId: user.id,
    creatorName: user.displayName,
    creatorAvatar: user.avatarUrl,
    creatorSide: side,
    creatorItems: trade.items,
    joinerItems: [],
    totalValue: trade.totalValue,
    rakeValue: 0,
    winnerItems: [],
    houseItems: [],
    serverSeedHash: user.serverSeedHash,
    clientSeed: user.clientSeed,
    nonce: user.nonce,
    createdAt: Date.now(),
  };

  trade.gameId = game.id;
  saveUser(user);
  saveCoinflip(game);
  progressCoinflip(game.id);
  return { game: publicCoinflip(getCoinflip(game.id)!), trade };
}

export function joinCoinflip(gameId: string, assetIds: string[]) {
  const user = getUser();
  requireSteam(user);
  const game = getCoinflip(gameId);
  if (!game) throw new Error("Coinflip not found.");
  if (game.status !== "open") throw new Error("This coinflip is not open to join.");
  if (game.creatorId === user.id) throw new Error("You cannot join your own coinflip.");

  const skins = assetIds.map((id) => {
    const inv = user.steamInventory.find((i) => i.assetId === id);
    if (!inv) throw new Error("Skin not in your inventory.");
    return inv;
  });
  const joinValue = itemsValue(skins);

  const creatorValue = itemsValue(game.creatorItems);
  const diff =
    (Math.abs(joinValue - creatorValue) / Math.max(creatorValue, 1)) * 100;
  if (diff > COINFLIP_VALUE_TOLERANCE) {
    throw new Error(
      `Join value must be within ${COINFLIP_VALUE_TOLERANCE}% of $${(creatorValue / 100).toFixed(2)} (yours: $${(joinValue / 100).toFixed(2)}).`,
    );
  }

  const trade = createGambleTrade({
    user,
    purpose: "coinflip_join",
    gameId: game.id,
    assetIds,
  });

  game.joinerId = user.id;
  game.joinerName = user.displayName;
  game.joinerAvatar = user.avatarUrl;
  game.joinerSide = opposite(game.creatorSide);
  game.joinerItems = trade.items;
  game.status = "awaiting_joiner_trade";
  game.totalValue = itemsValue([...game.creatorItems, ...game.joinerItems]);
  saveCoinflip(game);
  progressCoinflip(game.id);
  return { game: publicCoinflip(getCoinflip(game.id)!), trade };
}

export function progressCoinflip(gameId: string) {
  const game = getCoinflip(gameId);
  if (!game) return null;

  if (game.status === "awaiting_creator_trade") {
    const creator = getUser(game.creatorId);
    tickUserTrades(creator);
    const trade = creator.trades.find(
      (t) => t.gameId === game.id && t.purpose === "coinflip_create",
    );
    if (trade?.status === "accepted") {
      game.status = "open";
      saveCoinflip(game);
    }
  }

  if (
    game.status === "awaiting_joiner_trade" &&
    game.joinerId &&
    game.joinerId !== "house-bot"
  ) {
    const joiner = getUser(game.joinerId);
    const joinTrade = joiner.trades.find(
      (t) => t.gameId === game.id && t.purpose === "coinflip_join",
    );
    if (joinTrade && findAcceptedTrade(joiner, joinTrade.id)) {
      settleCoinflip(game);
    }
  }

  return publicCoinflip(game);
}

/** Instantly join an open coinflip with a bot opponent (solo demo). */
export function callBotOpponent(gameId: string) {
  progressCoinflip(gameId);
  const open = getCoinflip(gameId);
  if (!open) throw new Error("Coinflip not found.");
  if (open.status === "awaiting_creator_trade") {
    throw new Error("Waiting for your Steam trade to complete first.");
  }
  if (open.status !== "open") throw new Error("Coinflip is not open.");

  const items = botItemsNearValue(itemsValue(open.creatorItems));
  open.joinerId = "house-bot";
  open.joinerName = "Scrapyard Bot";
  open.joinerAvatar = "/logo.svg";
  open.joinerSide = opposite(open.creatorSide);
  open.joinerItems = items;
  open.totalValue = itemsValue([...open.creatorItems, ...open.joinerItems]);
  settleCoinflip(open);
  return publicCoinflip(getCoinflip(gameId)!);
}

function settleCoinflip(game: CoinflipGame) {
  if (game.status === "settled") return;
  const creator = getUser(game.creatorId);

  game.status = "flipping";
  const nonce = creator.nonce;
  const roll = fairFloat(creator.serverSeed, game.clientSeed, nonce);
  creator.nonce += 1;
  saveUser(creator);

  const resultSide: CoinSide = roll < 0.5 ? "red" : "black";
  game.resultSide = resultSide;
  game.winnerId =
    resultSide === game.creatorSide ? game.creatorId : game.joinerId;
  game.serverSeed = creator.serverSeed;
  game.nonce = nonce;

  const pot = [...game.creatorItems, ...game.joinerItems];
  const { winnerItems, houseItems, totalValue, rakeValue } = applyRake(pot);
  game.totalValue = totalValue;
  game.rakeValue = rakeValue;
  game.winnerItems = winnerItems;
  game.houseItems = houseItems;

  if (game.winnerId === "house-bot") {
    addHouseItems([...winnerItems, ...houseItems], totalValue);
  } else if (game.winnerId) {
    const winner = getUser(game.winnerId);
    winner.siteInventory.push(...winnerItems);
    saveUser(winner);
    addHouseItems(houseItems, rakeValue);
  }

  const creatorWager = itemsValue(game.creatorItems);
  const joinerWager = itemsValue(game.joinerItems);
  const payoutValue = itemsValue(winnerItems);

  recordGameResult(creator, {
    game: "coinflip",
    wagered: creatorWager,
    payout: game.winnerId === creator.id ? payoutValue : 0,
    won: game.winnerId === creator.id,
  });
  if (game.joinerId && game.joinerId !== "house-bot") {
    recordGameResult(getUser(game.joinerId), {
      game: "coinflip",
      wagered: joinerWager,
      payout: game.winnerId === game.joinerId ? payoutValue : 0,
      won: game.winnerId === game.joinerId,
    });
  }

  game.status = "settled";
  game.settledAt = Date.now();
  saveCoinflip(game);
}
