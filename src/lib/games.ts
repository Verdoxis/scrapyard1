import { nanoid } from "nanoid";
import { getCase, rollCaseSkin } from "./cases";
import { fairFloat } from "./fairness";
import { getSkin, type Skin } from "./skins";
import {
  getUser,
  saveUser,
  type GameRound,
  type OwnedSkin,
  type UserState,
} from "./store";

function nextFloat(user: UserState) {
  const value = fairFloat(user.serverSeed, user.clientSeed, user.nonce);
  user.nonce += 1;
  return value;
}

function record(
  user: UserState,
  game: GameRound["game"],
  bet: number,
  payout: number,
  result: string,
  nonce: number,
) {
  const round: GameRound = {
    id: nanoid(10),
    game,
    bet,
    payout,
    result,
    serverSeedHash: user.serverSeedHash,
    serverSeed: user.serverSeed,
    clientSeed: user.clientSeed,
    nonce,
    createdAt: Date.now(),
  };
  user.history.unshift(round);
  saveUser(user);
  return round;
}

export function openCase(caseId: string) {
  const user = getUser();
  const caseDef = getCase(caseId);
  if (!caseDef) throw new Error("Case not found.");
  if (user.balance < caseDef.price) {
    throw new Error("Insufficient balance. Deposit skins or win more coins.");
  }

  const nonce = user.nonce;
  const roll = nextFloat(user);
  const skin = rollCaseSkin(caseDef, () => roll);

  user.balance -= caseDef.price;
  const owned: OwnedSkin = {
    instanceId: nanoid(10),
    skinId: skin.id,
    acquiredAt: Date.now(),
    source: "case",
  };
  user.inventory.push(owned);

  const round = record(
    user,
    "case",
    caseDef.price,
    skin.price,
    `${skin.weapon} | ${skin.name}`,
    nonce,
  );

  return { skin, owned, round, balance: user.balance };
}

export type RouletteColor = "red" | "black" | "green";

export function playRoulette(betAmount: number, color: RouletteColor) {
  const user = getUser();
  if (betAmount < 10) throw new Error("Minimum bet is $0.10.");
  if (user.balance < betAmount) throw new Error("Insufficient balance.");

  const nonce = user.nonce;
  const roll = nextFloat(user);
  // 15 slots: 7 red, 7 black, 1 green
  const slot = Math.floor(roll * 15);
  const resultColor: RouletteColor =
    slot === 0 ? "green" : slot % 2 === 0 ? "red" : "black";

  const multipliers: Record<RouletteColor, number> = {
    red: 2,
    black: 2,
    green: 14,
  };

  user.balance -= betAmount;
  let payout = 0;
  if (resultColor === color) {
    payout = Math.floor(betAmount * multipliers[color]);
    user.balance += payout;
  }

  const round = record(
    user,
    "roulette",
    betAmount,
    payout,
    `${resultColor}:${slot}`,
    nonce,
  );

  return {
    resultColor,
    slot,
    won: payout > 0,
    payout,
    balance: user.balance,
    round,
  };
}

export function playCoinflip(betAmount: number, side: "ct" | "t") {
  const user = getUser();
  if (betAmount < 10) throw new Error("Minimum bet is $0.10.");
  if (user.balance < betAmount) throw new Error("Insufficient balance.");

  const nonce = user.nonce;
  const roll = nextFloat(user);
  const result: "ct" | "t" = roll < 0.5 ? "ct" : "t";

  user.balance -= betAmount;
  let payout = 0;
  const won = result === side;
  if (won) {
    payout = betAmount * 2;
    user.balance += payout;
  }

  const round = record(
    user,
    "coinflip",
    betAmount,
    payout,
    result,
    nonce,
  );

  return { result, won, payout, balance: user.balance, round };
}

/** Sell a skin from inventory for balance credit */
export function sellSkin(instanceId: string) {
  const user = getUser();
  const idx = user.inventory.findIndex((i) => i.instanceId === instanceId);
  if (idx < 0) throw new Error("Skin not found in inventory.");
  const item = user.inventory[idx];
  const skin = getSkin(item.skinId);
  if (!skin) throw new Error("Unknown skin.");

  user.inventory.splice(idx, 1);
  // 95% instant sell to site
  const credit = Math.floor(skin.price * 0.95);
  user.balance += credit;
  saveUser(user);
  return { credit, balance: user.balance, skin };
}

export function sellAll() {
  const user = getUser();
  let credit = 0;
  const sold: Skin[] = [];
  for (const item of [...user.inventory]) {
    const skin = getSkin(item.skinId);
    if (!skin) continue;
    credit += Math.floor(skin.price * 0.95);
    sold.push(skin);
  }
  user.inventory = [];
  user.balance += credit;
  saveUser(user);
  return { credit, balance: user.balance, count: sold.length };
}

export function setClientSeed(seed: string) {
  const user = getUser();
  if (!seed || seed.length < 3) throw new Error("Client seed too short.");
  user.clientSeed = seed.slice(0, 64);
  saveUser(user);
  return { clientSeed: user.clientSeed };
}

export function addDemoBalance(amount = 1000) {
  const user = getUser();
  user.balance += amount;
  saveUser(user);
  return { balance: user.balance };
}
