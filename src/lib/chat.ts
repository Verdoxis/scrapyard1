import { nanoid } from "nanoid";
import { getUser, DEMO_USER_ID } from "./store";

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  text: string;
  createdAt: number;
}

interface Presence {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: number;
}

const g = globalThis as unknown as {
  __scrapyardChat?: {
    messages: ChatMessage[];
    presence: Map<string, Presence>;
  };
};

function chatState() {
  if (!g.__scrapyardChat) {
    g.__scrapyardChat = {
      messages: [
        {
          id: nanoid(8),
          userId: "system",
          displayName: "SCRAPYARD",
          avatarUrl: "/logo.svg",
          text: "Welcome to the yard. Connect Steam, list your skins, and flip or jackpot. House takes 5%.",
          createdAt: Date.now() - 60_000,
        },
      ],
      presence: new Map(),
    };
    // Seed a few ambient survivors so the room never feels empty in demo
    for (const bot of [
      { id: "bot-oil", name: "OilRigRaider", avatar: null as string | null },
      { id: "bot-scrap", name: "ScrapBandit", avatar: null },
      { id: "bot-roof", name: "RoofCamper", avatar: null },
    ]) {
      g.__scrapyardChat.presence.set(bot.id, {
        userId: bot.id,
        displayName: bot.name,
        avatarUrl: bot.avatar,
        lastSeen: Date.now(),
      });
    }
  }
  return g.__scrapyardChat;
}

const ONLINE_TTL_MS = 45_000;

export function heartbeat(opts?: {
  userId?: string;
  displayName?: string;
  avatarUrl?: string | null;
}) {
  const state = chatState();
  const user = getUser();
  const userId = opts?.userId || user.id || DEMO_USER_ID;
  state.presence.set(userId, {
    userId,
    displayName:
      opts?.displayName ||
      (user.steamConnected ? user.displayName : "Survivor"),
    avatarUrl:
      opts?.avatarUrl !== undefined ? opts.avatarUrl : user.avatarUrl || null,
    lastSeen: Date.now(),
  });

  // Keep ambient bots fresh
  for (const [id, p] of state.presence) {
    if (id.startsWith("bot-")) p.lastSeen = Date.now();
  }

  return onlineSnapshot();
}

function prune() {
  const state = chatState();
  const now = Date.now();
  for (const [id, p] of state.presence) {
    if (!id.startsWith("bot-") && now - p.lastSeen > ONLINE_TTL_MS) {
      state.presence.delete(id);
    }
  }
}

export function onlineSnapshot() {
  prune();
  const people = [...chatState().presence.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );
  return {
    count: people.length,
    people: people.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
    })),
  };
}

export function listMessages(limit = 80) {
  return chatState().messages.slice(-limit);
}

export function postMessage(text: string) {
  const cleaned = text.trim().slice(0, 280);
  if (!cleaned) throw new Error("Empty message.");
  const user = getUser();
  if (!user.steamConnected) {
    throw new Error("Connect Steam before chatting.");
  }
  heartbeat({
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  });
  const msg: ChatMessage = {
    id: nanoid(10),
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    text: cleaned,
    createdAt: Date.now(),
  };
  const state = chatState();
  state.messages.push(msg);
  if (state.messages.length > 200) {
    state.messages = state.messages.slice(-200);
  }
  return msg;
}
