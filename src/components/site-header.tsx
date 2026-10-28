"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrice } from "@/lib/skins";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Cases" },
  { href: "/roulette", label: "Roulette" },
  { href: "/coinflip", label: "Coinflip" },
  { href: "/inventory", label: "Inventory" },
  { href: "/trades", label: "Steam Bot" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, bot, refresh, topUp, loading } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(196,92,38,0.2)] bg-[rgba(12,10,8,0.88)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-[0.12em] text-[#f3ebe2] sm:text-3xl">
            SCRAPYARD
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.28em] text-[#c45c26] sm:inline">
            Rust skins
          </span>
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
                  "rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition",
                  active
                    ? "bg-[rgba(196,92,38,0.2)] text-[#f0a060]"
                    : "text-[#a89a8c] hover:text-[#f3ebe2]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="rounded border border-[rgba(196,92,38,0.25)] bg-[rgba(28,22,18,0.9)] px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#8a7d70]">
              Balance
            </p>
            <p className="font-mono text-sm text-[#f0a060]">
              {loading || !user ? "…" : formatPrice(user.balance)}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-[rgba(196,92,38,0.4)] bg-transparent text-[#f0a060] hover:bg-[rgba(196,92,38,0.15)] hover:text-[#f3ebe2]"
            onClick={() => topUp()}
          >
            +$25
          </Button>
          <Button
            size="sm"
            className="hidden bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030] sm:inline-flex"
            onClick={() => refresh()}
          >
            {bot?.mode === "mock" ? "Mock Bot" : "Live Bot"}
          </Button>
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
                "shrink-0 rounded px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
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
