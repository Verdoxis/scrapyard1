import fs from "fs";
import path from "path";
import type {
  CoinflipGame,
  EscrowItem,
  JackpotRound,
  UserState,
} from "./store";

export type PersistedSnapshot = {
  version: 1;
  savedAt: number;
  users: UserState[];
  coinflips: CoinflipGame[];
  jackpot: JackpotRound | null;
  houseBank: EscrowItem[];
  houseEarnings: number;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_PATH = path.join(DATA_DIR, "scrapyard.json");

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let lastPayload = "";

function canUseFs() {
  return typeof window === "undefined";
}

export function loadSnapshot(): PersistedSnapshot | null {
  if (!canUseFs()) return null;
  try {
    if (!fs.existsSync(DATA_PATH)) return null;
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const data = JSON.parse(raw) as PersistedSnapshot;
    if (!data || data.version !== 1 || !Array.isArray(data.users)) return null;
    return data;
  } catch {
    return null;
  }
}

export function scheduleSave(snapshot: PersistedSnapshot) {
  if (!canUseFs()) return;
  const payload = JSON.stringify(snapshot);
  if (payload === lastPayload) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = `${DATA_PATH}.tmp`;
      fs.writeFileSync(tmp, payload, "utf8");
      fs.renameSync(tmp, DATA_PATH);
      lastPayload = payload;
    } catch (err) {
      console.error("[scrapyard] failed to persist state", err);
    }
  }, 250);
}

export function dataFilePath() {
  return DATA_PATH;
}
