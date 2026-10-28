"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { Skin } from "@/lib/skins";

export interface EnrichedSkinItem {
  assetId?: string;
  instanceId?: string;
  skinId: string;
  locked?: boolean;
  ownerId?: string;
  skin: Skin;
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

export interface PublicUser {
  id: string;
  displayName: string;
  steamConnected: boolean;
  steamTradeUrl: string;
  steamId64: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  steamInventory: EnrichedSkinItem[];
  siteInventory: EnrichedSkinItem[];
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  trades: Array<{
    id: string;
    purpose: string;
    gameId: string;
    status: string;
    totalValue: number;
    message: string;
    createdAt: number;
    steamTradeUrl?: string;
    items: Array<{ skinId: string; assetId: string }>;
  }>;
  stats: UserStats;
  selfBanUntil: number | null;
  selfBanned: boolean;
  joinedAt: number;
}

interface BotInfo {
  mode: "mock" | "live";
  ready: boolean;
  botName: string;
  message: string;
}

interface HouseInfo {
  earnings: number;
  itemCount: number;
  rakePercent: number;
}

interface AppCtx {
  user: PublicUser | null;
  bot: BotInfo | null;
  house: HouseInfo | null;
  onlineCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setUser: (user: PublicUser) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [house, setHouse] = useState<HouseInfo | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{
        user: PublicUser;
        bot: BotInfo;
        house: HouseInfo;
        onlineCount?: number;
      }>("/api/me");
      setUser(data.user);
      setBot(data.bot);
      setHouse(data.house);
      if (typeof data.onlineCount === "number") {
        setOnlineCount(data.onlineCount);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 2000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <Ctx.Provider
      value={{
        user,
        bot,
        house,
        onlineCount,
        loading,
        error,
        refresh,
        setUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
