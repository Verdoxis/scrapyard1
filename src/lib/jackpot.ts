import { botItemsNearValue } from "./bots";
import { fairFloat } from "./fairness";
import { applyRake } from "./rake";
import {
  createGambleTrade,
  forceAcceptPendingTrades,
  tickUserTrades,
} from "./steam-bot";
import {
  addHouseItems,
  assertNotSelfBanned,
  getJackpot,
  getUser,
  itemsValue,
  publicJackpot,
  recordGameResult,
  rotateJackpotIfNeeded,
  saveJackpot,
  saveUser,
  type JackpotDeposit,
  type JackpotRound,
  type UserState,
} from "./store";

const SPIN_DURATION_MS = 7800;
const BOT_AVATARS = [
  "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
  "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg",
];

function requireSteam(user: UserState) {
  if (!user.steamConnected) {
    throw new Error("Connect Steam first — open Account and paste your trade URL.");
  }
  assertNotSelfBanned(user);
}

export function getPublicJackpot() {
  progressJackpot();
  return publicJackpot(getJackpot());
}

export function depositToJackpot(assetIds: string[]) {
  const user = getUser();
  requireSteam(user);
  const round = getJackpot();

  if (round.status !== "open" && round.status !== "awaiting_trades") {
    throw new Error("This jackpot round is locked. Wait for the next round.");
  }

  if (Date.now() > round.endsAt && round.deposits.length > 0) {
    throw new Error("Round is closing — deposits are locked.");
  }

  const trade = createGambleTrade({
    user,
    purpose: "jackpot_deposit",
    gameId: round.id,
    assetIds,
  });

  round.pendingTrades.push(trade.id);
  if (round.status === "open") round.status = "awaiting_trades";
  if (round.deposits.length === 0 && round.pendingTrades.length === 1) {
    round.endsAt = Date.now() + 45_000;
  }

  // Seed rival bot deposits so solo demos can complete a round
  const botCount = round.deposits.filter((d) => d.userId.startsWith("bot-")).length;
  if (botCount < 2) {
    const target = Math.max(trade.totalValue, 200);
    for (let i = botCount; i < 2; i++) {
      const items = botItemsNearValue(target * (0.6 + Math.random() * 0.8));
      round.deposits.push({
        userId: `bot-${i + 1}`,
        displayName: i === 0 ? "OilRigRaider" : "ScrapBandit",
        avatarUrl: BOT_AVATARS[i] ?? BOT_AVATARS[0],
        items,
        value: itemsValue(items),
      });
    }
    round.totalValue = round.deposits.reduce((s, d) => s + d.value, 0);
  }

  saveJackpot(round);
  progressJackpot();
  return { round: publicJackpot(getJackpot()), trade };
}

/** Demo helper — start the spinner once there are enough deposits. */
export function forceJackpotSpin() {
  const user = getUser();
  requireSteam(user);
  const round = getJackpot();
  if (round.status === "spinning" || round.status === "settled") {
    return publicJackpot(round);
  }
  if (round.deposits.length < 2) {
    throw new Error("Need at least two deposits to spin.");
  }
  forceAcceptPendingTrades(user);
  round.endsAt = Date.now() - 1;
  saveJackpot(round);
  return progressJackpot();
}

