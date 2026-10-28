"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";

export function ConnectGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-[#a89a8c]">Loading…</p>
    );
  }

  if (!user?.steamConnected) {
    return (
      <div className="mx-auto max-w-lg rounded border border-[rgba(196,92,38,0.3)] bg-[rgba(20,16,12,0.9)] px-6 py-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
          Steam required
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-wide text-[#f3ebe2]">
          Connect Steam to play
        </h2>
        <p className="mt-3 text-sm text-[#a89a8c]">
          Link your trade URL so the bot can send you offers for the skins you
          want to gamble. Your inventory will show up on screen after you
          connect.
        </p>
        <Link
          href="/connect"
          className="mt-6 inline-flex rounded bg-[#c45c26] px-5 py-2.5 font-display text-sm tracking-wider text-[#120e0b] hover:bg-[#e07030]"
        >
          Set up Steam
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
