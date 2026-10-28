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
          One quick step
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-wide text-[#f3ebe2]">
          Connect Steam to get in
        </h2>
        <p className="mt-3 text-sm text-[#a89a8c]">
          Paste your trade URL on Account. We&apos;ll load your skins and the
          bot can send offers when you flip or join jackpot.
        </p>
        <Link
          href="/account"
          className="mt-6 inline-flex rounded bg-[#c45c26] px-5 py-2.5 font-display text-sm tracking-wider text-[#120e0b] hover:bg-[#e07030]"
        >
          Open Account
        </Link>
      </div>
    );
  }

  if (user.selfBanned) {
    return (
      <div className="mx-auto max-w-lg rounded border border-rose-500/40 bg-rose-950/30 px-6 py-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-rose-300">
          Self-ban active
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-wide text-[#f3ebe2]">
          Gambling locked
        </h2>
        <p className="mt-3 text-sm text-[#a89a8c]">
          Your self-ban lasts until{" "}
          <strong className="text-rose-200">
            {user.selfBanUntil
              ? new Date(user.selfBanUntil).toLocaleString()
              : "further notice"}
          </strong>
          . Take the break — you can still browse Account.
        </p>
        <Link
          href="/account"
          className="mt-6 inline-flex rounded bg-[#cd412b] px-5 py-2.5 font-display text-sm tracking-wider text-[#140c08] hover:bg-[#e25a3c]"
        >
          Open account
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