export function progressJackpot() {
  let round = rotateJackpotIfNeeded();

  if (
    round.status === "spinning" &&
    round.spinEndsAt &&
    Date.now() >= round.spinEndsAt
  ) {
    round.status = "settled";
    if (!round.settledAt) round.settledAt = Date.now();
    saveJackpot(round);
    return publicJackpot(getJackpot());
  }

  if (round.status === "spinning" || round.status === "settled") {
    return publicJackpot(round);
  }

  // Advance pending trades into deposits
  const stillPending: string[] = [];
  for (const tradeId of round.pendingTrades) {
    const owner = findTradeOwner(tradeId);
    if (!owner) {
      stillPending.push(tradeId);
      continue;
    }
    tickUserTrades(owner);
    const trade = owner.trades.find((t) => t.id === tradeId);
    if (!trade) continue;
    if (trade.status === "accepted") {
      const existing = round.deposits.find((d) => d.userId === owner.id);
      if (existing) {
        existing.items.push(...trade.items);
        existing.value = itemsValue(existing.items);
        existing.avatarUrl = owner.avatarUrl;
        existing.displayName = owner.displayName;
      } else {
        const dep: JackpotDeposit = {
          userId: owner.id,
          displayName: owner.displayName,
          avatarUrl: owner.avatarUrl,
          items: [...trade.items],
          value: itemsValue(trade.items),
        };
        round.deposits.push(dep);
      }
      round.totalValue = round.deposits.reduce((s, d) => s + d.value, 0);
    } else if (trade.status === "declined" || trade.status === "expired") {
      // drop
    } else {
      stillPending.push(tradeId);
    }
  }
  round.pendingTrades = stillPending;

  if (
    round.status === "awaiting_trades" &&
    round.pendingTrades.length === 0 &&
    round.deposits.length > 0 &&
    Date.now() < round.endsAt
  ) {
    round.status = "open";
  }

  // Time's up with at least 2 depositors → spin
  if (
    Date.now() >= round.endsAt &&
    round.pendingTrades.length === 0 &&
    (round.status === "open" || round.status === "awaiting_trades")
  ) {
    if (round.deposits.length >= 2) {
      settleJackpot(round);
    } else if (round.deposits.length === 1) {
      refundJackpot(round);
      round = rotateJackpotIfNeeded();
    } else {
      round.endsAt = Date.now() + 45_000;
      round.status = "open";
      saveJackpot(round);
    }
  }

  return publicJackpot(getJackpot());
}

function findTradeOwner(tradeId: string) {
  const user = getUser();
  if (user.trades.some((t) => t.id === tradeId)) return user;
  return null;
}

function settleJackpot(round: JackpotRound) {
  const total = round.deposits.reduce((s, d) => s + d.value, 0);
  if (total <= 0) {
    round.status = "settled";
    round.settledAt = Date.now();
    saveJackpot(round);
    return;
  }

  const roll = fairFloat(
    round.serverSeed!,
    round.clientSeed,
    round.nonce,
  );
  let cursor = 0;
  let winner = round.deposits[0];
  for (const dep of round.deposits) {
    cursor += dep.value / total;
    if (roll <= cursor) {
      winner = dep;
      break;
    }
  }

  round.winnerId = winner.userId;
  round.winningTicket = roll;
  round.spinStartedAt = Date.now();
  round.spinEndsAt = Date.now() + SPIN_DURATION_MS;
  round.status = "spinning";

  const potItems = round.deposits.flatMap((d) => d.items);
  const { winnerItems, houseItems, totalValue, rakeValue } = applyRake(potItems);
  round.totalValue = totalValue;
  round.rakeValue = rakeValue;
  round.winnerItems = winnerItems;
  round.houseItems = houseItems;

  const payoutValue = itemsValue(winnerItems);
  if (winner.userId.startsWith("bot-") || winner.userId === "house-bot") {
    addHouseItems([...winnerItems, ...houseItems], totalValue);
  } else {
    const winnerUser = getUser(winner.userId);
    winnerUser.siteInventory.push(...winnerItems);
    saveUser(winnerUser);
    addHouseItems(houseItems, rakeValue);
  }

  for (const dep of round.deposits) {
    if (dep.userId.startsWith("bot-") || dep.userId === "house-bot") continue;
    recordGameResult(getUser(dep.userId), {
      game: "jackpot",
      gameId: round.id,
      wagered: dep.value,
      payout: dep.userId === winner.userId ? payoutValue : 0,
      won: dep.userId === winner.userId,
      opponentName: winner.displayName,
    });
  }

  saveJackpot(round);
}

function refundJackpot(round: JackpotRound) {
  for (const dep of round.deposits) {
    if (dep.userId.startsWith("bot-")) continue;
    const user = getUser(dep.userId);
    user.siteInventory.push(...dep.items);
    saveUser(user);
  }
  round.status = "settled";
  round.settledAt = Date.now();
  saveJackpot(round);
}

export { SPIN_DURATION_MS };
