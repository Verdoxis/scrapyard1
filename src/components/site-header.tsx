"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrice } from "@/lib/skins";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-provider";
import { HOUSE_RAKE_PERCENT } from "@/lib/config";
import { ScrapyardLogo } from "@/components/logo";

const NAV = [
  { href: "/", label: "Lobby" },
  { href: "/coinflip", label: "Coinflip" },
  { href: "/jackpot", label: "Jackpot" },
  { href: "/chat", label: "Chat" },
  { href: "/connect", label: "Connect Steam" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, house, onlineCount, loading } = useApp();

  const siteValue =
    user?.siteInventory.reduce((s, i) => s + (i.skin?.price ?? 0), 0) ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(196,92,38,0.28)] bg-[rgba(10,8,6,0.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0">
          <ScrapyardLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition",
                  active
                    ? "bg-[rgba(196,92,38,0.22)] text-[#f0a060]"
                    : "text-[#a89a8c] hover:text-[#f3ebe2]",
                )}
              >
                {item.label}
                {item.href === "/chat" && onlineCount > 0
                  ? ` (${onlineCount})`
                  : ""}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-sm border border-[rgba(90,158,106,0.35)] bg-[rgba(20,28,18,0.9)] px-2 py-1 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#5a9e6a]" />
            <span className="font-mono text-xs text-[#8fbf98]">
              {onlineCount || "—"} online
            </span>
          </div>

          {user?.steamConnected && user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-sm border border-[rgba(196,92,38,0.45)] object-cover"
              title={user.displayName}
            />
          ) : null}

          <div className="rounded-sm border border-[rgba(196,92,38,0.25)] bg-[rgba(28,22,18,0.9)] px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#8a7d70]">
              {user?.steamConnected ? "Winnings" : "Steam"}
            </p>
            <p className="font-mono text-sm text-[#f0a060]">
              {loading
                ? "…"
                : user?.steamConnected
                  ? formatPrice(siteValue)
                  : "Not linked"}
            </p>
          </div>
          <div className="hidden rounded-sm border border-[rgba(245,158,11,0.25)] bg-[rgba(28,22,18,0.9)] px-3 py-1.5 lg:block">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#8a7d70]">
              House {HOUSE_RAKE_PERCENT}%
            </p>
            <p className="font-mono text-sm text-[#fbbf24]">
              {formatPrice(house?.earnings ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-[rgba(196,92,38,0.12)] px-2 py-2 md:hidden">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-sm px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                active
                  ? "bg-[rgba(196,92,38,0.2)] text-[#f0a060]"
                  : "text-[#a89a8c]",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
