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

export interface PublicOwned {
  instanceId: string;
  skinId: string;
  acquiredAt: number;
  source: string;
  skin: Skin | null;
}

export interface PublicUser {
  id: string;
  displayName: string;
  balance: number;
  inventory: PublicOwned[];
  steamTradeUrl: string;
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  trades: Array<{
    id: string;
    type: "deposit" | "withdraw";
    status: string;
    steamTradeUrl: string;
    skinIds: string[];
    instanceIds?: string[];
    totalValue: number;
    createdAt: number;
    updatedAt: number;
    message: string;
  }>;
  history: Array<{
    id: string;
    game: string;
    bet: number;
    payout: number;
    result: string;
    createdAt: number;
  }>;
}

interface BotInfo {
  mode: "mock" | "live";
  ready: boolean;
  botName: string;
  message: string;
}

interface AppCtx {
  user: PublicUser | null;
  inventoryValue: number;
  bot: BotInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  topUp: () => Promise<void>;
  setUser: (user: PublicUser) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{
        user: PublicUser;
        inventoryValue: number;
        bot: BotInfo;
      }>("/api/me");
      setUser(data.user);
      setInventoryValue(data.inventoryValue);
      setBot(data.bot);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const topUp = useCallback(async () => {
    const data = await api<{ balance: number }>("/api/demo/topup", {
      method: "POST",
    });
    setUser((u) => (u ? { ...u, balance: data.balance } : u));
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
        inventoryValue,
        bot,
        loading,
        error,
        refresh,
        topUp,
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
