import { botItemsNearValue } from "./bots";
import { COINFLIP_MAX_CHANCE_DIFF_PERCENT } from "./config";
import {
  coinflipChanceDiffPercent,
  isCoinflipStakeAllowed,
} from "./coinflip-odds";
import { fairFloat, generateServerSeed, hashServerSeed } from "./fairness";
import { applyRake } from "./rake";
import {
  createGambleTrade,
  createPayoutTrade,
  findAcceptedTrade,
  forceAcceptPendingTrades,
  getBotMode,
  tickUserTrades,
} from "./steam-bot";
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

const BOT_LOBBY_AVATARS = [
  "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
  "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg",
  "https://avatars.steamstatic.com/a008f750399356a713c531e15a8ae79d7fa5eae8_full.jpg",
];

const BOT_LOBBY_NAMES = ["OilRigRaider", "ScrapBandit", "RoofCamper"];

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
  seedBotOpenFlips();
  for (const game of getCoinflips()) {
    progressCoinflip(game.id);
  }
  return getCoinflips()
    .filter((g) => g.status !== "cancelled")
    .map(publicCoinflip);
}

/** Keep a few bot-hosted open lobbies so you can join and test. */
export function seedBotOpenFlips() {
  const openBots = getCoinflips().filter(
    (g) => g.status === "open" && g.creatorId.startsWith("bot-lobby"),
  );
  if (openBots.length >= 3) return;

  const targets = [
    { cents: 180, name: BOT_LOBBY_NAMES[0], avatar: BOT_LOBBY_AVATARS[0] },
    { cents: 420, name: BOT_LOBBY_NAMES[1], avatar: BOT_LOBBY_AVATARS[1] },
    { cents: 780, name: BOT_LOBBY_NAMES[2], avatar: BOT_LOBBY_AVATARS[2] },
  ];

  for (let i = 0; i < targets.length; i++) {
    const creatorId = `bot-lobby-${i + 1}`;
    if (openBots.some((g) => g.creatorId === creatorId)) continue;

    const t = targets[i];
    const items = botItemsNearValue(t.cents);
    const serverSeed = generateServerSeed();
    const side: CoinSide = i % 2 === 0 ? "red" : "black";
    const game: CoinflipGame = {
      id: nanoid(10),
      status: "open",
      creatorId,
      creatorName: t.name,
      creatorAvatar: t.avatar,
      creatorSide: side,
      creatorItems: items,
      joinerItems: [],
      totalValue: itemsValue(items),
      rakeValue: 0,
      winnerItems: [],
      houseItems: [],
      serverSeedHash: hashServerSeed(serverSeed),
      serverSeed,
      clientSeed: creatorId,
      nonce: Math.floor(Math.random() * 1000),
      createdAt: Date.now() - i * 1000,
    };
    saveCoinflip(game);
  }
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
  if (!isCoinflipStakeAllowed(creatorValue, joinValue)) {
    const gap = coinflipChanceDiffPercent(creatorValue, joinValue).toFixed(1);
    throw new Error(
      `Stakes too far apart — win-chance gap would be ${gap}% (max ${COINFLIP_MAX_CHANCE_DIFF_PERCENT}%). Theirs $${(creatorValue / 100).toFixed(2)}, yours $${(joinValue / 100).toFixed(2)}.`,
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

  // Mock bot: accept the join trade immediately so the flip can resolve
  if (getBotMode() === "mock") {
    forceAcceptPendingTrades(user);
  }
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

function isBotId(id: string | undefined) {
  return Boolean(
    id &&
      (id === "house-bot" ||
        id.startsWith("bot-") ||
        id.startsWith("bot-lobby")),
  );
}

function settleCoinflip(game: CoinflipGame) {
  if (game.status === "settled") return;

  const seed =
    game.serverSeed ||
    (isBotId(game.creatorId)
      ? generateServerSeed()
      : getUser(game.creatorId).serverSeed);
  const nonce = isBotId(game.creatorId)
    ? game.nonce
    : getUser(game.creatorId).nonce;

  if (!isBotId(game.creatorId)) {
    const creator = getUser(game.creatorId);
    creator.nonce += 1;
    saveUser(creator);
  }

  game.status = "flipping";
  const roll = fairFloat(seed, game.clientSeed, nonce);

  // Odds scale with stake — putting in more raises your chance to win
  const creatorWager = itemsValue(game.creatorItems);
  const joinerWager = itemsValue(game.joinerItems);
  const stakeTotal = Math.max(1, creatorWager + joinerWager);
  const creatorChance = creatorWager / stakeTotal;
  const creatorWins = roll < creatorChance;
  const resultSide: CoinSide = creatorWins
    ? game.creatorSide
    : (game.joinerSide ?? opposite(game.creatorSide));
  game.resultSide = resultSide;
  game.winnerId = creatorWins ? game.creatorId : game.joinerId;
  game.serverSeed = seed;
  game.nonce = nonce;

  const pot = [...game.creatorItems, ...game.joinerItems];
  const { winnerItems, houseItems, totalValue, rakeValue } = applyRake(pot);
  game.totalValue = totalValue;
  game.rakeValue = rakeValue;
  game.winnerItems = winnerItems;
  game.houseItems = houseItems;

  if (isBotId(game.winnerId)) {
    addHouseItems([...winnerItems, ...houseItems], totalValue);
  } else if (game.winnerId) {
    const winner = getUser(game.winnerId);
    // Hold winnings until they accept the Steam payout trade
    winner.siteInventory.push(...winnerItems);
    const payout = createPayoutTrade({
      user: winner,
      purpose: "coinflip_payout",
      gameId: game.id,
      items: winnerItems,
    });
    game.payoutTradeId = payout.id;
    saveUser(winner);
    addHouseItems(houseItems, rakeValue);
  }

  const payoutValue = itemsValue(winnerItems);

  if (!isBotId(game.creatorId)) {
    const creator = getUser(game.creatorId);
    recordGameResult(creator, {
      game: "coinflip",
      wagered: creatorWager,
      payout: game.winnerId === creator.id ? payoutValue : 0,
      won: game.winnerId === creator.id,
    });
  }
  if (game.joinerId && !isBotId(game.joinerId)) {
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
