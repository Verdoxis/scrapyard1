"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrice } from "@/lib/skins";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-provider";
import { ScrapyardLogo } from "@/components/logo";

const NAV = [
  { href: "/", label: "Lobby" },
  { href: "/coinflip", label: "Coinflip" },
  { href: "/jackpot", label: "Jackpot" },
  { href: "/chat", label: "Chat" },
  { href: "/account", label: "Account" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, onlineCount, loading } = useApp();

  const siteValue =
    user?.siteInventory.reduce((s, i) => s + (i.skin?.price ?? 0), 0) ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(196,92,38,0.2)] bg-[rgba(10,8,6,0.88)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:py-3">
        <Link href="/" className="shrink-0 scale-[0.92] origin-left sm:scale-100">
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
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs text-[#6b6258] sm:inline">
            {onlineCount || "—"} online
          </span>

          {user?.selfBanned && (
            <Link
              href="/account"
              className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-300 sm:inline"
            >
              Banned
            </Link>
          )}

          <Link href="/account" className="flex items-center gap-2">
            {user?.steamConnected && user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-sm object-cover"
                title={user.displayName}
              />
            ) : null}
            <span className="font-mono text-sm text-[#f0a060]">
              {loading
                ? "…"
                : user?.steamConnected
                  ? formatPrice(siteValue)
                  : "Account"}
            </span>
          </Link>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-2 md:hidden">
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
